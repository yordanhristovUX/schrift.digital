/*
  # Create storage bucket for fonts
  
  1. Changes
    - Create a storage bucket for fonts
    - Make the bucket publicly accessible
    - Add policies for admin management and public downloads
  
  2. Security
    - Enable admin users to manage font files
    - Allow public access for downloading fonts
*/

-- Create the fonts bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('fonts', 'fonts', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated admin users to manage files
CREATE POLICY "Admin users can manage font files"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'fonts' AND (auth.jwt() ->> 'role')::text = 'admin')
WITH CHECK (bucket_id = 'fonts' AND (auth.jwt() ->> 'role')::text = 'admin');

-- Create policy to allow public users to download font files
CREATE POLICY "Public users can download font files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'fonts');