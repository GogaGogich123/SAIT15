/*
  # Add admin access to task submissions

  1. Security
    - Add policy for admins to read all task submissions
    - Allows users with 'admin' or 'super_admin' role to view all submissions

  This policy enables the admin panel to display all task submissions for review.
*/

-- Add policy for admins to read all task submissions
CREATE POLICY "Admins can read all task submissions"
  ON public.task_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );