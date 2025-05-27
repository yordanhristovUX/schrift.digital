/*
  # Add isPaid column to fonts table

  1. Changes
    - Add `is_paid` column to `fonts` table
      - Type: boolean
      - Default: false
      - Not nullable
    
  2. Notes
    - Using DO block to safely add column if it doesn't exist
    - Setting default value to false for consistency with existing form data
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fonts' AND column_name = 'is_paid'
  ) THEN
    ALTER TABLE fonts ADD COLUMN is_paid boolean NOT NULL DEFAULT false;
  END IF;
END $$;