/*
  # Fix infinite recursion in users table RLS policies

  1. Problem
    - The admin policy on users table causes infinite recursion
    - Policy checks users table while being applied to users table
    
  2. Solution
    - Simplify admin policy to avoid self-reference
    - Use auth.uid() directly for admin checks where possible
    - Create a function to safely check admin role
    
  3. Security
    - Maintain proper access control
    - Ensure admin users can still manage data
    - Prevent unauthorized access
*/

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Admin users can manage all data" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;

-- Create a safe function to check if current user is admin
-- This function will be used by other tables, not the users table itself
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM auth.users au
    JOIN public.users u ON au.id = u.id
    WHERE au.id = auth.uid() 
    AND u.role = 'admin'
  );
$$;

-- Create simplified policies for users table that don't cause recursion
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow service role to manage all users (for admin operations)
CREATE POLICY "Service role can manage all users"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update other tables to use the new admin function
-- Fix fonts table admin policy
DROP POLICY IF EXISTS "Admin users can manage fonts" ON fonts;
CREATE POLICY "Admin users can manage fonts"
  ON fonts
  FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());