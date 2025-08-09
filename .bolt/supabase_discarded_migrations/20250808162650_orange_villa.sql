/*
  # Add is_active column to tasks table

  1. Changes
    - Add `is_active` column to `tasks` table with default value `true`
    - Update existing tasks to have `is_active = true`

  2. Security
    - No changes to RLS policies needed
*/

-- Add is_active column to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE tasks ADD COLUMN is_active boolean DEFAULT true NOT NULL;
  END IF;
END $$;

-- Update existing tasks to be active
UPDATE tasks SET is_active = true WHERE is_active IS NULL;