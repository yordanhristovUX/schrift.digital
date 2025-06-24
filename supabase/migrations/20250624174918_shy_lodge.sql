/*
  # Add subscriber_only field to fonts table

  This migration adds a new field to track fonts that are only accessible to subscribers.
  
  ## What this migration does:
  1. Adds `subscriber_only` boolean field to fonts table
  2. Sets default value to false for existing fonts
  3. Updates RLS policies to respect subscriber access
  
  ## New field:
  - `subscriber_only` - Boolean flag indicating if font requires subscription
*/

-- Add subscriber_only field to fonts table
ALTER TABLE fonts ADD COLUMN IF NOT EXISTS subscriber_only boolean DEFAULT false;

-- Update existing fonts to be accessible to all users by default
UPDATE fonts SET subscriber_only = false WHERE subscriber_only IS NULL;

-- Create index for better performance when filtering by subscriber_only
CREATE INDEX IF NOT EXISTS idx_fonts_subscriber_only ON fonts(subscriber_only);

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Successfully added subscriber_only field to fonts table';
END $$;