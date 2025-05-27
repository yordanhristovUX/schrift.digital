/*
  # Add insert policy for fonts table

  1. Changes
    - Add new RLS policy to allow admin users to insert new fonts
  
  2. Security
    - Policy checks user role in users table
    - Only allows insert for admin users
*/

CREATE POLICY "Admin users can insert fonts"
ON public.fonts
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);