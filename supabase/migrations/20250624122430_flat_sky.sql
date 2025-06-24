/*
  # Simplify to One-Time Purchase Model

  This migration restructures the system to use one-time purchases instead of recurring subscriptions.
  
  ## What this migration does:
  1. Creates a simple `user_subscriptions` table for tracking premium access
  2. Removes dependency on complex Stripe subscription relationships
  3. Sets up simple premium access tracking
  4. Creates helper functions for checking premium status

  ## New approach:
  - Users make one-time purchases through Stripe
  - Each purchase grants 1 month of premium access
  - Simple expiration date tracking
  - No recurring billing complexity
*/

-- Create a simple user_subscriptions table for tracking premium access
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  granted_by uuid REFERENCES auth.users(id), -- Admin who granted it
  stripe_payment_intent_id text, -- For tracking payments
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id) -- One subscription per user
);

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires_at ON user_subscriptions(expires_at);

-- RLS Policies
CREATE POLICY "Users can view their own subscription"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admin policies using the hardcoded admin UUID
DO $$
DECLARE
  admin_uuid uuid;
BEGIN
  SELECT id INTO admin_uuid 
  FROM auth.users 
  WHERE email = 'yhristov.xyz@gmail.com';
  
  IF admin_uuid IS NOT NULL THEN
    EXECUTE format('
      CREATE POLICY "Admin can manage all subscriptions"
        ON user_subscriptions
        FOR ALL
        TO authenticated
        USING (auth.uid() = %L)
        WITH CHECK (auth.uid() = %L)
    ', admin_uuid, admin_uuid);
  END IF;
END $$;

-- Create function to check if user has active premium
CREATE OR REPLACE FUNCTION has_active_premium()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = auth.uid()
    AND expires_at > now()
  );
$$;

-- Create function to get user's subscription info
CREATE OR REPLACE FUNCTION get_user_premium_info()
RETURNS TABLE (
  expires_at timestamptz,
  is_active boolean,
  days_remaining integer
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    us.expires_at,
    us.expires_at > now() as is_active,
    CASE 
      WHEN us.expires_at > now() THEN 
        EXTRACT(days FROM us.expires_at - now())::integer
      ELSE 0
    END as days_remaining
  FROM user_subscriptions us
  WHERE us.user_id = auth.uid();
$$;

-- Create function for admins to grant premium access
CREATE OR REPLACE FUNCTION grant_premium_access(
  target_user_id uuid,
  months integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_uuid uuid;
  new_expires_at timestamptz;
BEGIN
  -- Get admin UUID
  SELECT id INTO admin_uuid 
  FROM auth.users 
  WHERE email = 'yhristov.xyz@gmail.com';
  
  -- Check if current user is admin
  IF auth.uid() != admin_uuid THEN
    RAISE EXCEPTION 'Only admin can grant premium access';
  END IF;
  
  -- Calculate new expiration date
  -- If user already has premium, extend from current expiration
  -- Otherwise, start from now
  SELECT COALESCE(
    GREATEST(expires_at, now()) + (months || ' months')::interval,
    now() + (months || ' months')::interval
  ) INTO new_expires_at
  FROM user_subscriptions
  WHERE user_id = target_user_id;
  
  -- If no existing subscription found, start from now
  IF new_expires_at IS NULL THEN
    new_expires_at := now() + (months || ' months')::interval;
  END IF;
  
  -- Insert or update subscription
  INSERT INTO user_subscriptions (user_id, expires_at, granted_by, updated_at)
  VALUES (target_user_id, new_expires_at, admin_uuid, now())
  ON CONFLICT (user_id) DO UPDATE SET
    expires_at = new_expires_at,
    granted_by = admin_uuid,
    updated_at = now();
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION has_active_premium() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_premium_info() TO authenticated;
GRANT EXECUTE ON FUNCTION grant_premium_access(uuid, integer) TO authenticated;

-- Create a view for admin to see all user subscriptions
CREATE OR REPLACE VIEW admin_user_subscriptions AS
SELECT 
  us.id,
  us.user_id,
  u.email,
  u.full_name,
  us.expires_at,
  us.expires_at > now() as is_active,
  CASE 
    WHEN us.expires_at > now() THEN 
      EXTRACT(days FROM us.expires_at - now())::integer
    ELSE 0
  END as days_remaining,
  us.granted_by,
  admin_user.email as granted_by_email,
  us.stripe_payment_intent_id,
  us.created_at,
  us.updated_at
FROM user_subscriptions us
JOIN users u ON us.user_id = u.id
LEFT JOIN users admin_user ON us.granted_by = admin_user.id
ORDER BY us.updated_at DESC;

-- Grant access to admin
GRANT SELECT ON admin_user_subscriptions TO authenticated;

-- Migrate existing subscription data if any
DO $$
DECLARE
  rec RECORD;
  admin_uuid uuid;
BEGIN
  -- Get admin UUID
  SELECT id INTO admin_uuid 
  FROM auth.users 
  WHERE email = 'yhristov.xyz@gmail.com';
  
  -- Migrate active Stripe subscriptions to new format
  FOR rec IN 
    SELECT DISTINCT
      sc.user_id,
      ss.current_period_end
    FROM stripe_customers sc
    JOIN stripe_subscriptions ss ON sc.customer_id = ss.customer_id
    WHERE ss.status = 'active'
    AND ss.deleted_at IS NULL
    AND sc.deleted_at IS NULL
  LOOP
    INSERT INTO user_subscriptions (
      user_id, 
      expires_at, 
      granted_by,
      created_at,
      updated_at
    )
    VALUES (
      rec.user_id,
      to_timestamp(rec.current_period_end),
      admin_uuid,
      now(),
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      expires_at = GREATEST(user_subscriptions.expires_at, to_timestamp(rec.current_period_end)),
      updated_at = now();
  END LOOP;
  
  RAISE NOTICE 'Migration completed. Migrated existing active subscriptions to new format.';
END $$;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_subscriptions_updated_at();