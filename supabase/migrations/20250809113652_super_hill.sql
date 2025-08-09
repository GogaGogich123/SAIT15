/*
  # Fix score_history INSERT policy for admins

  1. Security Changes
    - Add INSERT policy for score_history table to allow admins to insert records
    - Policy checks if the authenticated user has 'admin' role in the users table

  This resolves the RLS policy violation when admins try to add scores through the admin interface.
*/

-- Add INSERT policy for score_history table to allow admins
CREATE POLICY "Allow admins to insert score history"
  ON score_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );