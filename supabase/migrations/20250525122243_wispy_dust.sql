/*
  # Fix fonts table schema

  1. Changes
    - Add missing columns for font metadata
    - Ensure all form fields have corresponding database columns
    - Use consistent naming convention (snake_case for database)
    
  2. Security
    - Maintain existing RLS policies
*/

DO $$ 
BEGIN
  -- Add missing columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fonts' AND column_name = 'language_support'
  ) THEN
    ALTER TABLE fonts ADD COLUMN language_support text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fonts' AND column_name = 'opentype_features'
  ) THEN
    ALTER TABLE fonts ADD COLUMN opentype_features text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fonts' AND column_name = 'character_set'
  ) THEN
    ALTER TABLE fonts ADD COLUMN character_set text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fonts' AND column_name = 'license_type'
  ) THEN
    ALTER TABLE fonts ADD COLUMN license_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fonts' AND column_name = 'sample_text'
  ) THEN
    ALTER TABLE fonts ADD COLUMN sample_text text;
  END IF;

  -- Add comments for clarity
  COMMENT ON COLUMN fonts.language_support IS 'Supported languages and scripts';
  COMMENT ON COLUMN fonts.opentype_features IS 'Available OpenType features';
  COMMENT ON COLUMN fonts.character_set IS 'Supported character sets';
  COMMENT ON COLUMN fonts.license_type IS 'Type of license (e.g., Free, Commercial)';
  COMMENT ON COLUMN fonts.sample_text IS 'Default sample text for preview';
END $$;