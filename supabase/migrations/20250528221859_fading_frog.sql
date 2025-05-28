/*
  # Fix users table RLS policies for registration

  1. Changes
    - Modify RLS policies to properly handle user registration
    - Add specific INSERT policy for registration process
    - Ensure policies maintain security while allowing necessary operations

  2. Security
    - Maintain existing security for user data access
    - Add specific policy for registration process
    - Keep admin capabilities intact
*/

-- First, drop the existing INSERT policy if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Enable insert for new users'
  ) THEN
    DROP POLICY "Enable insert for new users" ON public.users;
  END IF;
END $$;

-- Create new INSERT policy that allows registration
CREATE POLICY "Enable insert for registration" ON public.users
  FOR INSERT 
  TO authenticated, anon
  WITH CHECK (
    -- Allow insert during registration where the new row id matches the authenticated user's id
    -- OR when the user is not yet authenticated (for initial registration)
    (auth.uid() = id) OR 
    (auth.uid() IS NULL AND EXISTS (
      SELECT 1 FROM auth.users WHERE auth.users.id = users.id
    ))
  );