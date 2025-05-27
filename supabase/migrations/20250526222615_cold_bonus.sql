/*
  # Fix font weight validation
  
  1. Changes
    - Create font_weight enum type
    - Add trigger function to validate weight values
    - Add trigger to enforce weight validation
    
  2. Security
    - Maintain existing RLS policies
*/

-- Create font weight enum type
DO $$ BEGIN
  CREATE TYPE font_weight AS ENUM (
    'Thin',
    'ExtraLight',
    'Light',
    'Regular',
    'Medium',
    'SemiBold',
    'Bold',
    'ExtraBold',
    'Black'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create function to validate weight values
CREATE OR REPLACE FUNCTION validate_font_weights()
RETURNS trigger AS $$
DECLARE
  weight_value text;
  weight_key text;
  weight_object jsonb;
BEGIN
  IF NEW.weight_files IS NULL THEN
    RETURN NEW;
  END IF;
  
  FOR weight_key, weight_object IN SELECT * FROM jsonb_each(NEW.weight_files)
  LOOP
    weight_value := weight_object->>'weight';
    IF weight_value IS NOT NULL AND weight_value::font_weight IS NULL THEN
      RAISE EXCEPTION 'Invalid font weight: %', weight_value;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce weight validation
DROP TRIGGER IF EXISTS validate_font_weights_trigger ON fonts;
CREATE TRIGGER validate_font_weights_trigger
  BEFORE INSERT OR UPDATE ON fonts
  FOR EACH ROW
  EXECUTE FUNCTION validate_font_weights();

-- Add comment explaining the validation
COMMENT ON FUNCTION validate_font_weights() IS 
  'Validates that weight values in weight_files match valid font weights';