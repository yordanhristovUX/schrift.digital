/*
  # Add user registration RLS policy

  1. Changes
    - Add new RLS policy to allow user profile creation during registration
    
  2. Security
    - Policy ensures users can only create their own profile during registration
    - Policy validates that the inserted ID matches the authenticated user's ID
*/

CREATE POLICY "Enable user registration"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);