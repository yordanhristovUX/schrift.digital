-- Add initial fonts
INSERT INTO fonts (
  name,
  designer,
  category,
  description,
  is_paid,
  featured,
  foundry,
  license_type,
  language_support,
  opentype_features,
  character_set,
  sample_text,
  tags,
  weight_files
) VALUES (
  'Sofia Sans',
  'Lettersoup & Ani Petrova',
  'Sans Serif',
  'A versatile sans-serif font family with authentic Bulgarian character designs, optimized for both display and text use. Sofia Sans offers exceptional readability on screen.',
  false,
  true,
  'Lettersoup',
  'Free',
  ARRAY['Bulgarian', 'Russian', 'Serbian'],
  ARRAY['liga', 'kern', 'smcp'],
  ARRAY['Latin', 'Cyrillic'],
  'Всички хора се раждат свободни и равни по достойнство и права.',
  ARRAY['modern', 'geometric', 'minimalist'],
  '{
    "Regular": {
      "weight": "Regular",
      "style": "Normal",
      "path": "https://fonts.gstatic.com/s/sofiasans/v16/Yq6E-LCVXSLy9uPBwlATrOX1hQ.woff2"
    },
    "Regular-Italic": {
      "weight": "Regular",
      "style": "Italic",
      "path": "https://fonts.gstatic.com/s/sofiasans/v16/Yq6G-LCVXSLy9uPBwlATrOUpqg.woff2"
    }
  }'::jsonb
),
(
  'Plovdiv',
  'Stefan Peev',
  'Serif',
  'An elegant serif typeface with classical proportions and distinctive Bulgarian Cyrillic forms. Plovdiv combines traditional calligraphic influences with modern functionality.',
  true,
  true,
  'TypeFoundry BG',
  'Commercial',
  ARRAY['Bulgarian', 'Russian', 'Serbian'],
  ARRAY['liga', 'kern', 'dlig'],
  ARRAY['Latin', 'Cyrillic'],
  'Щурецът свири, а жабите скачат върху дъбови листа.',
  ARRAY['serif', 'elegant', 'traditional'],
  '{
    "Regular": {
      "weight": "Regular",
      "style": "Normal",
      "path": "https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtM.woff2"
    }
  }'::jsonb
);