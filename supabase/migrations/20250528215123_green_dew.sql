/*
  # Add user registration policy

  1. Security Changes
    - Add new RLS policy to allow new user registration
    - Policy allows insertion of user profile during registration
    - Ensures user can only create their own profile with matching auth.uid()

  Note: This complements existing policies while maintaining security
*/

-- Add policy to allow new user registration
CREATE POLICY "Enable registration for new users" 
ON public.users
FOR INSERT 
TO public  -- Allow public access since user isn't authenticated yet during registration
WITH CHECK (
  -- Ensure the user can only create their own profile
  auth.uid() = id
);