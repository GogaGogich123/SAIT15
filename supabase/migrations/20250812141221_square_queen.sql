/*
  # Create Admin Roles System

  1. New Tables
    - `admin_roles` - Stores available admin roles
    - `admin_permissions` - Stores available permissions
    - `role_permissions` - Links roles to permissions
    - `user_roles` - Links users to roles

  2. Functions
    - `get_user_permissions` - Gets all permissions for a user
    - `user_has_permission` - Checks if user has specific permission

  3. Security
    - Enable RLS on all tables
    - Add policies for proper access control
*/

-- Create admin_roles table
CREATE TABLE IF NOT EXISTS admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  is_system_role boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create admin_permissions table
CREATE TABLE IF NOT EXISTS admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  created_at timestamptz DEFAULT now()
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES admin_permissions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(user_id, role_id)
);

-- Enable RLS
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_roles
CREATE POLICY "Everyone can read admin roles"
  ON admin_roles
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can manage admin roles"
  ON admin_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for admin_permissions
CREATE POLICY "Everyone can read admin permissions"
  ON admin_permissions
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can manage admin permissions"
  ON admin_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for role_permissions
CREATE POLICY "Everyone can read role permissions"
  ON role_permissions
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can manage role permissions"
  ON role_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for user_roles
CREATE POLICY "Users can read own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all user roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage user roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  display_name text,
  description text,
  category text,
  created_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT 
    ap.id,
    ap.name,
    ap.display_name,
    ap.description,
    ap.category,
    ap.created_at
  FROM admin_permissions ap
  JOIN role_permissions rp ON ap.id = rp.permission_id
  JOIN user_roles ur ON rp.role_id = ur.role_id
  WHERE ur.user_id = get_user_permissions.user_id
    AND ur.is_active = true;
END;
$$;

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(user_id uuid, permission_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM admin_permissions ap
    JOIN role_permissions rp ON ap.id = rp.permission_id
    JOIN user_roles ur ON rp.role_id = ur.role_id
    WHERE ur.user_id = user_has_permission.user_id
      AND ur.is_active = true
      AND ap.name = permission_name
  );
END;
$$;

-- Insert default system roles
INSERT INTO admin_roles (name, display_name, description, is_system_role) VALUES
  ('super_admin', 'Главный администратор', 'Полные права доступа ко всем функциям системы', true),
  ('admin', 'Администратор', 'Стандартные права администратора', true),
  ('moderator', 'Модератор', 'Права модератора форума и контента', true)
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO admin_permissions (name, display_name, description, category) VALUES
  ('manage_cadets', 'Управление кадетами', 'Создание, редактирование и удаление кадетов', 'cadets'),
  ('manage_scores', 'Управление баллами', 'Изменение баллов кадетов', 'scores'),
  ('manage_achievements', 'Управление достижениями', 'Создание и присвоение достижений', 'achievements'),
  ('manage_events', 'Управление событиями', 'Создание и редактирование событий', 'events'),
  ('manage_content', 'Управление контентом', 'Редактирование новостей и контента', 'content'),
  ('manage_tasks', 'Управление заданиями', 'Создание и редактирование заданий', 'tasks'),
  ('moderate_forum', 'Модерация форума', 'Модерация форума и сообщений', 'forum'),
  ('system_admin', 'Системное администрирование', 'Доступ к системным функциям', 'system')
ON CONFLICT (name) DO NOTHING;

-- Assign all permissions to super_admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM admin_roles WHERE name = 'super_admin'),
  ap.id
FROM admin_permissions ap
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign basic permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM admin_roles WHERE name = 'admin'),
  ap.id
FROM admin_permissions ap
WHERE ap.name IN ('manage_cadets', 'manage_scores', 'manage_achievements', 'manage_events', 'manage_content', 'manage_tasks')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign forum permissions to moderator role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM admin_roles WHERE name = 'moderator'),
  ap.id
FROM admin_permissions ap
WHERE ap.name IN ('moderate_forum', 'manage_content')
ON CONFLICT (role_id, permission_id) DO NOTHING;