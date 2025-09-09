/*
  # Добавление системы префиксов для кадетов

  1. Новые таблицы
    - `cadet_prefixes` - доступные префиксы (атаман, ЗКВ и т.д.)
    - `cadet_assigned_prefixes` - назначенные префиксы кадетам

  2. Изменения в существующих таблицах
    - Добавляем поле `display_name` в таблицу `cadets` для отображения имени с префиксами

  3. Безопасность
    - Включаем RLS для новых таблиц
    - Добавляем политики для чтения и управления префиксами
*/

-- Создаем таблицу префиксов
CREATE TABLE IF NOT EXISTS cadet_prefixes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  color text DEFAULT 'from-blue-500 to-blue-700',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Создаем таблицу назначенных префиксов
CREATE TABLE IF NOT EXISTS cadet_assigned_prefixes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cadet_id uuid NOT NULL REFERENCES cadets(id) ON DELETE CASCADE,
  prefix_id uuid NOT NULL REFERENCES cadet_prefixes(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(cadet_id, prefix_id)
);

-- Добавляем поле display_name в таблицу cadets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cadets' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE cadets ADD COLUMN display_name text;
  END IF;
END $$;

-- Включаем RLS
ALTER TABLE cadet_prefixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cadet_assigned_prefixes ENABLE ROW LEVEL SECURITY;

-- Политики для cadet_prefixes
CREATE POLICY "Everyone can read active prefixes"
  ON cadet_prefixes
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage prefixes"
  ON cadet_prefixes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Политики для cadet_assigned_prefixes
CREATE POLICY "Everyone can read assigned prefixes"
  ON cadet_assigned_prefixes
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage assigned prefixes"
  ON cadet_assigned_prefixes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Функция для обновления display_name кадета
CREATE OR REPLACE FUNCTION update_cadet_display_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Получаем все активные префиксы кадета
  WITH cadet_prefixes_list AS (
    SELECT cp.display_name
    FROM cadet_assigned_prefixes cap
    JOIN cadet_prefixes cp ON cap.prefix_id = cp.id
    WHERE cap.cadet_id = COALESCE(NEW.cadet_id, OLD.cadet_id)
    AND cap.is_active = true
    AND cp.is_active = true
    ORDER BY cp.sort_order, cp.display_name
  )
  UPDATE cadets 
  SET display_name = CASE 
    WHEN EXISTS (SELECT 1 FROM cadet_prefixes_list) THEN
      (SELECT string_agg(display_name, ' ') FROM cadet_prefixes_list) || ' ' || cadets.name
    ELSE 
      cadets.name
  END,
  updated_at = now()
  WHERE id = COALESCE(NEW.cadet_id, OLD.cadet_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления display_name
CREATE TRIGGER update_cadet_display_name_trigger
  AFTER INSERT OR UPDATE OR DELETE ON cadet_assigned_prefixes
  FOR EACH ROW
  EXECUTE FUNCTION update_cadet_display_name();

-- Добавляем базовые префиксы
INSERT INTO cadet_prefixes (name, display_name, description, color, sort_order) VALUES
  ('ataman', 'Атаман', 'Высший чин казачьего войска', 'from-red-600 to-red-800', 1),
  ('zkv', 'ЗКВ', 'Заместитель командира взвода', 'from-blue-600 to-blue-800', 2),
  ('starshina', 'Старшина', 'Старший по званию', 'from-green-600 to-green-800', 3),
  ('desyatnik', 'Десятник', 'Командир десятка', 'from-purple-600 to-purple-800', 4),
  ('uryadnik', 'Урядник', 'Младший командный состав', 'from-yellow-600 to-yellow-800', 5)
ON CONFLICT (name) DO NOTHING;

-- Обновляем display_name для всех существующих кадетов
UPDATE cadets SET display_name = name WHERE display_name IS NULL;