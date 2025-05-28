/*
  # Fix users table RLS policies

  1. Changes
    - Add new RLS policy to allow user registration
    - Policy allows inserting new users during registration process
    
  2. Security
    - Allows users to insert their own profile during registration
    - Maintains existing policies for other operations
*/

-- Add policy to allow user registration
CREATE POLICY "Allow users to insert their own profile during registration"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);