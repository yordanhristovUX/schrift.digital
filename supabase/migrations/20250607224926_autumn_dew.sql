/*
  # Add Font Comparison Feature

  This migration adds the ability for users to compare fonts side by side.
  
  ## What this migration does:
  - Creates tables to store font comparisons
  - Adds user comparison sessions
  - Enables sharing of comparisons
  
  ## New Tables:
  1. `font_comparisons` - Store comparison sessions
  2. `comparison_fonts` - Fonts in each comparison
  
  ## Security:
  - Enable RLS on all tables
  - Users can manage their own comparisons
  - Public comparisons can be shared
*/

-- Generated at: 2025-01-27 10:45:00 UTC

-- Create font_comparisons table
CREATE TABLE IF NOT EXISTS font_comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Untitled Comparison',
  description text,
  is_public boolean DEFAULT false,
  share_token text UNIQUE,
  preview_text text DEFAULT 'Всички хора се раждат свободни и равни по достойнство и права.',
  font_size integer DEFAULT 32,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create comparison_fonts junction table
CREATE TABLE IF NOT EXISTS comparison_fonts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comparison_id uuid NOT NULL REFERENCES font_comparisons(id) ON DELETE CASCADE,
  font_id uuid NOT NULL REFERENCES fonts(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  font_weight text DEFAULT 'Regular',
  font_style text DEFAULT 'Normal',
  custom_text text,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(comparison_id, font_id)
);

-- Enable RLS
ALTER TABLE font_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparison_fonts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for font_comparisons
CREATE POLICY "Users can manage their own comparisons"
  ON font_comparisons
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Public comparisons can be viewed by anyone"
  ON font_comparisons
  FOR SELECT
  TO public
  USING (is_public = true);

CREATE POLICY "Shared comparisons can be viewed via token"
  ON font_comparisons
  FOR SELECT
  TO public
  USING (share_token IS NOT NULL);

-- RLS Policies for comparison_fonts
CREATE POLICY "Users can manage fonts in their comparisons"
  ON comparison_fonts
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM font_comparisons fc 
    WHERE fc.id = comparison_id AND fc.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM font_comparisons fc 
    WHERE fc.id = comparison_id AND fc.user_id = auth.uid()
  ));

CREATE POLICY "Public comparison fonts can be viewed"
  ON comparison_fonts
  FOR SELECT
  TO public
  USING (EXISTS (
    SELECT 1 FROM font_comparisons fc 
    WHERE fc.id = comparison_id AND (fc.is_public = true OR fc.share_token IS NOT NULL)
  ));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_font_comparisons_user_id ON font_comparisons(user_id);
CREATE INDEX IF NOT EXISTS idx_font_comparisons_is_public ON font_comparisons(is_public);
CREATE INDEX IF NOT EXISTS idx_font_comparisons_share_token ON font_comparisons(share_token);
CREATE INDEX IF NOT EXISTS idx_font_comparisons_created_at ON font_comparisons(created_at);

CREATE INDEX IF NOT EXISTS idx_comparison_fonts_comparison_id ON comparison_fonts(comparison_id);
CREATE INDEX IF NOT EXISTS idx_comparison_fonts_font_id ON comparison_fonts(font_id);
CREATE INDEX IF NOT EXISTS idx_comparison_fonts_position ON comparison_fonts(comparison_id, position);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_font_comparisons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_font_comparisons_updated_at
  BEFORE UPDATE ON font_comparisons
  FOR EACH ROW
  EXECUTE FUNCTION update_font_comparisons_updated_at();

-- Function to generate share tokens
CREATE OR REPLACE FUNCTION generate_comparison_share_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_public = true AND NEW.share_token IS NULL THEN
    NEW.share_token = encode(gen_random_bytes(16), 'base64url');
  ELSIF NEW.is_public = false THEN
    NEW.share_token = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_comparison_share_token_trigger
  BEFORE INSERT OR UPDATE ON font_comparisons
  FOR EACH ROW
  EXECUTE FUNCTION generate_comparison_share_token();

-- Function to get comparison with fonts
CREATE OR REPLACE FUNCTION get_comparison_with_fonts(comparison_uuid uuid)
RETURNS TABLE (
  comparison_id uuid,
  comparison_name text,
  comparison_description text,
  is_public boolean,
  share_token text,
  preview_text text,
  font_size integer,
  user_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  fonts jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fc.id as comparison_id,
    fc.name as comparison_name,
    fc.description as comparison_description,
    fc.is_public,
    fc.share_token,
    fc.preview_text,
    fc.font_size,
    fc.user_id,
    fc.created_at,
    fc.updated_at,
    COALESCE(
      json_agg(
        json_build_object(
          'font_id', f.id,
          'font_name', f.name,
          'font_designer', f.designer,
          'font_category', f.category,
          'weight_files', f.weight_files,
          'position', cf.position,
          'font_weight', cf.font_weight,
          'font_style', cf.font_style,
          'custom_text', cf.custom_text,
          'notes', cf.notes
        ) ORDER BY cf.position
      ) FILTER (WHERE f.id IS NOT NULL),
      '[]'::json
    )::jsonb as fonts
  FROM font_comparisons fc
  LEFT JOIN comparison_fonts cf ON fc.id = cf.comparison_id
  LEFT JOIN fonts f ON cf.font_id = f.id
  WHERE fc.id = comparison_uuid
  GROUP BY fc.id, fc.name, fc.description, fc.is_public, fc.share_token, 
           fc.preview_text, fc.font_size, fc.user_id, fc.created_at, fc.updated_at;
END;
$$ LANGUAGE plpgsql;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION get_comparison_with_fonts TO public;

-- Create view for popular comparisons
CREATE OR REPLACE VIEW popular_comparisons AS
SELECT 
  fc.id,
  fc.name,
  fc.description,
  fc.preview_text,
  fc.font_size,
  fc.created_at,
  u.full_name as creator_name,
  COUNT(cf.font_id) as font_count
FROM font_comparisons fc
LEFT JOIN users u ON fc.user_id = u.id
LEFT JOIN comparison_fonts cf ON fc.id = cf.comparison_id
WHERE fc.is_public = true
GROUP BY fc.id, fc.name, fc.description, fc.preview_text, fc.font_size, fc.created_at, u.full_name
ORDER BY fc.created_at DESC;

-- Grant access to the view
GRANT SELECT ON popular_comparisons TO public;