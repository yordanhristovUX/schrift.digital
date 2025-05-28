/*
  # Add RLS policy for user registration

  1. Security Changes
    - Add RLS policy to allow new user registration
    - Policy allows inserting new users during registration process
    - Ensures user can only insert their own data with matching auth.uid()
    
  2. Notes
    - This policy is critical for the registration flow to work
    - Works in conjunction with existing policies
    - Maintains security by enforcing user ID match
*/

-- Add policy to allow inserting new users during registration
CREATE POLICY "Allow users to insert their own profile"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = id);