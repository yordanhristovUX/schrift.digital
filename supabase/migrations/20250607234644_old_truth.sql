/*
  # Add subscription for yhristov.xyz@gmail.com

  This migration creates the necessary Stripe customer and subscription records
  to make yhristov.xyz@gmail.com appear as a subscribed user.

  ## What this migration does:
  1. Creates a Stripe customer record for the user
  2. Creates an active subscription record
  3. Sets up the relationship between user and subscription

  ## Tables affected:
  - stripe_customers
  - stripe_subscriptions
*/

-- First, get the user ID for yhristov.xyz@gmail.com
DO $$
DECLARE
    target_user_id uuid;
    customer_id_value text := 'cus_manual_yhristov_' || extract(epoch from now())::text;
    subscription_id_value text := 'sub_manual_yhristov_' || extract(epoch from now())::text;
BEGIN
    -- Get the user ID
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'yhristov.xyz@gmail.com';
    
    -- If user doesn't exist, create them first
    IF target_user_id IS NULL THEN
        -- Insert into auth.users (this will trigger the handle_new_user function)
        INSERT INTO auth.users (
            id,
            email,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_user_meta_data
        ) VALUES (
            gen_random_uuid(),
            'yhristov.xyz@gmail.com',
            now(),
            now(),
            now(),
            '{"full_name": "Yordan Hristov"}'::jsonb
        );
        
        -- Get the newly created user ID
        SELECT id INTO target_user_id 
        FROM auth.users 
        WHERE email = 'yhristov.xyz@gmail.com';
    END IF;
    
    -- Create Stripe customer record
    INSERT INTO stripe_customers (
        user_id,
        customer_id,
        created_at,
        updated_at
    ) VALUES (
        target_user_id,
        customer_id_value,
        now(),
        now()
    ) ON CONFLICT (user_id) DO UPDATE SET
        customer_id = customer_id_value,
        updated_at = now();
    
    -- Create active subscription record
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
    ) VALUES (
        customer_id_value,
        subscription_id_value,
        'price_1RT3whAJ880fjAKxqmrh4Iej', -- The premium price ID from stripe-config.ts
        extract(epoch from now())::bigint, -- Current time as start
        extract(epoch from (now() + interval '1 month'))::bigint, -- One month from now as end
        false,
        'visa',
        '4242',
        'active',
        now(),
        now()
    ) ON CONFLICT (customer_id) DO UPDATE SET
        subscription_id = subscription_id_value,
        price_id = 'price_1RT3whAJ880fjAKxqmrh4Iej',
        current_period_start = extract(epoch from now())::bigint,
        current_period_end = extract(epoch from (now() + interval '1 month'))::bigint,
        cancel_at_period_end = false,
        payment_method_brand = 'visa',
        payment_method_last4 = '4242',
        status = 'active',
        updated_at = now();
    
    RAISE NOTICE 'Successfully created subscription for yhristov.xyz@gmail.com with customer_id: %', customer_id_value;
END $$;