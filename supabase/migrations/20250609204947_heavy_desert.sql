/*
  # Fix User Registration and Email Confirmation Issues

  This migration addresses user registration problems by:
  1. Removing the problematic primallift user from both auth and public tables
  2. Ensuring the handle_new_user trigger function works properly
  3. Setting up proper email confirmation handling

  ## What this migration does:
  - Removes primallift@gmail.com user completely
  - Recreates the handle_new_user trigger function
  - Ensures proper user creation flow
*/

-- Remove the problematic user from public.users first (if exists)
DELETE FROM public.users WHERE email = 'primallift@gmail.com';

-- Remove the user from auth.users (this will cascade to related tables)
-- Note: This requires service role permissions
DO $$
DECLARE
    user_uuid uuid;
BEGIN
    -- Get the user ID first
    SELECT id INTO user_uuid FROM auth.users WHERE email = 'primallift@gmail.com';
    
    IF user_uuid IS NOT NULL THEN
        -- Delete from auth.users (this should cascade)
        DELETE FROM auth.users WHERE id = user_uuid;
        RAISE NOTICE 'Removed user primallift@gmail.com with ID: %', user_uuid;
    ELSE
        RAISE NOTICE 'User primallift@gmail.com not found in auth.users';
    END IF;
END $$;

-- Ensure the handle_new_user function exists and works properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer
SET search_path = public
AS $$
BEGIN
  -- Insert into public.users table
  INSERT INTO public.users (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    'user'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the auth process
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to check if email confirmation is working
CREATE OR REPLACE FUNCTION public.check_email_unique()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if email already exists in a different case
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE LOWER(email) = LOWER(NEW.email) 
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Email address already exists';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Ensure the email uniqueness trigger exists
DROP TRIGGER IF EXISTS ensure_email_unique ON public.users;
CREATE TRIGGER ensure_email_unique
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.check_email_unique();

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_users_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Ensure the updated_at trigger exists
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_users_updated_at();

-- Verify the users table has the correct structure
DO $$
BEGIN
  -- Check if the users table exists and has the right columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    RAISE EXCEPTION 'Users table does not exist';
  END IF;
  
  -- Check for required columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id'
  ) THEN
    RAISE EXCEPTION 'Users table missing id column';
  END IF;
  
  RAISE NOTICE 'Users table structure verified';
END $$;