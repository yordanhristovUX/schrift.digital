/*
  # Add RLS policy for user registration

  1. Changes
    - Add new RLS policy to allow users to insert their own profile during registration
    
  2. Security
    - Policy ensures users can only insert their own profile data
    - Policy only applies during the initial registration
    - Maintains existing RLS policies for other operations
*/

-- Add policy to allow users to insert their own profile during registration
CREATE POLICY "Users can insert own profile during registration"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
  );