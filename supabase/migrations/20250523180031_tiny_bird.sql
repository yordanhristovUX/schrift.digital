/*
  # Create users table and policies

  1. New Tables
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text, not null)
      - `email` (text, unique, not null)
      - `role` (text, not null, default 'user')
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on users table
    - Add policies for:
      - Users can read their own data
      - Users can update their own data
      - Allow new user registration
      - Admins can read all data
*/

-- Drop existing users table if it exists
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow users to read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR (
    SELECT role FROM users WHERE id = auth.uid()
  ) = 'admin');

-- Allow users to update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Allow new user registration
CREATE POLICY "Enable insert for authentication service"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);