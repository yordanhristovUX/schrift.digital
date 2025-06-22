/*
  # Remove Unwanted Features

  This migration removes all analytics, favorites, collections, and comparison functionality
  from the database and cleans up all related tables, views, functions, and triggers.
  
  ## What this migration removes:
  1. Analytics tables and views
  2. Font favorites functionality
  3. Font collections and collection_fonts
  4. Font comparison functionality
  5. All related functions, triggers, and views
  
  ## Tables being dropped:
  - user_font_favorites
  - search_analytics
  - font_analytics
  - font_preview_sessions
  - font_comparisons
  - comparison_fonts
  - collection_fonts
  - font_collections
  
  ## Views being dropped:
  - search_analytics_summary
  - popular_fonts
  - popular_comparisons
*/

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS search_analytics_summary;
DROP VIEW IF EXISTS popular_fonts;
DROP VIEW IF EXISTS popular_comparisons;

-- Drop functions that depend on these tables
DROP FUNCTION IF EXISTS search_fonts(text, text[], text[], boolean, text[], integer, integer);
DROP FUNCTION IF EXISTS get_search_suggestions(text, integer);
DROP FUNCTION IF EXISTS get_font_name_suggestions(text, integer);
DROP FUNCTION IF EXISTS get_designer_suggestions(text, integer);
DROP FUNCTION IF EXISTS get_tag_suggestions(text, integer);
DROP FUNCTION IF EXISTS get_comparison_with_fonts(uuid);

-- Drop triggers and their functions
DROP TRIGGER IF EXISTS update_fonts_search_vector_trigger ON fonts;
DROP TRIGGER IF EXISTS update_font_comparisons_updated_at ON font_comparisons;
DROP TRIGGER IF EXISTS generate_comparison_share_token_trigger ON font_comparisons;
DROP TRIGGER IF EXISTS update_font_collections_updated_at ON font_collections;

DROP FUNCTION IF EXISTS update_fonts_search_vector();
DROP FUNCTION IF EXISTS update_font_comparisons_updated_at();
DROP FUNCTION IF EXISTS generate_comparison_share_token();
DROP FUNCTION IF EXISTS update_font_collections_updated_at();

-- Drop tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS comparison_fonts;
DROP TABLE IF EXISTS font_comparisons;
DROP TABLE IF EXISTS collection_fonts;
DROP TABLE IF EXISTS font_collections;
DROP TABLE IF EXISTS user_font_favorites;
DROP TABLE IF EXISTS font_preview_sessions;
DROP TABLE IF EXISTS font_analytics;
DROP TABLE IF EXISTS search_analytics;

-- Remove search_vector column from fonts table
ALTER TABLE fonts DROP COLUMN IF EXISTS search_vector;

-- Remove any indexes related to the dropped functionality
DROP INDEX IF EXISTS idx_fonts_search_vector;

-- Clean up any remaining functions
DROP FUNCTION IF EXISTS normalize_font_weights_and_styles();
DROP FUNCTION IF EXISTS validate_font_weights();

-- Remove triggers that might reference dropped functions
DROP TRIGGER IF EXISTS normalize_font_weights_and_styles_trigger ON fonts;
DROP TRIGGER IF EXISTS validate_font_weights_trigger ON fonts;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Successfully removed all analytics, favorites, collections, and comparison features';
END $$;