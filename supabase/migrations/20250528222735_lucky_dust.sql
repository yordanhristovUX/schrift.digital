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
DELETE FROM auth.users;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_orders ENABLE ROW LEVEL SECURITY;

-- Reset sequences
ALTER SEQUENCE IF EXISTS stripe_orders_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS stripe_subscriptions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS stripe_customers_id_seq RESTART WITH 1;