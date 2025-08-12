/*
  # Система ролей и разрешений для администраторов

  1. Новые таблицы
    - `admin_roles` - роли администраторов (главный админ, модератор и т.д.)
    - `admin_permissions` - разрешения (добавление баллов, создание событий и т.д.)
    - `role_permissions` - связь между ролями и разрешениями
    - `user_roles` - назначение ролей пользователям

  2. Изменения в существующих таблицах
    - Обновление таблицы `users` для поддержки новой системы ролей

  3. Безопасность
    - RLS политики для всех новых таблиц
    - Ограничения доступа на основе ролей и разрешений

  4. Данные по умолчанию
    - Создание базовых ролей и разрешений
    - Назначение роли "super_admin" существующим админам
*/

-- Создаем таблицу ролей администраторов
CREATE TABLE IF NOT EXISTS admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  is_system_role boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Создаем таблицу разрешений
CREATE TABLE IF NOT EXISTS admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  created_at timestamptz DEFAULT now()
);

-- Создаем таблицу связи ролей и разрешений
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES admin_permissions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- Создаем таблицу назначения ролей пользователям
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(user_id, role_id)
);

-- Включаем RLS для всех таблиц
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Политики для admin_roles
CREATE POLICY "Admins can read admin roles"
  ON admin_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Super admins can manage admin roles"
  ON admin_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN admin_roles ar ON ur.role_id = ar.id
      WHERE ur.user_id = auth.uid() 
      AND ar.name = 'super_admin'
      AND ur.is_active = true
    )
  );

-- Политики для admin_permissions
CREATE POLICY "Admins can read admin permissions"
  ON admin_permissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Super admins can manage admin permissions"
  ON admin_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN admin_roles ar ON ur.role_id = ar.id
      WHERE ur.user_id = auth.uid() 
      AND ar.name = 'super_admin'
      AND ur.is_active = true
    )
  );

-- Политики для role_permissions
CREATE POLICY "Admins can read role permissions"
  ON role_permissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Super admins can manage role permissions"
  ON role_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN admin_roles ar ON ur.role_id = ar.id
      WHERE ur.user_id = auth.uid() 
      AND ar.name = 'super_admin'
      AND ur.is_active = true
    )
  );

-- Политики для user_roles
CREATE POLICY "Users can read own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admins can read all user roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN admin_roles ar ON ur.role_id = ar.id
      WHERE ur.user_id = auth.uid() 
      AND ar.name = 'super_admin'
      AND ur.is_active = true
    )
  );

CREATE POLICY "Super admins can manage user roles"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN admin_roles ar ON ur.role_id = ar.id
      WHERE ur.user_id = auth.uid() 
      AND ar.name = 'super_admin'
      AND ur.is_active = true
    )
  );

CREATE POLICY "Super admins can update user roles"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN admin_roles ar ON ur.role_id = ar.id
      WHERE ur.user_id = auth.uid() 
      AND ar.name = 'super_admin'
      AND ur.is_active = true
    )
  );

-- Создаем базовые роли
INSERT INTO admin_roles (name, display_name, description, is_system_role) VALUES
  ('super_admin', 'Главный администратор', 'Полные права доступа ко всем функциям системы', true),
  ('admin', 'Администратор', 'Стандартные права администратора', true),
  ('moderator', 'Модератор', 'Ограниченные права модерации', true),
  ('score_manager', 'Менеджер баллов', 'Управление баллами кадетов', false),
  ('event_manager', 'Менеджер событий', 'Управление событиями и мероприятиями', false),
  ('content_manager', 'Контент-менеджер', 'Управление новостями и контентом', false)
ON CONFLICT (name) DO NOTHING;

-- Создаем базовые разрешения
INSERT INTO admin_permissions (name, display_name, description, category) VALUES
  -- Управление кадетами
  ('manage_cadets', 'Управление кадетами', 'Создание, редактирование и удаление кадетов', 'cadets'),
  ('view_cadets', 'Просмотр кадетов', 'Просмотр списка и профилей кадетов', 'cadets'),
  
  -- Управление баллами
  ('manage_scores_study', 'Управление баллами за учебу', 'Начисление и снятие баллов за учебу', 'scores'),
  ('manage_scores_discipline', 'Управление баллами за дисциплину', 'Начисление и снятие баллов за дисциплину', 'scores'),
  ('manage_scores_events', 'Управление баллами за мероприятия', 'Начисление и снятие баллов за мероприятия', 'scores'),
  ('view_score_history', 'Просмотр истории баллов', 'Просмотр истории начисления баллов', 'scores'),
  
  -- Управление достижениями
  ('manage_achievements', 'Управление достижениями', 'Создание, редактирование и удаление достижений', 'achievements'),
  ('award_achievements', 'Присуждение достижений', 'Присуждение достижений кадетам', 'achievements'),
  
  -- Управление событиями
  ('manage_events', 'Управление событиями', 'Создание, редактирование и удаление событий', 'events'),
  ('view_event_participants', 'Просмотр участников событий', 'Просмотр списка участников событий', 'events'),
  
  -- Управление новостями
  ('manage_news', 'Управление новостями', 'Создание, редактирование и удаление новостей', 'content'),
  
  -- Управление заданиями
  ('manage_tasks', 'Управление заданиями', 'Создание, редактирование и удаление заданий', 'tasks'),
  ('review_task_submissions', 'Проверка заданий', 'Проверка и оценка выполненных заданий', 'tasks'),
  
  -- Управление форумом
  ('manage_forum', 'Управление форумом', 'Модерация форума, управление темами и сообщениями', 'forum'),
  
  -- Системное управление
  ('manage_admins', 'Управление администраторами', 'Создание и управление другими администраторами', 'system'),
  ('manage_roles', 'Управление ролями', 'Создание и редактирование ролей', 'system'),
  ('view_analytics', 'Просмотр аналитики', 'Доступ к статистике и аналитике', 'system'),
  ('system_reset', 'Сброс данных', 'Возможность сброса данных системы', 'system')
