/*
  # Add updated_at column to users table

  1. Changes
    - Add `updated_at` column to `users` table with default value of now()
    - Add trigger to automatically update `updated_at` on row updates

  2. Notes
    - Uses IF NOT EXISTS to prevent errors if column already exists
    - Adds trigger to maintain updated_at automatically
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE users ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;