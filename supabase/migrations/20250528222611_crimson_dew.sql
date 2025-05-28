-- First, disable RLS temporarily to allow deletion
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Delete all records from stripe_orders
DELETE FROM stripe_orders;

-- Delete all records from stripe_subscriptions
DELETE FROM stripe_subscriptions;

-- Delete all records from stripe_customers
DELETE FROM stripe_customers;

-- Delete all records from users table
DELETE FROM users;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Reset sequences
ALTER SEQUENCE stripe_orders_id_seq RESTART WITH 1;
ALTER SEQUENCE stripe_subscriptions_id_seq RESTART WITH 1;
ALTER SEQUENCE stripe_customers_id_seq RESTART WITH 1;