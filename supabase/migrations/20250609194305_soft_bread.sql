/*
  # Fix infinite recursion in users table RLS policy

  1. Problem
    - The "Admin full access" policy causes infinite recursion by querying the users table within its own policy condition
    - This happens when the policy tries to check if a user is admin by reading from the same table it's protecting

  2. Solution
    - Drop the problematic "Admin full access" policy
    - Create a new admin policy that uses a simpler approach
    - Use auth.uid() directly without self-referencing the users table
    - Create a separate function to check admin status if needed

  3. Changes
    - Remove recursive policy
    - Add simplified admin policy using auth metadata or direct user ID check
    - Ensure other policies remain intact
*/

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Admin full access" ON users;

-- Create a new admin policy that doesn't cause recursion
-- This policy allows full access to a specific admin user ID
-- You should replace this UUID with your actual admin user ID from auth.users
CREATE POLICY "Admin full access" ON users
  FOR ALL
  TO authenticated
  USING (auth.uid() = '283aafef-787b-4766-a917-6d796e8ede14'::uuid)
  WITH CHECK (auth.uid() = '283aafef-787b-4766-a917-6d796e8ede14'::uuid);

-- Alternative: Create a function-based approach that's safer
-- First, create a function to check admin role without recursion
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'admin@schrift.digital'
  );
$$;

-- Drop the previous policy and create a new one using the function
DROP POLICY IF EXISTS "Admin full access" ON users;

CREATE POLICY "Admin full access" ON users
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());