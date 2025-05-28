-- Drop existing policies and triggers
DROP POLICY IF EXISTS "Enable public registration" ON users;
DROP POLICY IF EXISTS "Enable user registration" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admin users can manage all data" ON users;
DROP POLICY IF EXISTS "Users can insert own profile during registration" ON users;
DROP POLICY IF EXISTS "Enable insert for registration" ON users;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create trigger function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'user'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for user management
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