/*
  # Add updated_at column to users table
  
  1. Changes
    - Add updated_at column if it doesn't exist
    - Create trigger to automatically update the timestamp
    - Add index for better performance
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE users ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS users_updated_at_idx ON users(updated_at);

-- Add comment for clarity
COMMENT ON COLUMN users.updated_at IS 'Timestamp of the last update to the user record';