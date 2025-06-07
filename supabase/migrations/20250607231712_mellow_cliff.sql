/*
  # Fix User Policies and Admin Access

  This migration fixes user policies to avoid recursion issues and properly
  handles admin access without causing policy conflicts.

  ## Changes:
  1. Safely drops existing policies using IF EXISTS
  2. Creates new simplified policies without recursion
  3. Updates trigger function for proper admin role assignment
  4. Creates helper function for admin checks
*/

-- Drop existing policies safely
DO $$
BEGIN
  -- Drop all existing policies on users table
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
  DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
END $$;

-- Create simplified policies without recursion

-- Policy for reading user data
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy for updating user data
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy for inserting user data during registration
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy for public registration (needed for sign-up process)
CREATE POLICY "Allow public registration"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Simple admin policy using direct email check
-- This avoids JWT parsing issues and recursive queries
CREATE POLICY "Admin full access"
  ON users
  FOR ALL
  TO authenticated
  USING (
    auth.email() = 'admin@schrift.digital'
  )
  WITH CHECK (
    auth.email() = 'admin@schrift.digital'
  );

-- Update the trigger function to set admin role properly
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create a simple function to check admin role that can be used elsewhere
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN auth.email() = 'admin@schrift.digital';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;