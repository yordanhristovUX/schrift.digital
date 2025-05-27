/*
  # Fix recursive RLS policies for users table

  1. Changes
    - Drop and recreate policies to avoid recursion
    - Use auth.jwt() for role checks instead of querying users table
    - Add safety checks before creating policies
  
  2. Security
    - Maintain RLS security while fixing recursion
    - Ensure proper access control for users and admins
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admin users can manage all data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Enable insert for new users" ON users;

DO $$ 
BEGIN
  -- Create "Users can read own data" policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can read own data'
  ) THEN
    CREATE POLICY "Users can read own data"
    ON users
    FOR SELECT
    TO authenticated
    USING (
      auth.uid() = id OR 
      (auth.jwt() ->> 'role')::text = 'admin'
    );
  END IF;

  -- Create "Admin users can manage all data" policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Admin users can manage all data'
  ) THEN
    CREATE POLICY "Admin users can manage all data"
    ON users
    FOR ALL
    TO authenticated
    USING (
      (auth.jwt() ->> 'role')::text = 'admin'
    )
    WITH CHECK (
      (auth.jwt() ->> 'role')::text = 'admin'
    );
  END IF;

  -- Create "Users can update own data" policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can update own data'
  ) THEN
    CREATE POLICY "Users can update own data"
    ON users
    FOR UPDATE
    TO authenticated
    USING (
      auth.uid() = id
    )
    WITH CHECK (
      auth.uid() = id
    );
  END IF;

  -- Create "Enable insert for new users" policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Enable insert for new users'
  ) THEN
    CREATE POLICY "Enable insert for new users"
    ON users
    FOR INSERT
    TO authenticated
    WITH CHECK (
      auth.uid() = id
    );
  END IF;
END $$;