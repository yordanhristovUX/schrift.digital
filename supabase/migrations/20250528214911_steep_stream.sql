/*
  # Fix user registration RLS policies

  1. Changes
    - Add new RLS policy to allow user registration
    - Policy allows inserting new users during registration process
    - Ensures users can only create their own profile with matching auth.uid()

  2. Security
    - Maintains existing RLS policies
    - Adds specific policy for registration flow
    - Ensures data integrity by matching user ID with auth ID
*/

-- Add policy to allow users to insert their own profile during registration
CREATE POLICY "Users can create their own profile during registration"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = id);