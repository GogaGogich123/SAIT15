/*
  # Add abandon_penalty column to tasks table

  1. Schema Changes
    - Add `abandon_penalty` column to `tasks` table
      - Type: integer
      - Default: 0 (no penalty by default)
      - Not nullable

  2. Purpose
    - Allows tasks to have a penalty score when cadets abandon them
    - Provides flexibility for different task types and difficulty levels
*/

-- Add abandon_penalty column to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'abandon_penalty'
  ) THEN
    ALTER TABLE tasks ADD COLUMN abandon_penalty integer DEFAULT 0 NOT NULL;
  END IF;
END $$;