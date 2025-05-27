/*
  # Update fonts table schema
  
  1. Changes
    - Add new columns for detailed font information
    - Add columns for multiple weights and styles
    - Add columns for font metrics and features
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns to fonts table
ALTER TABLE fonts ADD COLUMN IF NOT EXISTS styles text[];
ALTER TABLE fonts ADD COLUMN IF NOT EXISTS foundry text;
ALTER TABLE fonts ADD COLUMN IF NOT EXISTS license_type text;
ALTER TABLE fonts ADD COLUMN IF NOT EXISTS language_support text[];
ALTER TABLE fonts ADD COLUMN IF NOT EXISTS opentype_features text[];
ALTER TABLE fonts ADD COLUMN IF NOT EXISTS character_set text[];
ALTER TABLE fonts ADD COLUMN IF NOT EXISTS font_metrics jsonb;
ALTER TABLE fonts ADD COLUMN IF NOT EXISTS sample_text text;
ALTER TABLE fonts ADD COLUMN IF NOT EXISTS tags text[];
ALTER TABLE fonts ADD COLUMN IF NOT EXISTS similar_fonts text[];
ALTER TABLE fonts ADD COLUMN IF NOT EXISTS weight_files jsonb;
ALTER TABLE fonts ADD COLUMN IF NOT EXISTS year_published integer;
ALTER TABLE fonts ADD COLUMN IF NOT EXISTS version text;
ALTER TABLE fonts ADD COLUMN IF NOT EXISTS copyright text;
ALTER TABLE fonts ADD COLUMN IF NOT EXISTS license_url text;

-- Add comments for clarity
COMMENT ON COLUMN fonts.styles IS 'Available font styles (e.g., ["Normal", "Italic"])';
COMMENT ON COLUMN fonts.foundry IS 'Font foundry or type designer studio';
COMMENT ON COLUMN fonts.license_type IS 'Type of license (e.g., "Free for personal use", "Commercial")';
COMMENT ON COLUMN fonts.language_support IS 'Supported languages and scripts';
COMMENT ON COLUMN fonts.opentype_features IS 'Available OpenType features';
COMMENT ON COLUMN fonts.character_set IS 'Supported character sets';
COMMENT ON COLUMN fonts.font_metrics IS 'Font metrics data (ascender, descender, etc.)';
COMMENT ON COLUMN fonts.sample_text IS 'Default sample text for preview';
COMMENT ON COLUMN fonts.tags IS 'Searchable tags for categorization';
COMMENT ON COLUMN fonts.similar_fonts IS 'Array of similar font IDs';
COMMENT ON COLUMN fonts.weight_files IS 'Mapping of weights to file paths';
COMMENT ON COLUMN fonts.year_published IS 'Year the font was published';
COMMENT ON COLUMN fonts.version IS 'Font version number';
COMMENT ON COLUMN fonts.copyright IS 'Copyright information';
COMMENT ON COLUMN fonts.license_url IS 'URL to the full license text';