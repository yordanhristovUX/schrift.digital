-- Create font_weight type
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

-- Create fonts table
CREATE TABLE fonts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  category text,
  designer text,
  foundry text,
  is_paid boolean DEFAULT false,
  price numeric,
  weights text[],
  styles text[],
  downloads integer DEFAULT 0,
  rating numeric DEFAULT 0,
  featured boolean DEFAULT false,
  license_type text,
  language_support text[],
  opentype_features text[],
  character_set text[],
  font_metrics jsonb,
  sample_text text,
  tags text[],
  similar_fonts text[],
  weight_files jsonb,
  year_published integer,
  version text,
  copyright text,
  license_url text,
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
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'::user_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'::user_role
  )
);

-- Create weight validation function
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

-- Create trigger for weight validation
CREATE TRIGGER validate_font_weights_trigger
  BEFORE INSERT OR UPDATE ON fonts
  FOR EACH ROW
  EXECUTE FUNCTION validate_font_weights();

-- Create weights/styles normalization function
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
  
  FOR weight_key, weight_object IN SELECT * FROM jsonb_each(NEW.weight_files)
  LOOP
    weight_value := weight_object->>'weight';
    style_value := weight_object->>'style';
    
    IF weight_value IS NOT NULL AND NOT weights @> ARRAY[weight_value] THEN
      weights := array_append(weights, weight_value);
    END IF;
    
    IF style_value IS NOT NULL 
       AND NOT styles @> ARRAY[style_value]
       AND style_value IN ('Normal', 'Italic') THEN
      styles := array_append(styles, style_value);
    END IF;
  END LOOP;
  
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
  
  SELECT array_agg(s ORDER BY s != 'Normal')
  FROM unnest(styles) s
  INTO NEW.styles;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for weights/styles normalization
CREATE TRIGGER normalize_font_weights_and_styles_trigger
  BEFORE INSERT OR UPDATE ON fonts
  FOR EACH ROW
  EXECUTE FUNCTION normalize_font_weights_and_styles();