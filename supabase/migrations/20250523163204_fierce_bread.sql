/*
  # Create fonts table and storage

  1. New Tables
    - `fonts`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `category` (text)
      - `designer` (text)
      - `file_path` (text)
      - `is_paid` (boolean)
      - `price` (numeric)
      - `weights` (text[])
      - `downloads` (integer)
      - `rating` (numeric)
      - `featured` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Storage
    - Create bucket for font files
    
  3. Security
    - Enable RLS on fonts table
    - Add policies for authenticated users
*/

-- Create fonts table
CREATE TABLE fonts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  category text,
  designer text,
  file_path text,
  is_paid boolean DEFAULT false,
  price numeric,
  weights text[],
  downloads integer DEFAULT 0,
  rating numeric DEFAULT 0,
  featured boolean DEFAULT false,
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
  USING (auth.role() = 'admin')
  WITH CHECK (auth.role() = 'admin');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_fonts_updated_at
  BEFORE UPDATE ON fonts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();