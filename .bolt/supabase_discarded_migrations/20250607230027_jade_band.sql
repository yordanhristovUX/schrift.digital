/*
  # Fix Users Table RLS Policies

  This migration fixes the infinite recursion issue in the users table RLS policies
  by simplifying and correcting the policy logic.

  ## Changes Made:
  1. Drop existing problematic policies
  2. Create simplified, non-recursive policies
  3. Ensure proper access control without circular references

  ## Security:
  - Users can read and update their own data
  - Admin users can manage all user data
  - Public users can insert during registration
*/

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Admin users can manage all data" ON users;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON users;
DROP POLICY IF EXISTS "Allow users to insert their own profile during registration" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

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

-- Separate admin policy that doesn't reference the users table in a recursive way
-- We'll use a direct role check from auth.jwt() instead
CREATE POLICY "Admin full access"
  ON users
  FOR ALL
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() ->> 'user_metadata' ->> 'role')::text,
      (auth.jwt() ->> 'app_metadata' ->> 'role')::text,
      ''
    ) = 'admin'
  )
  WITH CHECK (
    COALESCE(
      (auth.jwt() ->> 'user_metadata' ->> 'role')::text,
      (auth.jwt() ->> 'app_metadata' ->> 'role')::text,
      ''
    ) = 'admin'
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