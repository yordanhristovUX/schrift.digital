/*
  # Fix users table RLS policies

  1. Changes
    - Drop existing policies
    - Create new policies with correct permissions for user registration
    - Allow authenticated users to insert their own data
    - Allow users to read their own data
    - Allow admin users to read all data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Enable insert for authentication service" ON users;

-- Create new policies
CREATE POLICY "Enable insert for new users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR 
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);