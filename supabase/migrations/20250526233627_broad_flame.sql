/*
  # Update users table role column to enum type
  
  1. Changes
    - Create user_role enum type
    - Convert role column from text to user_role type
    - Add updated_at column and trigger
    
  2. Security
    - Drop dependent policies with CASCADE
    - Recreate policies after column change
*/

-- Create user_role type if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'user');
  END IF;
END $$;

-- Drop dependent policies
DROP POLICY IF EXISTS "Admin users can manage fonts" ON fonts;
DROP POLICY IF EXISTS "Admin users can manage font files" ON storage.objects;

-- Add a temporary column for the conversion
ALTER TABLE users ADD COLUMN role_new user_role;

-- Convert existing values to the new type
UPDATE users 
SET role_new = CASE 
  WHEN role = 'admin' THEN 'admin'::user_role 
  ELSE 'user'::user_role 
END;

-- Drop the old column and rename the new one
ALTER TABLE users DROP COLUMN role CASCADE;
ALTER TABLE users ALTER COLUMN role_new SET NOT NULL;
ALTER TABLE users ALTER COLUMN role_new SET DEFAULT 'user'::user_role;
ALTER TABLE users RENAME COLUMN role_new TO role;

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

-- Create or replace updated_at trigger
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- Recreate policies
CREATE POLICY "Admin users can manage fonts"
ON fonts
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'::user_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'::user_role
  )
);

CREATE POLICY "Admin users can manage font files"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'fonts' 
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'::user_role
  )
)
WITH CHECK (
  bucket_id = 'fonts'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'::user_role
  )
);