/*
  # Создание структуры Атаманского совета

  1. Новые таблицы
    - `council_positions` - должности в совете (атаман, зам атамана, командир штаба, подчиненный)
    - `council_staffs` - штабы (разные направления деятельности)
    - `council_members` - члены совета с назначенными должностями
    - `council_hierarchy` - иерархия подчинения

  2. Безопасность
    - Включение RLS для всех таблиц
    - Политики для чтения всеми и управления администраторами

  3. Связи
    - Связь с таблицей cadets для назначения кадетов на должности
    - Иерархическая структура подчинения
*/

-- Создаем таблицу должностей в совете
CREATE TABLE IF NOT EXISTS council_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  level integer NOT NULL DEFAULT 0, -- 0=атаман, 1=зам атамана, 2=командир штаба, 3=подчиненный
  color text DEFAULT 'from-blue-500 to-blue-700',
  icon text DEFAULT 'Crown',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Создаем таблицу штабов
CREATE TABLE IF NOT EXISTS council_staffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  color text DEFAULT 'from-green-500 to-green-700',
  icon text DEFAULT 'Users',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Создаем таблицу членов совета
CREATE TABLE IF NOT EXISTS council_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cadet_id uuid REFERENCES cadets(id) ON DELETE CASCADE,
  position_id uuid REFERENCES council_positions(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES council_staffs(id) ON DELETE CASCADE, -- NULL для атамана и зам атамана
  appointed_by uuid REFERENCES auth.users(id),
  appointed_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(cadet_id, position_id, staff_id)
);

-- Создаем таблицу иерархии (кто кому подчиняется)
CREATE TABLE IF NOT EXISTS council_hierarchy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subordinate_id uuid REFERENCES council_members(id) ON DELETE CASCADE,
  superior_id uuid REFERENCES council_members(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(subordinate_id, superior_id)
);

-- Включаем RLS
ALTER TABLE council_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE council_staffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE council_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE council_hierarchy ENABLE ROW LEVEL SECURITY;

-- Политики для council_positions
CREATE POLICY "Everyone can read council positions"
  ON council_positions
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage council positions"
  ON council_positions
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = uid() 
    AND users.role IN ('admin', 'super_admin')
  ));

-- Политики для council_staffs
CREATE POLICY "Everyone can read council staffs"
  ON council_staffs
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage council staffs"
  ON council_staffs
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = uid() 
    AND users.role IN ('admin', 'super_admin')
  ));

-- Политики для council_members
CREATE POLICY "Everyone can read council members"
  ON council_members
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage council members"
  ON council_members
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = uid() 
    AND users.role IN ('admin', 'super_admin')
  ));

-- Политики для council_hierarchy
CREATE POLICY "Everyone can read council hierarchy"
  ON council_hierarchy
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage council hierarchy"
  ON council_hierarchy
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = uid() 
    AND users.role IN ('admin', 'super_admin')
  ));

-- Вставляем базовые должности
INSERT INTO council_positions (name, display_name, description, level, color, icon, sort_order) VALUES
('ataman', 'Атаман', 'Главный атаман кадетского корпуса', 0, 'from-red-600 to-red-800', 'Crown', 1),
('deputy_ataman', 'Заместитель атамана', 'Заместитель главного атамана', 1, 'from-orange-600 to-orange-800', 'Shield', 2),
('staff_commander', 'Командир штаба', 'Командир штаба по направлению', 2, 'from-blue-600 to-blue-800', 'Star', 3),
('staff_member', 'Член штаба', 'Подчиненный командира штаба', 3, 'from-green-600 to-green-800', 'Users', 4)
ON CONFLICT (name) DO NOTHING;

-- Вставляем базовые штабы
INSERT INTO council_staffs (name, display_name, description, color, icon, sort_order) VALUES
('education', 'Штаб образования', 'Управление учебной деятельностью', 'from-blue-600 to-blue-800', 'BookOpen', 1),
('discipline', 'Штаб дисциплины', 'Поддержание порядка и дисциплины', 'from-red-600 to-red-800', 'Shield', 2),
('events', 'Штаб мероприятий', 'Организация событий и мероприятий', 'from-green-600 to-green-800', 'Calendar', 3),
('sports', 'Спортивный штаб', 'Физическая подготовка и спорт', 'from-yellow-600 to-yellow-800', 'Trophy', 4),
('culture', 'Культурный штаб', 'Культурная и творческая деятельность', 'from-purple-600 to-purple-800', 'Heart', 5)
ON CONFLICT (name) DO NOTHING;