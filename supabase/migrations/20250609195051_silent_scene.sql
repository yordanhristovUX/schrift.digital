/*
  # Fix infinite recursion in users table RLS policy

  1. Problem
    - The "Admin users full access" policy creates infinite recursion by querying the users table within its own policy
    - This causes a 500 error when trying to fetch user data

  2. Solution
    - Drop the problematic policy that queries users table within itself
    - Recreate it using the existing is_admin() function which should handle admin checks properly
    - This prevents the circular dependency that causes infinite recursion

  3. Security
    - Maintains the same security level by using the proper is_admin() function
    - Ensures admin users still have full access without causing recursion
*/

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Admin users full access" ON users;

-- Recreate the policy using the proper is_admin() function to avoid recursion
CREATE POLICY "Admin users full access"
  ON users
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());