/*
  # Fix Admin RLS Policies for Stripe Tables

  This migration fixes the RLS policies to allow admin users to grant subscriptions
  by using a more direct admin check that avoids potential recursion issues.

  ## What this migration does:
  1. Drops existing problematic policies
  2. Creates new policies with direct admin email check
  3. Ensures admin users can manage Stripe data for all users

  ## Security:
  - Uses direct email check to avoid recursion
  - Maintains security by only allowing specific admin email
  - Preserves existing user policies
*/

-- Drop existing admin policies that might be causing issues
DROP POLICY IF EXISTS "Admin users can insert customer records" ON stripe_customers;
DROP POLICY IF EXISTS "Admin users can update customer records" ON stripe_customers;
DROP POLICY IF EXISTS "Admin users can insert subscription records" ON stripe_subscriptions;
DROP POLICY IF EXISTS "Admin users can update subscription records" ON stripe_subscriptions;

-- Create new admin policies using direct email check to avoid recursion
CREATE POLICY "Admin can manage all customer records"
  ON stripe_customers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'yhristov.xyz@gmail.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'yhristov.xyz@gmail.com'
    )
  );

CREATE POLICY "Admin can manage all subscription records"
  ON stripe_subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'yhristov.xyz@gmail.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'yhristov.xyz@gmail.com'
    )
  );

-- Also ensure the admin can manage orders if needed
CREATE POLICY "Admin can manage all order records"
  ON stripe_orders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'yhristov.xyz@gmail.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'yhristov.xyz@gmail.com'
    )
  );

-- Verify the admin user exists and log the result
DO $$
DECLARE
  admin_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = 'yhristov.xyz@gmail.com'
  ) INTO admin_exists;
  
  IF admin_exists THEN
    RAISE NOTICE 'Admin user yhristov.xyz@gmail.com found in auth.users';
  ELSE
    RAISE NOTICE 'WARNING: Admin user yhristov.xyz@gmail.com NOT found in auth.users';
  END IF;
END $$;