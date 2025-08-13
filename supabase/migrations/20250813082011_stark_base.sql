/*
  # Fix super admin permissions for managing admins

  1. New Permissions
    - Ensures `manage_admins` permission exists in admin_permissions table
    - Ensures `manage_roles` permission exists for role management

  2. Role Permissions
    - Links super_admin role with manage_admins permission
    - Links super_admin role with manage_roles permission
    - Links admin role with basic admin permissions

  3. Security
    - Maintains existing RLS policies
    - Ensures proper permission hierarchy
*/

-- Ensure manage_admins permission exists
INSERT INTO admin_permissions (name, display_name, description, category)
VALUES ('manage_admins', 'Управление администраторами', 'Создание, редактирование и удаление администраторов', 'system')
ON CONFLICT (name) DO NOTHING;

-- Ensure manage_roles permission exists
INSERT INTO admin_permissions (name, display_name, description, category)
VALUES ('manage_roles', 'Управление ролями', 'Создание и редактирование ролей администраторов', 'system')
ON CONFLICT (name) DO NOTHING;

-- Ensure other essential permissions exist
INSERT INTO admin_permissions (name, display_name, description, category)
VALUES 
  ('view_admin_panel', 'Доступ к админ-панели', 'Просмотр административной панели', 'system'),
  ('manage_cadets', 'Управление кадетами', 'Создание, редактирование и удаление кадетов', 'cadets'),
  ('manage_scores', 'Управление баллами', 'Изменение баллов кадетов', 'scores'),
  ('manage_achievements', 'Управление достижениями', 'Создание и назначение достижений', 'achievements'),
  ('manage_events', 'Управление событиями', 'Создание и редактирование событий', 'events'),
  ('manage_content', 'Управление контентом', 'Редактирование новостей и контента', 'content'),
  ('manage_tasks', 'Управление заданиями', 'Создание и редактирование заданий', 'tasks'),
  ('moderate_forum', 'Модерация форума', 'Модерация форума и управление темами', 'forum')
ON CONFLICT (name) DO NOTHING;

-- Link super_admin role with manage_admins permission
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  ar.id as role_id,
  ap.id as permission_id
FROM admin_roles ar
CROSS JOIN admin_permissions ap
WHERE ar.name = 'super_admin' 
  AND ap.name = 'manage_admins'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Link super_admin role with manage_roles permission
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  ar.id as role_id,
  ap.id as permission_id
FROM admin_roles ar
CROSS JOIN admin_permissions ap
WHERE ar.name = 'super_admin' 
  AND ap.name = 'manage_roles'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Give super_admin all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  ar.id as role_id,
  ap.id as permission_id
FROM admin_roles ar
CROSS JOIN admin_permissions ap
WHERE ar.name = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Give admin role basic permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  ar.id as role_id,
  ap.id as permission_id
FROM admin_roles ar
CROSS JOIN admin_permissions ap
WHERE ar.name = 'admin' 
  AND ap.name IN ('view_admin_panel', 'manage_cadets', 'manage_scores', 'manage_events', 'manage_content')
ON CONFLICT (role_id, permission_id) DO NOTHING;