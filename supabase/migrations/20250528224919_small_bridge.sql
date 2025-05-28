-- First, drop existing foreign key constraints
ALTER TABLE stripe_customers DROP CONSTRAINT IF EXISTS stripe_customers_user_id_fkey;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Recreate foreign key constraints with ON DELETE CASCADE
ALTER TABLE stripe_customers
  ADD CONSTRAINT stripe_customers_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

ALTER TABLE users
  ADD CONSTRAINT users_id_fkey
  FOREIGN KEY (id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Create function to handle user deletion
CREATE OR REPLACE FUNCTION handle_user_deletion()
RETURNS trigger AS $$
BEGIN
  -- Delete related records first
  DELETE FROM stripe_orders WHERE customer_id IN (
    SELECT customer_id FROM stripe_customers WHERE user_id = OLD.id
  );
  DELETE FROM stripe_subscriptions WHERE customer_id IN (
    SELECT customer_id FROM stripe_customers WHERE user_id = OLD.id
  );
  DELETE FROM stripe_customers WHERE user_id = OLD.id;
  DELETE FROM users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user deletion
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_deletion();

-- Temporarily disable RLS to clean up any orphaned records
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_orders DISABLE ROW LEVEL SECURITY;

-- Clean up orphaned records
DELETE FROM stripe_orders WHERE customer_id NOT IN (SELECT customer_id FROM stripe_customers);
DELETE FROM stripe_subscriptions WHERE customer_id NOT IN (SELECT customer_id FROM stripe_customers);
DELETE FROM stripe_customers WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM users WHERE id NOT IN (SELECT id FROM auth.users);

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_orders ENABLE ROW LEVEL SECURITY;