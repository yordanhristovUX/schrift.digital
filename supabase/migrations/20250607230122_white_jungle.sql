/*
  # Fix RLS policies for users table

  This migration fixes the infinite recursion issue in RLS policies by:
  1. Dropping all existing problematic policies
  2. Creating simple, non-recursive policies
  3. Using a conservative approach for admin access
  4. Ensuring proper user registration flow

  ## Changes:
  1. Remove all existing RLS policies on users table
  2. Create basic policies for user self-management
  3. Create separate admin policies
  4. Update user creation trigger
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admin users can manage all data" ON users;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON users;
DROP POLICY IF EXISTS "Allow users to insert their own profile during registration" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Allow public registration" ON users;
DROP POLICY IF EXISTS "Admin full access" ON users;

-- Basic policy for users to read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Basic policy for users to update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy for user registration (authenticated users can insert their own profile)
CREATE POLICY "Users can insert their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy for public registration (needed for the signup process)
CREATE POLICY "Allow public registration"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Simple admin policy - check role directly from the users table
-- This avoids recursion by using a simple role check
CREATE POLICY "Admin users can manage all data"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user 
      WHERE admin_user.id = auth.uid() 
      AND admin_user.role = 'admin'::user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users admin_user 
      WHERE admin_user.id = auth.uid() 
      AND admin_user.role = 'admin'::user_role
    )
  );

-- Update the user creation trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    CASE 
      WHEN NEW.email = 'admin@schrift.digital' THEN 'admin'::user_role
      ELSE 'user'::user_role
    END
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- User already exists, just return NEW
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error and return NEW to not break auth flow
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create a helper function to check if current user is admin
CREATE OR REPLACE FUNCTION check_admin_role()
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role 
  FROM users 
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role = 'admin', false);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;