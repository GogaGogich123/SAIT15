/*
  # Add max_participants column to tasks table

  1. Changes
    - Add `max_participants` column to `tasks` table
    - Set as integer type with default value of 0
    - 0 means unlimited participants

  2. Notes
    - Uses conditional check to prevent errors if column already exists
    - Default value of 0 indicates no participant limit
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'max_participants'
  ) THEN
    ALTER TABLE tasks ADD COLUMN max_participants integer DEFAULT 0 NOT NULL;
  END IF;
END $$;