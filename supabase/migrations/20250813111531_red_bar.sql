/*
  # Fix tasks table structure

  1. Changes
    - Add missing columns to tasks table if they don't exist
    - Update task_submissions table structure
    - Add proper constraints and indexes

  2. New Columns for tasks
    - `status` (text, default 'active') - for filtering active/inactive tasks
    - `max_participants` (integer, default 0) - maximum number of participants
    - `current_participants` (integer, default 0) - current number of participants
    - `abandon_penalty` (integer, default 0) - penalty for abandoning task

  3. New Columns for task_submissions
    - `points_awarded` (integer, default 0) - points awarded for completion
    - `feedback` (text) - reviewer feedback (rename from reviewer_feedback)
</*/

-- Add missing columns to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'status'
  ) THEN
    ALTER TABLE tasks ADD COLUMN status text DEFAULT 'active';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'max_participants'
  ) THEN
    ALTER TABLE tasks ADD COLUMN max_participants integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'current_participants'
  ) THEN
    ALTER TABLE tasks ADD COLUMN current_participants integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'abandon_penalty'
  ) THEN
    ALTER TABLE tasks ADD COLUMN abandon_penalty integer DEFAULT 0;
  END IF;
END $$;

-- Add missing columns to task_submissions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'task_submissions' AND column_name = 'points_awarded'
  ) THEN
    ALTER TABLE task_submissions ADD COLUMN points_awarded integer DEFAULT 0;
  END IF;
END $$;

-- Rename reviewer_feedback to feedback if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'task_submissions' AND column_name = 'reviewer_feedback'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'task_submissions' AND column_name = 'feedback'
  ) THEN
    ALTER TABLE task_submissions RENAME COLUMN reviewer_feedback TO feedback;
  END IF;
END $$;

-- Add feedback column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'task_submissions' AND column_name = 'feedback'
  ) THEN
    ALTER TABLE task_submissions ADD COLUMN feedback text;
  END IF;
END $$;

-- Update task_submissions status constraint to include 'abandoned'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'task_submissions_status_check'
  ) THEN
    ALTER TABLE task_submissions DROP CONSTRAINT task_submissions_status_check;
  END IF;
  
  ALTER TABLE task_submissions 
  ADD CONSTRAINT task_submissions_status_check 
  CHECK (status IN ('taken', 'submitted', 'completed', 'rejected', 'abandoned'));
END $$;

-- Add tasks status constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tasks_status_check'
  ) THEN
    ALTER TABLE tasks 
    ADD CONSTRAINT tasks_status_check 
    CHECK (status IN ('active', 'inactive'));
  END IF;
END $$;

-- Create additional indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_max_participants ON tasks(max_participants);
CREATE INDEX IF NOT EXISTS idx_task_submissions_points_awarded ON task_submissions(points_awarded);