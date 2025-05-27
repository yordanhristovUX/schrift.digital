/*
  # Add RLS policies for fonts table

  1. Changes
    - Add RLS policy for admin users to manage fonts
    - Add RLS policy for public users to view fonts

  2. Security
    - Enable RLS on fonts table (already enabled)
    - Add policy for admin users to perform all operations
    - Add policy for public users to view fonts
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admin users can manage fonts" ON fonts;
DROP POLICY IF EXISTS "Public users can view fonts" ON fonts;

-- Create new policies
CREATE POLICY "Admin users can manage fonts"
ON public.fonts
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

CREATE POLICY "Public users can view fonts"
ON public.fonts
FOR SELECT
TO public
USING (true);