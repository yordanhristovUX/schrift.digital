-- Drop existing objects
DROP FUNCTION IF EXISTS handle_auth_user_event CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create user role type
CREATE TYPE user_role AS ENUM ('admin', 'user');

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Enable public registration"
ON users
FOR INSERT
TO public
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM users WHERE email = LOWER(NEW.email)
  )
);

CREATE POLICY "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);

CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin users can manage all data"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create email uniqueness check
CREATE OR REPLACE FUNCTION check_email_unique()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM users 
    WHERE email = LOWER(NEW.email) 
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Email already exists';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_email_unique
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION check_email_unique();

-- Create subscription status type
CREATE TYPE stripe_subscription_status AS ENUM (
    'not_started',
    'incomplete',
    'incomplete_expired',
    'trialing',
    'active',
    'past_due',
    'canceled',
    'unpaid',
    'paused'
);

-- Create order status type
CREATE TYPE stripe_order_status AS ENUM (
    'pending',
    'completed',
    'canceled'
);

-- Create stripe_customers table
CREATE TABLE stripe_customers (
  id bigint primary key generated always as identity,
  user_id uuid references auth.users(id) not null unique,
  customer_id text not null unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz default null
);

ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own customer data"
ON stripe_customers
FOR SELECT
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NULL);

-- Create stripe_subscriptions table
CREATE TABLE stripe_subscriptions (
  id bigint primary key generated always as identity,
  customer_id text unique not null,
  subscription_id text default null,
  price_id text default null,
  current_period_start bigint default null,
  current_period_end bigint default null,
  cancel_at_period_end boolean default false,
  payment_method_brand text default null,
  payment_method_last4 text default null,
  status stripe_subscription_status not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz default null
);

ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription data"
ON stripe_subscriptions
FOR SELECT
TO authenticated
USING (
    customer_id IN (
        SELECT customer_id
        FROM stripe_customers
        WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
    AND deleted_at IS NULL
);

-- Create stripe_orders table
CREATE TABLE stripe_orders (
    id bigint primary key generated always as identity,
    checkout_session_id text not null,
    payment_intent_id text not null,
    customer_id text not null,
    amount_subtotal bigint not null,
    amount_total bigint not null,
    currency text not null,
    payment_status text not null,
    status stripe_order_status not null default 'pending',
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    deleted_at timestamptz default null
);

ALTER TABLE stripe_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own order data"
ON stripe_orders
FOR SELECT
TO authenticated
USING (
    customer_id IN (
        SELECT customer_id
        FROM stripe_customers
        WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
    AND deleted_at IS NULL
);

-- Create views
CREATE VIEW stripe_user_subscriptions WITH (security_invoker = true) AS
SELECT
    c.customer_id,
    s.subscription_id,
    s.status as subscription_status,
    s.price_id,
    s.current_period_start,
    s.current_period_end,
    s.cancel_at_period_end,
    s.payment_method_brand,
    s.payment_method_last4
FROM stripe_customers c
LEFT JOIN stripe_subscriptions s ON c.customer_id = s.customer_id
WHERE c.user_id = auth.uid()
AND c.deleted_at IS NULL
AND s.deleted_at IS NULL;

CREATE VIEW stripe_user_orders WITH (security_invoker = true) AS
SELECT
    c.customer_id,
    o.id as order_id,
    o.checkout_session_id,
    o.payment_intent_id,
    o.amount_subtotal,
    o.amount_total,
    o.currency,
    o.payment_status,
    o.status as order_status,
    o.created_at as order_date
FROM stripe_customers c
LEFT JOIN stripe_orders o ON c.customer_id = o.customer_id
WHERE c.user_id = auth.uid()
AND c.deleted_at IS NULL
AND o.deleted_at IS NULL;

GRANT SELECT ON stripe_user_subscriptions TO authenticated;
GRANT SELECT ON stripe_user_orders TO authenticated;

-- Create font_weight type
CREATE TYPE font_weight AS ENUM (
    'Thin',
    'ExtraLight',
    'Light',
    'Regular',
    'Medium',
    'SemiBold',
    'Bold',
    'ExtraBold',
    'Black'
);

-- Create fonts table
CREATE TABLE fonts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  category text,
  designer text,
  foundry text,
  is_paid boolean DEFAULT false,
  price numeric,
  weights text[],
  styles text[],
  downloads integer DEFAULT 0,
  rating numeric DEFAULT 0,
  featured boolean DEFAULT false,
  license_type text,
  language_support text[],
  opentype_features text[],
  character_set text[],
  font_metrics jsonb,
  sample_text text,
  tags text[],
  similar_fonts text[],
  weight_files jsonb,
  year_published integer,
  version text,
  copyright text,
  license_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE fonts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public users can view fonts"
ON fonts
FOR SELECT
TO public
USING (true);

CREATE POLICY "Admin users can manage fonts"
ON fonts
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'::user_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'::user_role
  )
);