ON CONFLICT (name) DO NOTHING;

-- Назначаем разрешения ролям
DO $$
DECLARE
  super_admin_role_id uuid;
  admin_role_id uuid;
  moderator_role_id uuid;
  score_manager_role_id uuid;
  event_manager_role_id uuid;
  content_manager_role_id uuid;
  permission_id uuid;
BEGIN
  -- Получаем ID ролей
  SELECT id INTO super_admin_role_id FROM admin_roles WHERE name = 'super_admin';
  SELECT id INTO admin_role_id FROM admin_roles WHERE name = 'admin';
  SELECT id INTO moderator_role_id FROM admin_roles WHERE name = 'moderator';
  SELECT id INTO score_manager_role_id FROM admin_roles WHERE name = 'score_manager';
  SELECT id INTO event_manager_role_id FROM admin_roles WHERE name = 'event_manager';
  SELECT id INTO content_manager_role_id FROM admin_roles WHERE name = 'content_manager';

  -- Главный администратор получает ВСЕ разрешения
  FOR permission_id IN (SELECT id FROM admin_permissions)
  LOOP
    INSERT INTO role_permissions (role_id, permission_id) 
    VALUES (super_admin_role_id, permission_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END LOOP;

  -- Обычный администратор получает большинство разрешений (кроме управления админами)
  FOR permission_id IN (
    SELECT id FROM admin_permissions 
    WHERE name NOT IN ('manage_admins', 'manage_roles', 'system_reset')
  )
  LOOP
    INSERT INTO role_permissions (role_id, permission_id) 
    VALUES (admin_role_id, permission_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END LOOP;

  -- Модератор получает ограниченные права
  FOR permission_id IN (
    SELECT id FROM admin_permissions 
    WHERE name IN ('view_cadets', 'manage_forum', 'view_analytics', 'view_score_history')
  )
  LOOP
    INSERT INTO role_permissions (role_id, permission_id) 
    VALUES (moderator_role_id, permission_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END LOOP;

  -- Менеджер баллов
  FOR permission_id IN (
    SELECT id FROM admin_permissions 
    WHERE name IN ('view_cadets', 'manage_scores_study', 'manage_scores_discipline', 'manage_scores_events', 'view_score_history', 'view_analytics')
  )
  LOOP
    INSERT INTO role_permissions (role_id, permission_id) 
    VALUES (score_manager_role_id, permission_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END LOOP;

  -- Менеджер событий
  FOR permission_id IN (
    SELECT id FROM admin_permissions 
    WHERE name IN ('view_cadets', 'manage_events', 'view_event_participants', 'view_analytics')
  )
  LOOP
    INSERT INTO role_permissions (role_id, permission_id) 
    VALUES (event_manager_role_id, permission_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END LOOP;

  -- Контент-менеджер
  FOR permission_id IN (
    SELECT id FROM admin_permissions 
    WHERE name IN ('manage_news', 'manage_forum', 'view_analytics')
  )
  LOOP
    INSERT INTO role_permissions (role_id, permission_id) 
    VALUES (content_manager_role_id, permission_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END LOOP;
END $$;

-- Создаем функцию для проверки разрешений пользователя
CREATE OR REPLACE FUNCTION user_has_permission(user_id uuid, permission_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN admin_permissions ap ON rp.permission_id = ap.id
    WHERE ur.user_id = user_id
    AND ap.name = permission_name
    AND ur.is_active = true
  );
END;
$$;

-- Создаем функцию для получения ролей пользователя
CREATE OR REPLACE FUNCTION get_user_roles(user_id uuid)
RETURNS TABLE(role_name text, role_display_name text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT ar.name, ar.display_name
  FROM user_roles ur
  JOIN admin_roles ar ON ur.role_id = ar.id
  WHERE ur.user_id = user_id
  AND ur.is_active = true;
END;
$$;

-- Создаем функцию для получения разрешений пользователя
CREATE OR REPLACE FUNCTION get_user_permissions(user_id uuid)
RETURNS TABLE(permission_name text, permission_display_name text, category text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ap.name, ap.display_name, ap.category
  FROM user_roles ur
  JOIN role_permissions rp ON ur.role_id = rp.role_id
  JOIN admin_permissions ap ON rp.permission_id = ap.id
  WHERE ur.user_id = user_id
  AND ur.is_active = true;
END;
$$;

-- Обновляем существующую таблицу users для поддержки новой системы
DO $$
BEGIN
  -- Добавляем новые роли в ограничение, если их еще нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'users_role_check' 
    AND check_clause LIKE '%super_admin%'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role = ANY (ARRAY['admin'::text, 'cadet'::text, 'super_admin'::text]));
  END IF;
END $$;

-- Назначаем роль super_admin существующим администраторам
DO $$
DECLARE
  admin_user_id uuid;
  super_admin_role_id uuid;
BEGIN
  -- Получаем ID роли super_admin
  SELECT id INTO super_admin_role_id FROM admin_roles WHERE name = 'super_admin';
  
  -- Назначаем роль всем существующим админам
  FOR admin_user_id IN (SELECT id FROM users WHERE role = 'admin')
  LOOP
    INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
    VALUES (admin_user_id, super_admin_role_id, admin_user_id, true)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END LOOP;
  
  -- Обновляем роль в таблице users для существующих админов
  UPDATE users 
  SET role = 'super_admin' 
  WHERE role = 'admin';
END $$;

-- Создаем индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);