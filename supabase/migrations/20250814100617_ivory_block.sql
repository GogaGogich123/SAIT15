/*
  # Add admin task review policy

  1. Security
    - Add RLS policy to allow admins to update task submissions for review
    - Enables administrators to change submission status from 'submitted' to 'completed' or 'rejected'
    - Allows admins to add feedback and points awarded

  2. Changes
    - New UPDATE policy on task_submissions table for admin users
    - Policy checks if user has admin or super_admin role in users table
*/

-- Add policy to allow admins to update task submissions for review
CREATE POLICY "Admins can update task submissions for review"
  ON task_submissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM users 
      WHERE (users.id = auth.uid()) 
        AND (users.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM users 
      WHERE (users.id = auth.uid()) 
        AND (users.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))
    )
  );