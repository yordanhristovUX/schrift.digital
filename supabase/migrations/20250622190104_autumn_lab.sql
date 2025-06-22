/*
  # Remove Analytics, Favorites, Collections, and Comparison Features

  This migration removes all unwanted functionality including:
  - Analytics tracking tables
  - User favorites
  - Font collections
  - Font comparisons
  - Search functionality
  - Related functions, triggers, and views

  ## Tables being removed:
  - user_font_favorites
  - search_analytics
  - font_analytics
  - font_preview_sessions
  - font_comparisons
  - comparison_fonts
  - collection_fonts
  - font_collections

  ## Other objects being removed:
  - Related views, functions, triggers, and indexes
  - Search vector column from fonts table
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

-- Drop triggers first, then their functions (to avoid dependency issues)
DROP TRIGGER IF EXISTS update_fonts_search_vector_trigger ON fonts;
DROP TRIGGER IF EXISTS update_font_comparisons_updated_at ON font_comparisons;
DROP TRIGGER IF EXISTS generate_comparison_share_token_trigger ON font_comparisons;
DROP TRIGGER IF EXISTS update_font_collections_updated_at ON font_collections;
DROP TRIGGER IF EXISTS normalize_font_weights_and_styles_trigger ON fonts;
DROP TRIGGER IF EXISTS validate_font_weights_trigger ON fonts;

-- Now drop the functions (after triggers are removed)
DROP FUNCTION IF EXISTS update_fonts_search_vector();
DROP FUNCTION IF EXISTS update_font_comparisons_updated_at();
DROP FUNCTION IF EXISTS generate_comparison_share_token();
DROP FUNCTION IF EXISTS update_font_collections_updated_at();
DROP FUNCTION IF EXISTS normalize_font_weights_and_styles();
DROP FUNCTION IF EXISTS validate_font_weights();

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
DROP INDEX IF EXISTS idx_font_collections_featured;
DROP INDEX IF EXISTS idx_font_collections_sort_order;
DROP INDEX IF EXISTS idx_collection_fonts_collection_id;
DROP INDEX IF EXISTS idx_collection_fonts_font_id;
DROP INDEX IF EXISTS idx_collection_fonts_sort_order;
DROP INDEX IF EXISTS idx_font_analytics_font_id;
DROP INDEX IF EXISTS idx_font_analytics_user_id;
DROP INDEX IF EXISTS idx_font_analytics_event_type;
DROP INDEX IF EXISTS idx_font_analytics_created_at;
DROP INDEX IF EXISTS idx_font_analytics_session_id;
DROP INDEX IF EXISTS idx_user_font_favorites_user_id;
DROP INDEX IF EXISTS idx_user_font_favorites_font_id;
DROP INDEX IF EXISTS idx_font_preview_sessions_font_id;
DROP INDEX IF EXISTS idx_font_preview_sessions_session_id;
DROP INDEX IF EXISTS idx_font_preview_sessions_created_at;
DROP INDEX IF EXISTS idx_font_comparisons_user_id;
DROP INDEX IF EXISTS idx_font_comparisons_is_public;
DROP INDEX IF EXISTS idx_font_comparisons_share_token;
DROP INDEX IF EXISTS idx_font_comparisons_created_at;
DROP INDEX IF EXISTS idx_comparison_fonts_comparison_id;
DROP INDEX IF EXISTS idx_comparison_fonts_font_id;
DROP INDEX IF EXISTS idx_comparison_fonts_position;
DROP INDEX IF EXISTS idx_search_analytics_query;
DROP INDEX IF EXISTS idx_search_analytics_created_at;
DROP INDEX IF EXISTS idx_search_analytics_user_id;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Successfully removed all analytics, favorites, collections, and comparison features';
END $$;