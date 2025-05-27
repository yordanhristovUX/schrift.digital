/*
  # Fix font weights and styles schema

  1. Changes
    - Add function to validate weight_files structure
    - Ensure weights array only contains unique weights
    - Ensure styles array only contains valid styles
    - Add trigger to maintain consistency
    
  2. Security
    - Maintain existing RLS policies
*/

-- Create function to normalize weight_files and update weights/styles arrays
CREATE OR REPLACE FUNCTION normalize_font_weights_and_styles()
RETURNS trigger AS $$
DECLARE
  weight_value text;
  style_value text;
  weight_key text;
  weight_object jsonb;
  weights text[] := '{}';
  styles text[] := '{}';
BEGIN
  IF NEW.weight_files IS NULL THEN
    NEW.weights := NULL;
    NEW.styles := NULL;
    RETURN NEW;
  END IF;
  
  -- Extract unique weights and styles from weight_files
  FOR weight_key, weight_object IN SELECT * FROM jsonb_each(NEW.weight_files)
  LOOP
    weight_value := weight_object->>'weight';
    style_value := weight_object->>'style';
    
    -- Add weight if not already in array
    IF weight_value IS NOT NULL AND NOT weights @> ARRAY[weight_value] THEN
      weights := array_append(weights, weight_value);
    END IF;
    
    -- Add style if not already in array and is valid
    IF style_value IS NOT NULL 
       AND NOT styles @> ARRAY[style_value]
       AND style_value IN ('Normal', 'Italic') THEN
      styles := array_append(styles, style_value);
    END IF;
  END LOOP;
  
  -- Sort weights in correct order
  SELECT array_agg(w ORDER BY 
    CASE w
      WHEN 'Thin' THEN 1
      WHEN 'ExtraLight' THEN 2
      WHEN 'Light' THEN 3
      WHEN 'Regular' THEN 4
      WHEN 'Medium' THEN 5
      WHEN 'SemiBold' THEN 6
      WHEN 'Bold' THEN 7
      WHEN 'ExtraBold' THEN 8
      WHEN 'Black' THEN 9
    END)
  FROM unnest(weights) w
  INTO NEW.weights;
  
  -- Sort styles (Normal first, then Italic)
  SELECT array_agg(s ORDER BY s != 'Normal')
  FROM unnest(styles) s
  INTO NEW.styles;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain weights and styles arrays
DROP TRIGGER IF EXISTS normalize_font_weights_and_styles_trigger ON fonts;
CREATE TRIGGER normalize_font_weights_and_styles_trigger
  BEFORE INSERT OR UPDATE ON fonts
  FOR EACH ROW
  EXECUTE FUNCTION normalize_font_weights_and_styles();

-- Add comment explaining the normalization
COMMENT ON FUNCTION normalize_font_weights_and_styles() IS 
  'Maintains consistent weights and styles arrays based on weight_files content';