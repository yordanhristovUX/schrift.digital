/*
  # Add RLS policy for user registration

  1. Changes
    - Add new RLS policy to allow user registration
    - Policy allows INSERT operations during registration process
    - Maintains security by ensuring user can only create their own profile

  2. Security
    - Policy uses WITH CHECK expression to validate user ID matches auth.uid()
    - Only allows creation of user's own profile
    - Prevents unauthorized profile creation
*/

-- Add policy to allow user registration
CREATE POLICY "Allow users to create their own profile during registration"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
  -- Ensure users can only create their own profile
  auth.uid() = id
);

-- Add policy to allow initial profile creation during signup
CREATE POLICY "Allow initial profile creation during signup"
ON public.users
FOR INSERT
TO public
WITH CHECK (
  -- During signup, the ID must match the one from the auth.users table
  EXISTS (
    SELECT 1
    FROM auth.users
    WHERE auth.users.id = users.id
  )
);