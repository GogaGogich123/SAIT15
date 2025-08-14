/*
  # Add current_participants column to tasks table

  1. Changes
    - Add `current_participants` column to `tasks` table with default value 0
    - This column tracks the number of participants who have taken each task

  2. Notes
    - Column is added safely with IF NOT EXISTS check
    - Default value ensures existing tasks have proper initialization
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'current_participants'
  ) THEN
    ALTER TABLE tasks ADD COLUMN current_participants integer DEFAULT 0 NOT NULL;
  END IF;
END $$;