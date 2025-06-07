/*
  # Database Cleanup Migration

  This migration performs a complete cleanup of user data and related tables.
  
  ## What this migration does:
  1. Temporarily disables RLS for safe deletion
  2. Deletes all records from related tables in correct order
  3. Cleans auth.users table (preserving admin user)
  4. Re-enables RLS on all tables
  5. Resets auto-increment sequences

  ## IMPORTANT NOTES:
  - This is a DESTRUCTIVE operation that will delete all user data
  - Only the admin@cyrillictype.com user will be preserved
  - All sequences will be reset to start from 1
  - Use with extreme caution in production environments
*/

-- First, disable RLS temporarily to allow deletion
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_orders DISABLE ROW LEVEL SECURITY;

-- Delete all records from related tables in the correct order
DELETE FROM stripe_orders;
DELETE FROM stripe_subscriptions;
DELETE FROM stripe_customers;
DELETE FROM users;

-- Delete from auth.users (requires superuser privileges)
DELETE FROM auth.users WHERE email != 'admin@cyrillictype.com';

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_orders ENABLE ROW LEVEL SECURITY;

-- Reset sequences
ALTER SEQUENCE IF EXISTS stripe_orders_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS stripe_subscriptions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS stripe_customers_id_seq RESTART WITH 1;