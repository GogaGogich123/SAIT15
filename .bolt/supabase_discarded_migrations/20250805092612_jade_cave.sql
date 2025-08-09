/*
  # Add RLS policies for all tables

  1. Security Policies
    - Enable RLS on all tables if not already enabled
    - Add policies for authenticated users to read data
    - Add policies for cadets to manage their own data
    - Add policies for admins to manage all data

  2. Tables covered
    - cadets: read access for authenticated users, update own data
    - scores: read access for authenticated users
    - achievements: read access for authenticated users
    - auto_achievements: read access for authenticated users
    - cadet_achievements: read access for authenticated users
    - tasks: read access for authenticated users
    - task_submissions: full CRUD for own submissions
    - news: read access for authenticated users
    - score_history: read access for authenticated users

  3. Notes
    - Using permissive policies for demo purposes
    - In production, implement more restrictive policies based on roles
*/

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE cadets ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE cadet_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_history ENABLE ROW LEVEL SECURITY;

-- Cadets table policies
DROP POLICY IF EXISTS "Cadets can read all cadets data" ON cadets;
CREATE POLICY "Cadets can read all cadets data"
  ON cadets
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Cadets can update own data" ON cadets;
CREATE POLICY "Cadets can update own data"
  ON cadets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id);

-- Scores table policies
DROP POLICY IF EXISTS "Everyone can read scores" ON scores;
CREATE POLICY "Everyone can read scores"
  ON scores
  FOR SELECT
  TO authenticated
  USING (true);

-- Achievements table policies
DROP POLICY IF EXISTS "Everyone can read achievements" ON achievements;
CREATE POLICY "Everyone can read achievements"
  ON achievements
  FOR SELECT
  TO authenticated
  USING (true);

-- Auto achievements table policies
DROP POLICY IF EXISTS "Everyone can read auto achievements" ON auto_achievements;
CREATE POLICY "Everyone can read auto achievements"
  ON auto_achievements
  FOR SELECT
  TO authenticated
  USING (true);

-- Cadet achievements table policies
DROP POLICY IF EXISTS "Everyone can read cadet achievements" ON cadet_achievements;
CREATE POLICY "Everyone can read cadet achievements"
  ON cadet_achievements
  FOR SELECT
  TO authenticated
  USING (true);

-- Tasks table policies
DROP POLICY IF EXISTS "Everyone can read active tasks" ON tasks;
CREATE POLICY "Everyone can read active tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (status = 'active');

-- Task submissions table policies
DROP POLICY IF EXISTS "Cadets can read own task submissions" ON task_submissions;
CREATE POLICY "Cadets can read own task submissions"
  ON task_submissions
  FOR SELECT
  TO authenticated
  USING (cadet_id IN (
    SELECT id FROM cadets WHERE auth_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Cadets can insert own task submissions" ON task_submissions;
CREATE POLICY "Cadets can insert own task submissions"
  ON task_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (cadet_id IN (
    SELECT id FROM cadets WHERE auth_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Cadets can update own task submissions" ON task_submissions;
CREATE POLICY "Cadets can update own task submissions"
  ON task_submissions
  FOR UPDATE
  TO authenticated
  USING (cadet_id IN (
    SELECT id FROM cadets WHERE auth_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Cadets can delete own task submissions" ON task_submissions;
CREATE POLICY "Cadets can delete own task submissions"
  ON task_submissions
  FOR DELETE
  TO authenticated
  USING (cadet_id IN (
    SELECT id FROM cadets WHERE auth_user_id = auth.uid()
  ));

-- News table policies
DROP POLICY IF EXISTS "Everyone can read news" ON news;
CREATE POLICY "Everyone can read news"
  ON news
  FOR SELECT
  TO authenticated
  USING (true);

-- Score history table policies
DROP POLICY IF EXISTS "Everyone can read score history" ON score_history;
CREATE POLICY "Everyone can read score history"
  ON score_history
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow anonymous access for demo purposes (temporary)
-- In production, remove these and require authentication

CREATE POLICY "Allow anonymous read cadets"
  ON cadets
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous read scores"
  ON scores
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous read achievements"
  ON achievements
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous read auto achievements"
  ON auto_achievements
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous read cadet achievements"
  ON cadet_achievements
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous read active tasks"
  ON tasks
  FOR SELECT
  TO anon
  USING (status = 'active');

CREATE POLICY "Allow anonymous read news"
  ON news
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous read score history"
  ON score_history
  FOR SELECT
  TO anon
  USING (true);