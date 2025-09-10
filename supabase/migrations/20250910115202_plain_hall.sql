/*
  # Create Council Management Tables

  1. New Tables
    - `council_positions` - Positions in the council (атаман, заместитель, etc.)
    - `council_staffs` - Different staffs/departments in the council
    - `council_members` - Members assigned to positions and staffs
    - `council_hierarchy` - Hierarchy relationships between council members

  2. Security
    - Enable RLS on all tables
    - Add policies for reading and admin management

  3. Triggers
    - Add trigger to update cadet display names when prefixes change
*/

-- Create council_positions table
CREATE TABLE IF NOT EXISTS council_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  level integer NOT NULL DEFAULT 3,
  color text DEFAULT 'from-blue-500 to-blue-700',
  icon text DEFAULT 'Star',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create council_staffs table
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

-- Create council_members table
CREATE TABLE IF NOT EXISTS council_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cadet_id uuid NOT NULL REFERENCES cadets(id) ON DELETE CASCADE,
  position_id uuid NOT NULL REFERENCES council_positions(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES council_staffs(id) ON DELETE CASCADE,
  appointed_by uuid REFERENCES auth.users(id),
  appointed_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(cadet_id, position_id, staff_id)
);

-- Create council_hierarchy table
CREATE TABLE IF NOT EXISTS council_hierarchy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subordinate_id uuid NOT NULL REFERENCES council_members(id) ON DELETE CASCADE,
  superior_id uuid NOT NULL REFERENCES council_members(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(subordinate_id, superior_id)
);

-- Enable RLS
ALTER TABLE council_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE council_staffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE council_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE council_hierarchy ENABLE ROW LEVEL SECURITY;

-- Policies for council_positions
CREATE POLICY "Everyone can read active positions"
  ON council_positions
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage positions"
  ON council_positions
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  ));

-- Policies for council_staffs
CREATE POLICY "Everyone can read active staffs"
  ON council_staffs
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage staffs"
  ON council_staffs
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  ));

-- Policies for council_members
CREATE POLICY "Everyone can read active council members"
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
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  ));

-- Policies for council_hierarchy
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
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  ));

-- Insert default positions
INSERT INTO council_positions (name, display_name, description, level, color, icon, sort_order) VALUES
  ('ataman', 'Атаман', 'Главный руководитель кадетского корпуса', 0, 'from-red-600 to-red-800', 'Crown', 1),
  ('deputy_ataman', 'Заместитель атамана', 'Заместитель главного руководителя', 1, 'from-blue-600 to-blue-800', 'Shield', 2)
ON CONFLICT (name) DO NOTHING;

-- Insert default staffs
INSERT INTO council_staffs (name, display_name, description, color, icon, sort_order) VALUES
  ('education', 'Штаб образования', 'Отвечает за учебную деятельность', 'from-blue-600 to-blue-800', 'BookOpen', 1),
  ('discipline', 'Штаб дисциплины', 'Отвечает за дисциплину и порядок', 'from-red-600 to-red-800', 'Target', 2),
  ('events', 'Штаб мероприятий', 'Организует события и мероприятия', 'from-green-600 to-green-800', 'Calendar', 3),
  ('sports', 'Спортивный штаб', 'Отвечает за спортивную деятельность', 'from-orange-600 to-orange-800', 'Trophy', 4)
ON CONFLICT (name) DO NOTHING;