/*
  # Fix admin permissions for user table access

  This migration fixes the "permission denied for table users" error by:
  1. Creating a security definer function that can access the users table
  2. Updating RLS policies to use direct auth.users checks instead of public.users
  3. Ensuring admin users have proper access to all necessary tables

  ## Changes:
  1. Create secure admin check function
  2. Update Stripe table policies to use auth.users directly
  3. Add proper admin policies for users table
*/

-- Create a security definer function to safely check admin status
CREATE OR REPLACE FUNCTION check_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid() 
    AND au.email = 'yhristov.xyz@gmail.com'
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_is_admin() TO authenticated;

-- Drop existing problematic policies on Stripe tables
DROP POLICY IF EXISTS "Admin can manage all customer records" ON stripe_customers;
DROP POLICY IF EXISTS "Admin can manage all subscription records" ON stripe_subscriptions;
DROP POLICY IF EXISTS "Admin can manage all order records" ON stripe_orders;

-- Create new admin policies using the secure function
CREATE POLICY "Admin can manage all customer records"
  ON stripe_customers
  FOR ALL
  TO authenticated
  USING (check_is_admin())
  WITH CHECK (check_is_admin());

CREATE POLICY "Admin can manage all subscription records"
  ON stripe_subscriptions
  FOR ALL
  TO authenticated
  USING (check_is_admin())
  WITH CHECK (check_is_admin());

CREATE POLICY "Admin can manage all order records"
  ON stripe_orders
  FOR ALL
  TO authenticated
  USING (check_is_admin())
  WITH CHECK (check_is_admin());

-- Also ensure admin has full access to users table
DROP POLICY IF EXISTS "Admin users full access" ON users;
CREATE POLICY "Admin users full access"
  ON users
  FOR ALL
  TO authenticated
  USING (check_is_admin())
  WITH CHECK (check_is_admin());

-- Update the is_admin() function to use the secure version
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT check_is_admin();
$$;

-- Verify the setup
DO $$
DECLARE
  admin_exists boolean;
  admin_user_id uuid;
BEGIN
  -- Check if admin exists in auth.users
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'yhristov.xyz@gmail.com';
  
  IF admin_user_id IS NOT NULL THEN
    RAISE NOTICE 'Admin user found with ID: %', admin_user_id;
    
    -- Check if admin exists in public.users
    IF EXISTS (SELECT 1 FROM public.users WHERE id = admin_user_id) THEN
      RAISE NOTICE 'Admin user also exists in public.users table';
    ELSE
      RAISE NOTICE 'WARNING: Admin user missing from public.users table';
      
      -- Create the admin user in public.users if missing
      INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
      VALUES (
        admin_user_id,
        'yhristov.xyz@gmail.com',
        'Admin User',
        'admin',
        now(),
        now()
      )
      ON CONFLICT (id) DO UPDATE SET
        role = 'admin',
        updated_at = now();
        
      RAISE NOTICE 'Created/updated admin user in public.users table';
    END IF;
  ELSE
    RAISE NOTICE 'WARNING: Admin user not found in auth.users';
  END IF;
END $$;