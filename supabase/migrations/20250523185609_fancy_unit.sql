/*
  # Consolidate Font Policies

  1. Changes
    - Drop existing policies
    - Create new consolidated policies for fonts table
    - Update storage policies for font files
    
  2. Security
    - Enable RLS on fonts table
    - Add policies for admin management and public viewing
    - Add storage policies for font uploads
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admin users can manage fonts" ON fonts;
DROP POLICY IF EXISTS "Public users can view fonts" ON fonts;
DROP POLICY IF EXISTS "Admin users can insert fonts" ON fonts;

-- Create consolidated policies for fonts table
CREATE POLICY "Admin users can manage fonts"
ON public.fonts
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Public users can view fonts"
ON public.fonts
FOR SELECT
TO public
USING (true);

-- Update storage policies
DROP POLICY IF EXISTS "Admin users can manage font files" ON storage.objects;
DROP POLICY IF EXISTS "Public users can download font files" ON storage.objects;

CREATE POLICY "Admin users can manage font files"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'fonts' 
  AND EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'fonts'
  AND EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Public users can download font files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'fonts');