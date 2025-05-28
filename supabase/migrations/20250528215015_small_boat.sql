/*
  # Add RLS policy for user registration

  1. Changes
    - Add new RLS policy to allow users to create their own profile during registration
    
  2. Security
    - Policy ensures users can only insert their own profile data
    - Validates that the user ID matches the authenticated user's ID
*/

CREATE POLICY "Enable insert for registration"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);