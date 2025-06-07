/*
  # Fix infinite recursion in users table RLS policies

  1. Problem
    - The "Admin users can manage all data" policy creates infinite recursion
    - When checking if a user is admin, it queries the users table, which triggers the same policy
    
  2. Solution
    - Remove the problematic admin policy that causes recursion
    - Keep the basic user policies that don't cause recursion
    - Admin access should be handled at the application level or through service role
    
  3. Security
    - Users can still read and update their own data
    - Public registration is still allowed
    - Admin operations should use service role key in the application
*/

-- Drop the problematic admin policy that causes infinite recursion
DROP POLICY IF EXISTS "Admin users can manage all data" ON users;

-- The remaining policies are safe and don't cause recursion:
-- - "Allow public registration" - allows anon users to insert
-- - "Users can insert their own profile" - allows authenticated users to insert their own data
-- - "Users can read own data" - allows users to read their own data using uid()
-- - "Users can update own data" - allows users to update their own data using uid()

-- These policies use auth.uid() directly without querying the users table,
-- so they don't cause infinite recursion