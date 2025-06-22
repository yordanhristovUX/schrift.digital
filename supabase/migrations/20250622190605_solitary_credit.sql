/*
  # Add Sample Fonts to Database

  This migration adds sample fonts to the database to replace the removed static data.
  
  ## What this migration does:
  1. Inserts sample Bulgarian Cyrillic fonts
  2. Sets up proper weight files and metadata
  3. Ensures at least one featured font is available
  
  ## Sample Fonts:
  - Sofia Sans (featured, free)
  - Plovdiv (serif, paid)
  - Varna Grotesk (sans serif, paid)
*/

-- Insert sample fonts
INSERT INTO fonts (
  id,
  name,
  designer,
  foundry,
  category,
  description,
  is_paid,
  price,
  license_type,
  rating,
  downloads,
  featured,
  language_support,
  opentype_features,
  character_set,
  sample_text,
  weight_files,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  'Sofia Sans',
  'Lettersoup & Ani Petrova',
  'Type Studio Sofia',
  'Sans Serif',
  'A versatile sans-serif font family with authentic Bulgarian character designs, optimized for both display and text use. Sofia Sans offers exceptional readability on screen.',
  false,
  null,
  'Free',
  4.8,
  12450,
  true,
  ARRAY['Bulgarian', 'Russian', 'Serbian'],
  ARRAY['liga', 'kern', 'smcp'],
  ARRAY['Latin', 'Cyrillic'],
  'Всички хора се раждат свободни и равни по достойнство и права.',
  '{
    "Regular-Normal": {
      "weight": "Regular",
      "style": "Normal",
      "path": "https://fonts.gstatic.com/s/notosans/v36/o-0IIpQlx3QUlC5A4PNr5TRASf6M7Q.woff2"
    },
    "Bold-Normal": {
      "weight": "Bold", 
      "style": "Normal",
      "path": "https://fonts.gstatic.com/s/notosans/v36/o-0NIpQlx3QUlC5A4PNjXhFVZNyB.woff2"
    },
    "Light-Normal": {
      "weight": "Light",
      "style": "Normal", 
      "path": "https://fonts.gstatic.com/s/notosans/v36/o-0OIpQlx3QUlC5A4PNr4DRAW_0.woff2"
    }
  }'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  'Plovdiv',
  'Stefan Peev',
  'Bulgarian Type Foundry',
  'Serif',
  'An elegant serif typeface with classical proportions and distinctive Bulgarian Cyrillic forms. Plovdiv combines traditional calligraphic influences with modern functionality.',
  true,
  49,
  'Commercial',
  4.7,
  8320,
  true,
  ARRAY['Bulgarian', 'Russian'],
  ARRAY['liga', 'kern', 'onum'],
  ARRAY['Latin', 'Cyrillic'],
  'Щурецът свири, а жабите скачат върху дъбови листа.',
  '{
    "Regular-Normal": {
      "weight": "Regular",
      "style": "Normal",
      "path": "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDYbtXK-F2qO0isEw.woff2"
    },
    "Bold-Normal": {
      "weight": "Bold",
      "style": "Normal", 
      "path": "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKeFvXDYbtXK-F2qO0isEw.woff2"
    }
  }'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  'Varna Grotesk',
  'Type Studio Sofia',
  'Bulgarian Design Collective',
  'Sans Serif',
  'A modern geometric sans-serif with a technical feel and authentic Bulgarian character shapes. Perfect for UI design, branding, and editorial projects.',
  true,
  69,
  'Commercial',
  4.9,
  9760,
  false,
  ARRAY['Bulgarian', 'Russian', 'Serbian'],
  ARRAY['liga', 'kern', 'tnum'],
  ARRAY['Latin', 'Cyrillic'],
  'Българската кирилица е красива и функционална.',
  '{
    "Regular-Normal": {
      "weight": "Regular",
      "style": "Normal",
      "path": "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2"
    },
    "Bold-Normal": {
      "weight": "Bold",
      "style": "Normal",
      "path": "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2"
    },
    "Light-Normal": {
      "weight": "Light", 
      "style": "Normal",
      "path": "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuOKYAZ9hiJ-Ek-_EeA.woff2"
    }
  }'::jsonb,
  now(),
  now()
);

-- Update the weights array based on weight_files
UPDATE fonts SET weights = (
  SELECT array_agg(DISTINCT (value->>'weight')::text)
  FROM jsonb_each(weight_files)
) WHERE weight_files IS NOT NULL;

-- Update the styles array based on weight_files  
UPDATE fonts SET styles = (
  SELECT array_agg(DISTINCT (value->>'style')::text)
  FROM jsonb_each(weight_files)
) WHERE weight_files IS NOT NULL;

-- Log completion
DO $$
DECLARE
  font_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO font_count FROM fonts;
  RAISE NOTICE 'Successfully added sample fonts. Total fonts in database: %', font_count;
END $$;