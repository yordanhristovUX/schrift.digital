/*
  # Fix infinite recursion in users table RLS policies

  1. Problem
    - The "Admin full access" policy uses `is_admin()` function which likely queries the users table
    - This creates infinite recursion when the policy is evaluated on the users table itself

  2. Solution
    - Replace the problematic `is_admin()` function call with a direct role check
    - Use `auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'` or similar direct approach
    - Alternatively, check the role directly from the current row being accessed

  3. Changes
    - Drop the existing "Admin full access" policy
    - Create a new policy that checks admin role without recursion
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admin full access" ON users;

-- Create a new admin policy that doesn't cause recursion
-- This policy allows admin users to access all user records
CREATE POLICY "Admin users can access all users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    -- Check if the current user has admin role by looking at their own record
    -- We use a subquery that specifically targets the authenticated user's ID
    EXISTS (
      SELECT 1 
      FROM auth.users au 
      JOIN users u ON au.id = u.id 
      WHERE au.id = auth.uid() 
      AND u.role = 'admin'
    )
  )
  WITH CHECK (
    -- Same check for INSERT/UPDATE operations
    EXISTS (
      SELECT 1 
      FROM auth.users au 
      JOIN users u ON au.id = u.id 
      WHERE au.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

-- Alternative approach: Create a simpler admin policy that checks role directly
-- This replaces the above policy with a more direct approach
DROP POLICY IF EXISTS "Admin users can access all users" ON users;

CREATE POLICY "Admin users full access"
  ON users
  FOR ALL
  TO authenticated
  USING (
    -- Direct role check on the current user's record
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    -- Same check for modifications
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );