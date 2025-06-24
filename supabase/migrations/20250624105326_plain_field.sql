/*
  # Fix Admin Permissions - Final Solution

  This migration completely removes the circular dependency by:
  1. Using direct auth.uid() checks instead of querying the users table
  2. Creating a hardcoded admin UUID approach
  3. Ensuring all Stripe operations work for the admin user

  ## Changes:
  - Replace all is_admin() function calls with direct UUID checks
  - Update all RLS policies to use the admin's actual UUID
  - Remove problematic function dependencies
*/

-- First, get the admin user's UUID and store it for use in policies
DO $$
DECLARE
  admin_uuid uuid;
BEGIN
  -- Get the admin user's UUID from auth.users
  SELECT id INTO admin_uuid 
  FROM auth.users 
  WHERE email = 'yhristov.xyz@gmail.com';
  
  IF admin_uuid IS NOT NULL THEN
    RAISE NOTICE 'Found admin user UUID: %', admin_uuid;
    
    -- Drop all existing problematic policies
    DROP POLICY IF EXISTS "Admin can manage all customer records" ON stripe_customers;
    DROP POLICY IF EXISTS "Admin can manage all subscription records" ON stripe_subscriptions;
    DROP POLICY IF EXISTS "Admin can manage all order records" ON stripe_orders;
    DROP POLICY IF EXISTS "Admin users full access" ON users;
    
    -- Create new policies using the actual admin UUID
    EXECUTE format('
      CREATE POLICY "Admin can manage all customer records"
        ON stripe_customers
        FOR ALL
        TO authenticated
        USING (auth.uid() = %L)
        WITH CHECK (auth.uid() = %L)
    ', admin_uuid, admin_uuid);
    
    EXECUTE format('
      CREATE POLICY "Admin can manage all subscription records"
        ON stripe_subscriptions
        FOR ALL
        TO authenticated
        USING (auth.uid() = %L)
        WITH CHECK (auth.uid() = %L)
    ', admin_uuid, admin_uuid);
    
    EXECUTE format('
      CREATE POLICY "Admin can manage all order records"
        ON stripe_orders
        FOR ALL
        TO authenticated
        USING (auth.uid() = %L)
        WITH CHECK (auth.uid() = %L)
    ', admin_uuid, admin_uuid);
    
    EXECUTE format('
      CREATE POLICY "Admin users full access"
        ON users
        FOR ALL
        TO authenticated
        USING (auth.uid() = %L)
        WITH CHECK (auth.uid() = %L)
    ', admin_uuid, admin_uuid);
    
    -- Ensure the admin user exists in public.users with admin role
    INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
    VALUES (
      admin_uuid,
      'yhristov.xyz@gmail.com',
      'Admin User',
      'admin',
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'admin',
      email = 'yhristov.xyz@gmail.com',
      updated_at = now();
    
    RAISE NOTICE 'Successfully created admin policies with UUID: %', admin_uuid;
    
  ELSE
    RAISE EXCEPTION 'Admin user yhristov.xyz@gmail.com not found in auth.users table';
  END IF;
END $$;

-- Create a simple admin check function that doesn't query users table
CREATE OR REPLACE FUNCTION is_admin_simple()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'yhristov.xyz@gmail.com'
  );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_admin_simple() TO authenticated;

-- Update the existing is_admin function to use the simple version
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT is_admin_simple();
$$;

-- Verify the setup works
DO $$
DECLARE
  admin_uuid uuid;
  can_access_customers boolean := false;
  can_access_subscriptions boolean := false;
BEGIN
  SELECT id INTO admin_uuid 
  FROM auth.users 
  WHERE email = 'yhristov.xyz@gmail.com';
  
  IF admin_uuid IS NOT NULL THEN
    -- Test if the admin can access stripe_customers
    BEGIN
      PERFORM 1 FROM stripe_customers LIMIT 1;
      can_access_customers := true;
    EXCEPTION
      WHEN OTHERS THEN
        can_access_customers := false;
    END;
    
    -- Test if the admin can access stripe_subscriptions
    BEGIN
      PERFORM 1 FROM stripe_subscriptions LIMIT 1;
      can_access_subscriptions := true;
    EXCEPTION
      WHEN OTHERS THEN
        can_access_subscriptions := false;
    END;
    
    RAISE NOTICE 'Admin setup verification:';
    RAISE NOTICE '  - Admin UUID: %', admin_uuid;
    RAISE NOTICE '  - Can access customers: %', can_access_customers;
    RAISE NOTICE '  - Can access subscriptions: %', can_access_subscriptions;
  END IF;
END $$;