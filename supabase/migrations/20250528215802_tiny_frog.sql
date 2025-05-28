-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable insert for new users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admin users can manage all data" ON users;
DROP POLICY IF EXISTS "Allow users to create their own profile during registration" ON users;
DROP POLICY IF EXISTS "Allow initial profile creation during signup" ON users;
DROP POLICY IF EXISTS "Enable registration for new users" ON users;
DROP POLICY IF EXISTS "Users can create their own profile during registration" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for registration" ON users;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON users;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new consolidated policies
CREATE POLICY "Enable public registration"
ON users
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);

CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin users can manage all data"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);