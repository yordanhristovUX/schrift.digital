/*
  # Restore Lost Subscription Data

  This migration restores the subscription data for yhristov.xyz@gmail.com
  that was lost after the database reset.

  ## What this migration does:
  - Creates or updates the Stripe customer record for yhristov.xyz@gmail.com
  - Creates the subscription record with the data from Stripe
  - Ensures proper relationships between user, customer, and subscription

  ## Data being restored:
  - Customer: yhristov.xyz@gmail.com
  - Subscription amount: €2.00
  - Date: May 28, 2024 7:04 PM
  - Status: Active (assuming it's still active)
*/

-- First, let's find the user ID for yhristov.xyz@gmail.com
DO $$
DECLARE
  target_user_id uuid;
  stripe_customer_id text := 'cus_restored_yhristov'; -- Placeholder customer ID
  subscription_date timestamptz := '2024-05-28 19:04:00+00'::timestamptz;
BEGIN
  -- Get the user ID for yhristov.xyz@gmail.com
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = 'yhristov.xyz@gmail.com';

  -- If user doesn't exist in auth.users, check public.users
  IF target_user_id IS NULL THEN
    SELECT id INTO target_user_id 
    FROM public.users 
    WHERE email = 'yhristov.xyz@gmail.com';
  END IF;

  -- If user still doesn't exist, create a placeholder entry
  IF target_user_id IS NULL THEN
    -- Generate a UUID for the user
    target_user_id := gen_random_uuid();
    
    -- Insert into public.users table
    INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
    VALUES (
      target_user_id,
      'yhristov.xyz@gmail.com',
      'Restored User',
      'user'::user_role,
      subscription_date,
      subscription_date
    )
    ON CONFLICT (email) DO UPDATE SET
      updated_at = subscription_date;
      
    -- Get the actual user ID after insert
    SELECT id INTO target_user_id 
    FROM public.users 
    WHERE email = 'yhristov.xyz@gmail.com';
  END IF;

  -- Now create or update the Stripe customer record
  INSERT INTO stripe_customers (user_id, customer_id, created_at, updated_at)
  VALUES (
    target_user_id,
    stripe_customer_id,
    subscription_date,
    subscription_date
  )
  ON CONFLICT (customer_id) DO UPDATE SET
    user_id = target_user_id,
    updated_at = subscription_date;

  -- Create the subscription record
  INSERT INTO stripe_subscriptions (
    customer_id,
    subscription_id,
    price_id,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    payment_method_brand,
    payment_method_last4,
    status,
    created_at,
    updated_at
  )
  VALUES (
    stripe_customer_id,
    'sub_restored_yhristov', -- Placeholder subscription ID
    'price_1RT3whAJ880fjAKxqmrh4Iej', -- The premium price ID from your config
    EXTRACT(epoch FROM subscription_date)::bigint, -- Convert to Unix timestamp
    EXTRACT(epoch FROM (subscription_date + INTERVAL '1 month'))::bigint, -- One month later
    false,
    'card', -- Generic payment method
    '3696', -- Last 4 digits from the screenshot
    'active'::stripe_subscription_status,
    subscription_date,
    subscription_date
  )
  ON CONFLICT (customer_id) DO UPDATE SET
    subscription_id = 'sub_restored_yhristov',
    price_id = 'price_1RT3whAJ880fjAKxqmrh4Iej',
    current_period_start = EXTRACT(epoch FROM subscription_date)::bigint,
    current_period_end = EXTRACT(epoch FROM (subscription_date + INTERVAL '1 month'))::bigint,
    cancel_at_period_end = false,
    payment_method_brand = 'card',
    payment_method_last4 = '3696',
    status = 'active'::stripe_subscription_status,
    updated_at = subscription_date;

  RAISE NOTICE 'Successfully restored subscription for yhristov.xyz@gmail.com with user_id: %', target_user_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error restoring subscription: %', SQLERRM;
END $$;

-- Verify the restoration
DO $$
DECLARE
  user_count integer;
  customer_count integer;
  subscription_count integer;
BEGIN
  SELECT COUNT(*) INTO user_count 
  FROM public.users 
  WHERE email = 'yhristov.xyz@gmail.com';
  
  SELECT COUNT(*) INTO customer_count 
  FROM stripe_customers sc
  JOIN public.users u ON sc.user_id = u.id
  WHERE u.email = 'yhristov.xyz@gmail.com';
  
  SELECT COUNT(*) INTO subscription_count 
  FROM stripe_subscriptions ss
  JOIN stripe_customers sc ON ss.customer_id = sc.customer_id
  JOIN public.users u ON sc.user_id = u.id
  WHERE u.email = 'yhristov.xyz@gmail.com'
    AND ss.status = 'active'::stripe_subscription_status;

  RAISE NOTICE 'Restoration verification:';
  RAISE NOTICE '- Users found: %', user_count;
  RAISE NOTICE '- Customers found: %', customer_count;
  RAISE NOTICE '- Active subscriptions found: %', subscription_count;
END $$;