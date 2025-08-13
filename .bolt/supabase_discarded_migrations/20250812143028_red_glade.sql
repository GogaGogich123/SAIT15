/*
  # Add user permissions table

  1. New Tables
    - `user_permissions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `permission_id` (uuid, foreign key to admin_permissions)
      - `assigned_by` (uuid, foreign key to auth.users)
      - `assigned_at` (timestamp)
      - `is_active` (boolean)

  2. Security
    - Enable RLS on `user_permissions` table
    - Add policies for admin access

  3. Functions
    - Update get_user_permissions function to include direct permissions
*/

-- Create user_permissions table for direct permission assignments
CREATE TABLE IF NOT EXISTS user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES admin_permissions(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(user_id, permission_id)
);

-- Enable RLS
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage user permissions"
  ON user_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Everyone can read user permissions"
  ON user_permissions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Update the get_user_permissions function to include direct permissions
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
  -- Permissions from roles
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
    AND ur.is_active = true
  
  UNION
  
  -- Direct permissions
  SELECT DISTINCT
    ap.id,
    ap.name,
    ap.display_name,
    ap.description,
    ap.category,
    ap.created_at
  FROM admin_permissions ap
  JOIN user_permissions up ON ap.id = up.permission_id
  WHERE up.user_id = get_user_permissions.user_id 
    AND up.is_active = true;
END;
$$;

-- Create function to create super admin
CREATE OR REPLACE FUNCTION create_super_admin(
  admin_email text,
  admin_password text,
  admin_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
  super_admin_role_id uuid;
  result json;
BEGIN
  -- Check if super admin already exists
  IF EXISTS (
    SELECT 1 FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN admin_roles ar ON ur.role_id = ar.id
    WHERE ar.name = 'super_admin' AND ur.is_active = true
  ) THEN
    RAISE EXCEPTION 'Super admin already exists';
  END IF;

  -- Generate new user ID
  new_user_id := gen_random_uuid();

  -- Create user in users table
  INSERT INTO users (id, email, name, role)
  VALUES (new_user_id, admin_email, admin_name, 'super_admin');

  -- Get super_admin role ID
  SELECT id INTO super_admin_role_id
  FROM admin_roles
  WHERE name = 'super_admin';

  -- Assign super_admin role
  INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
  VALUES (new_user_id, super_admin_role_id, new_user_id, true);

  -- Return result
  SELECT json_build_object(
    'id', new_user_id,
    'email', admin_email,
    'name', admin_name,
    'role', 'super_admin',
    'message', 'Super admin created successfully'
  ) INTO result;

  RETURN result;
END;
$$;