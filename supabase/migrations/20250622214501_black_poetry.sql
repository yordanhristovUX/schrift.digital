/*
  # Fix RLS policies for fonts table admin operations

  1. Security Updates
    - Add INSERT policy for admin users to create fonts
    - Add UPDATE policy for admin users to modify fonts
    - Ensure admin users can perform all CRUD operations on fonts table

  2. Changes
    - Create policy "Admin users can insert fonts" for INSERT operations
    - Create policy "Admin users can update fonts" for UPDATE operations
    - These policies check if the user has admin role via is_admin() function
*/

-- Add INSERT policy for admin users
CREATE POLICY "Admin users can insert fonts"
  ON fonts
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Add UPDATE policy for admin users  
CREATE POLICY "Admin users can update fonts"
  ON fonts
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Add DELETE policy for admin users (if not already covered by "Admin users full access")
CREATE POLICY "Admin users can delete fonts"
  ON fonts
  FOR DELETE
  TO authenticated
  USING (is_admin());