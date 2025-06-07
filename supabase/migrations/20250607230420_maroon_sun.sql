/*
  # Fix RLS Infinite Recursion

  1. Problem
    - Infinite recursion detected in policy for relation "users"
    - Admin check policies on other tables are causing circular references
    
  2. Solution
    - Create a security definer function to check admin role safely
    - Update policies to use this function instead of direct table queries
    - Ensure users table policies don't cause recursion
    
  3. Changes
    - Create `is_admin()` function with security definer
    - Update all admin policies to use this function
    - Simplify users table policies to avoid recursion
*/

-- Drop existing problematic policies first
DROP POLICY IF EXISTS "Admin users can manage collections" ON font_collections;
DROP POLICY IF EXISTS "Admin users can manage fonts" ON fonts;
DROP POLICY IF EXISTS "Admin users can manage collection fonts" ON collection_fonts;
DROP POLICY IF EXISTS "Admin users can view all analytics" ON font_analytics;
DROP POLICY IF EXISTS "Admin users can view all preview sessions" ON font_preview_sessions;
DROP POLICY IF EXISTS "Admin users can view search analytics" ON search_analytics;

-- Create a security definer function to safely check admin role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users au
    JOIN public.users u ON au.id = u.id
    WHERE au.id = auth.uid() 
    AND u.role = 'admin'::user_role
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- Recreate admin policies using the safe function
CREATE POLICY "Admin users can manage collections"
  ON font_collections
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin users can manage fonts"
  ON fonts
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin users can manage collection fonts"
  ON collection_fonts
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin users can view all analytics"
  ON font_analytics
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admin users can view all preview sessions"
  ON font_preview_sessions
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admin users can view search analytics"
  ON search_analytics
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Ensure users table policies are simple and don't cause recursion
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Allow public registration" ON users;

-- Recreate users policies with simple, non-recursive logic
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow public registration"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);