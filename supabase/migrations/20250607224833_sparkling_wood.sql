/*
  # Add Font Collections Feature

  This migration adds support for font collections to group related fonts together.
  
  ## What this migration does:
  - Creates a `font_collections` table for organizing fonts into collections
  - Creates a junction table `collection_fonts` for many-to-many relationships
  - Adds RLS policies for proper access control
  - Enables better organization and discovery of fonts
  
  ## New Tables:
  1. `font_collections` - Collection metadata
  2. `collection_fonts` - Many-to-many relationship between collections and fonts
  
  ## Security:
  - Enable RLS on both tables
  - Admin users can manage collections
  - Public users can view collections
*/

-- Generated at: 2025-01-27 10:30:00 UTC

-- Create font_collections table
CREATE TABLE IF NOT EXISTS font_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  slug text UNIQUE NOT NULL,
  cover_image_url text,
  is_featured boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create collection_fonts junction table
CREATE TABLE IF NOT EXISTS collection_fonts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES font_collections(id) ON DELETE CASCADE,
  font_id uuid NOT NULL REFERENCES fonts(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(collection_id, font_id)
);

-- Enable RLS
ALTER TABLE font_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_fonts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for font_collections
CREATE POLICY "Public users can view collections"
  ON font_collections
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admin users can manage collections"
  ON font_collections
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'::user_role
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'::user_role
  ));

-- RLS Policies for collection_fonts
CREATE POLICY "Public users can view collection fonts"
  ON collection_fonts
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admin users can manage collection fonts"
  ON collection_fonts
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'::user_role
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'::user_role
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_font_collections_featured ON font_collections(is_featured);
CREATE INDEX IF NOT EXISTS idx_font_collections_sort_order ON font_collections(sort_order);
CREATE INDEX IF NOT EXISTS idx_collection_fonts_collection_id ON collection_fonts(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_fonts_font_id ON collection_fonts(font_id);
CREATE INDEX IF NOT EXISTS idx_collection_fonts_sort_order ON collection_fonts(collection_id, sort_order);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_font_collections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_font_collections_updated_at
  BEFORE UPDATE ON font_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_font_collections_updated_at();

-- Insert some default collections
INSERT INTO font_collections (name, description, slug, is_featured, sort_order) VALUES
('Featured Fonts', 'Our handpicked selection of the best Bulgarian Cyrillic fonts', 'featured', true, 1),
('Sans Serif', 'Clean and modern sans serif fonts with Bulgarian Cyrillic support', 'sans-serif', true, 2),
('Serif', 'Traditional and elegant serif fonts for Bulgarian text', 'serif', true, 3),
('Display', 'Bold and expressive fonts perfect for headlines and branding', 'display', false, 4),
('Free Fonts', 'High-quality free fonts with Bulgarian Cyrillic', 'free', true, 5);