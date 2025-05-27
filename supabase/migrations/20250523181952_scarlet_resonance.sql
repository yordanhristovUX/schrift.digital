-- Create admin user if it doesn't exist
DO $$
DECLARE
  admin_uid UUID;
BEGIN
  -- First, check if admin user already exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@cyrillictype.com'
  ) THEN
    -- Insert into auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@cyrillictype.com',
      crypt('admin123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Admin User"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO admin_uid;

    -- Insert into users table with admin role
    INSERT INTO users (id, full_name, email, role)
    VALUES (admin_uid, 'Admin User', 'admin@cyrillictype.com', 'admin');
  END IF;
END
$$;