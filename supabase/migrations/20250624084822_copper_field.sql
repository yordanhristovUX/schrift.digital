/*
  # Fix RLS policies for stripe_customers table

  This migration adds the necessary RLS policies to allow admin users to create
  customer records for other users when granting manual subscriptions.

  ## What this migration does:
  1. Adds INSERT policy for admin users on stripe_customers table
  2. Adds INSERT policy for admin users on stripe_subscriptions table
  3. Ensures admins can grant subscriptions to any user

  ## Security:
  - Only admin users can insert customer and subscription records
  - Regular users maintain existing read-only access to their own data
*/

-- Add INSERT policy for admin users on stripe_customers
CREATE POLICY "Admin users can insert customer records"
  ON stripe_customers
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Add UPDATE policy for admin users on stripe_customers
CREATE POLICY "Admin users can update customer records"
  ON stripe_customers
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Add INSERT policy for admin users on stripe_subscriptions
CREATE POLICY "Admin users can insert subscription records"
  ON stripe_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Add UPDATE policy for admin users on stripe_subscriptions
CREATE POLICY "Admin users can update subscription records"
  ON stripe_subscriptions
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());