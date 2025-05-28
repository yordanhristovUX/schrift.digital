/*
  # Fix users table RLS policies

  1. Changes
    - Add RLS policy for user registration
    - Allow authenticated users to insert their own profile

  2. Security
    - Enable RLS on users table (if not already enabled)
    - Add policy for user registration
*/

-- Enable RLS if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Add policy for user registration
CREATE POLICY "Users can insert their own profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);