-- Create weight validation function
CREATE OR REPLACE FUNCTION validate_font_weights()
RETURNS trigger AS $$
DECLARE
  weight_value text;
  weight_key text;
  weight_object jsonb;
BEGIN
  IF NEW.weight_files IS NULL THEN
    RETURN NEW;
  END IF;
  
  FOR weight_key, weight_object IN SELECT * FROM jsonb_each(NEW.weight_files)
  LOOP
    weight_value := weight_object->>'weight';
    IF weight_value IS NOT NULL AND weight_value::font_weight IS NULL THEN
      RAISE EXCEPTION 'Invalid font weight: %', weight_value;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for weight validation
CREATE TRIGGER validate_font_weights_trigger
  BEFORE INSERT OR UPDATE ON fonts
  FOR EACH ROW
  EXECUTE FUNCTION validate_font_weights();

-- Create weights/styles normalization function
CREATE OR REPLACE FUNCTION normalize_font_weights_and_styles()
RETURNS trigger AS $$
DECLARE
  weight_value text;
  style_value text;
  weight_key text;
  weight_object jsonb;
  weights text[] := '{}';
  styles text[] := '{}';
BEGIN
  IF NEW.weight_files IS NULL THEN
    NEW.weights := NULL;
    NEW.styles := NULL;
    RETURN NEW;
  END IF;
  
  FOR weight_key, weight_object IN SELECT * FROM jsonb_each(NEW.weight_files)
  LOOP
    weight_value := weight_object->>'weight';
    style_value := weight_object->>'style';
    
    IF weight_value IS NOT NULL AND NOT weights @> ARRAY[weight_value] THEN
      weights := array_append(weights, weight_value);
    END IF;
    
    IF style_value IS NOT NULL 
       AND NOT styles @> ARRAY[style_value]
       AND style_value IN ('Normal', 'Italic') THEN
      styles := array_append(styles, style_value);
    END IF;
  END LOOP;
  
  SELECT array_agg(w ORDER BY 
    CASE w
      WHEN 'Thin' THEN 1
      WHEN 'ExtraLight' THEN 2
      WHEN 'Light' THEN 3
      WHEN 'Regular' THEN 4
      WHEN 'Medium' THEN 5
      WHEN 'SemiBold' THEN 6
      WHEN 'Bold' THEN 7
      WHEN 'ExtraBold' THEN 8
      WHEN 'Black' THEN 9
    END)
  FROM unnest(weights) w
  INTO NEW.weights;
  
  SELECT array_agg(s ORDER BY s != 'Normal')
  FROM unnest(styles) s
  INTO NEW.styles;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for weights/styles normalization
CREATE TRIGGER normalize_font_weights_and_styles_trigger
  BEFORE INSERT OR UPDATE ON fonts
  FOR EACH ROW
  EXECUTE FUNCTION normalize_font_weights_and_styles();