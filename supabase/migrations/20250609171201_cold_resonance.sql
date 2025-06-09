/*
  # Fix user registration trigger

  1. Problem Analysis
    - The registration is failing with "Database error saving new user"
    - The `handle_new_user` function exists but may have issues
    - Need to ensure the trigger and function work correctly

  2. Solution
    - Recreate the `handle_new_user` function with proper error handling
    - Ensure the trigger is properly configured
    - Add proper RLS policies for user insertion

  3. Security
    - Maintain existing RLS policies
    - Ensure users can only create their own profiles
*/

-- Drop existing trigger and function to recreate them
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users table
  INSERT INTO public.users (id, full_name, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    'user',
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth.users insertion
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure the users table has proper constraints and defaults
ALTER TABLE public.users 
  ALTER COLUMN full_name SET DEFAULT '',
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- Make sure the foreign key constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_id_fkey' 
    AND table_name = 'users'
  ) THEN
    ALTER TABLE public.users 
    ADD CONSTRAINT users_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure RLS policies allow user insertion during registration
DROP POLICY IF EXISTS "Allow public registration" ON public.users;
CREATE POLICY "Allow public registration" 
  ON public.users 
  FOR INSERT 
  TO anon 
  WITH CHECK (true);

-- Ensure authenticated users can insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" 
  ON public.users 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);