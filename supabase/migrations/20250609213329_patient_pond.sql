/*
  # Make yhristov.xyz@gmail.com an admin

  This migration updates the user role for yhristov.xyz@gmail.com to 'admin'.
  
  ## What this migration does:
  1. Updates the role column in the users table
  2. Sets the role to 'admin' for the specified email address
  
  ## Security
  - Only affects the specific user with email yhristov.xyz@gmail.com
  - Uses safe UPDATE with WHERE clause to target specific user
*/

-- Update user role to admin for yhristov.xyz@gmail.com
UPDATE public.users 
SET 
  role = 'admin',
  updated_at = now()
WHERE email = 'yhristov.xyz@gmail.com';

-- Verify the update was successful
DO $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count 
  FROM public.users 
  WHERE email = 'yhristov.xyz@gmail.com' AND role = 'admin';
  
  IF user_count = 1 THEN
    RAISE NOTICE 'Successfully updated yhristov.xyz@gmail.com to admin role';
  ELSE
    RAISE NOTICE 'User yhristov.xyz@gmail.com not found or role not updated';
  END IF;
END $$;