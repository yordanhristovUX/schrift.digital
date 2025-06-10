/*
  # Clean User Data for Testing

  This migration removes all traces of the specified user from both auth.users and public.users tables
  to allow for clean testing of the delete functionality.

  ## What this migration does:
  1. Removes user from public.users table
  2. Removes user from auth.users table (requires service role)
  3. Cleans up any related data (subscriptions, analytics, etc.)
  4. Ensures clean state for testing

  ## Target user:
  - Email: primallift@gmail.com
*/

-- First, get the user ID if it exists
DO $$
DECLARE
    target_user_id uuid;
    target_email text := 'primallift@gmail.com';
BEGIN
    -- Try to get user ID from public.users first
    SELECT id INTO target_user_id FROM public.users WHERE email = target_email;
    
    -- If not found in public.users, try auth.users
    IF target_user_id IS NULL THEN
        SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;
    END IF;
    
    IF target_user_id IS NOT NULL THEN
        RAISE NOTICE 'Found user % with ID: %', target_email, target_user_id;
        
        -- Clean up related data first (in correct order due to foreign keys)
        
        -- Delete analytics data
        DELETE FROM font_analytics WHERE user_id = target_user_id;
        DELETE FROM search_analytics WHERE user_id = target_user_id;
        DELETE FROM font_preview_sessions WHERE user_id = target_user_id;
        
        -- Delete user favorites
        DELETE FROM user_font_favorites WHERE user_id = target_user_id;
        
        -- Delete font comparisons (two-step process)
        -- First get comparison IDs
        DELETE FROM comparison_fonts 
        WHERE comparison_id IN (
            SELECT id FROM font_comparisons WHERE user_id = target_user_id
        );
        
        -- Then delete comparisons
        DELETE FROM font_comparisons WHERE user_id = target_user_id;
        
        -- Clean up Stripe data
        -- Mark subscriptions as deleted
        UPDATE stripe_subscriptions 
        SET status = 'canceled', deleted_at = now()
        WHERE customer_id IN (
            SELECT customer_id FROM stripe_customers WHERE user_id = target_user_id
        );
        
        -- Mark orders as deleted
        UPDATE stripe_orders 
        SET deleted_at = now()
        WHERE customer_id IN (
            SELECT customer_id FROM stripe_customers WHERE user_id = target_user_id
        );
        
        -- Mark customers as deleted
        UPDATE stripe_customers 
        SET deleted_at = now()
        WHERE user_id = target_user_id;
        
        -- Delete from public.users
        DELETE FROM public.users WHERE id = target_user_id;
        RAISE NOTICE 'Deleted user from public.users table';
        
        -- Note: We cannot delete from auth.users via SQL migration
        -- This needs to be done via the Supabase admin API
        RAISE NOTICE 'User data cleaned. Auth user must be deleted via admin API.';
        
    ELSE
        RAISE NOTICE 'User % not found in either table', target_email;
    END IF;
END $$;

-- Also clean up any orphaned records for this email
DELETE FROM public.users WHERE email = 'primallift@gmail.com';

-- Verify cleanup
DO $$
DECLARE
    public_count integer;
    auth_count integer;
BEGIN
    SELECT COUNT(*) INTO public_count FROM public.users WHERE email = 'primallift@gmail.com';
    SELECT COUNT(*) INTO auth_count FROM auth.users WHERE email = 'primallift@gmail.com';
    
    RAISE NOTICE 'Cleanup verification:';
    RAISE NOTICE '  - public.users records: %', public_count;
    RAISE NOTICE '  - auth.users records: %', auth_count;
    
    IF auth_count > 0 THEN
        RAISE NOTICE 'WARNING: Auth user still exists and must be deleted via admin API';
    END IF;
END $$;