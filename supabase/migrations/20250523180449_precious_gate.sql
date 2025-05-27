/*
  # Database Schema Setup

  1. Tables
    - users table with authentication integration
    - fonts table for storing font information
  
  2. Security
    - Enable RLS on both tables
    - Add policies for user access control
    - Add policies for font management
  
  3. Triggers
    - Add updated_at trigger for fonts table
*/

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- User policies with existence checks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can read own data'
  ) THEN
    CREATE POLICY "Users can read own data"
      ON users
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id OR (
        SELECT role FROM users WHERE id = auth.uid()
      ) = 'admin');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update own data'
  ) THEN
    CREATE POLICY "Users can update own data"
      ON users
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Enable insert for authentication service'
  ) THEN
    CREATE POLICY "Enable insert for authentication service"
      ON users
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END
$$;

-- Create fonts table if it doesn't exist
CREATE TABLE IF NOT EXISTS fonts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  category text,
  designer text,
  file_path text,
  is_paid boolean DEFAULT false,
  price numeric,
  weights text[],
  downloads integer DEFAULT 0,
  rating numeric DEFAULT 0,
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on fonts
ALTER TABLE fonts ENABLE ROW LEVEL SECURITY;

-- Font policies with existence checks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fonts' AND policyname = 'Public users can view fonts'
  ) THEN
    CREATE POLICY "Public users can view fonts"
      ON fonts
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fonts' AND policyname = 'Admin users can manage fonts'
  ) THEN
    CREATE POLICY "Admin users can manage fonts"
      ON fonts
      FOR ALL
      TO authenticated
      USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin')
      WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
  END IF;
END
$$;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists and create a new one
DROP TRIGGER IF EXISTS update_fonts_updated_at ON fonts;
CREATE TRIGGER update_fonts_updated_at
  BEFORE UPDATE ON fonts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();