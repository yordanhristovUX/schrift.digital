/*
  # Advanced Font Search and Analytics

  This migration adds comprehensive search functionality to the fonts system.
  
  ## What this migration does:
  - Adds full-text search capabilities with tsvector
  - Creates search analytics tracking
  - Implements advanced search function with filters
  - Adds search suggestions functionality
  - Creates search analytics dashboard view
  
  ## Features added:
  - Full-text search across font names, designers, descriptions, tags
  - Search analytics for tracking user queries
  - Advanced filtering by category, weight, price, language
  - Search suggestions for autocomplete
  - Performance optimized with GIN indexes
*/

-- Generated at: 2025-01-27 10:40:00 UTC

-- Add full-text search columns
ALTER TABLE fonts ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_fonts_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.designer, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'D') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.language_support, ' '), '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for search vector updates
DROP TRIGGER IF EXISTS update_fonts_search_vector_trigger ON fonts;
CREATE TRIGGER update_fonts_search_vector_trigger
  BEFORE INSERT OR UPDATE ON fonts
  FOR EACH ROW
  EXECUTE FUNCTION update_fonts_search_vector();

-- Update existing records
UPDATE fonts SET search_vector = 
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(designer, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(tags, ' '), '')), 'D') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(language_support, ' '), '')), 'D');

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_fonts_search_vector ON fonts USING GIN(search_vector);

-- Create search analytics table
CREATE TABLE IF NOT EXISTS search_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  results_count integer DEFAULT 0,
  filters_applied jsonb DEFAULT '{}',
  session_id text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on search analytics
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for search analytics
CREATE POLICY "Anyone can insert search analytics"
  ON search_analytics
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admin users can view search analytics"
  ON search_analytics
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'::user_role
  ));

-- Create indexes for search analytics
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_created_at ON search_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_search_analytics_user_id ON search_analytics(user_id);

-- Create function for advanced font search
CREATE OR REPLACE FUNCTION search_fonts(
  search_query text DEFAULT '',
  font_categories text[] DEFAULT NULL,
  font_weights text[] DEFAULT NULL,
  is_free boolean DEFAULT NULL,
  language_filter text[] DEFAULT NULL,
  limit_count integer DEFAULT 20,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  name text,
  designer text,
  category text,
  description text,
  is_paid boolean,
  price numeric,
  rating numeric,
  downloads integer,
  featured boolean,
  language_support text[],
  tags text[],
  weight_files jsonb,
  search_rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.name,
    f.designer,
    f.category,
    f.description,
    f.is_paid,
    f.price,
    f.rating,
    f.downloads,
    f.featured,
    f.language_support,
    f.tags,
    f.weight_files,
    CASE 
      WHEN search_query = '' THEN 1.0
      ELSE ts_rank(f.search_vector, plainto_tsquery('english', search_query))
    END as search_rank
  FROM fonts f
  WHERE 
    (search_query = '' OR f.search_vector @@ plainto_tsquery('english', search_query))
    AND (font_categories IS NULL OR f.category = ANY(font_categories))
    AND (font_weights IS NULL OR f.weights && font_weights)
    AND (is_free IS NULL OR f.is_paid = NOT is_free)
    AND (language_filter IS NULL OR f.language_support && language_filter)
  ORDER BY 
    f.featured DESC,
    search_rank DESC,
    f.downloads DESC,
    f.rating DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Create separate functions for different types of search suggestions
CREATE OR REPLACE FUNCTION get_font_name_suggestions(
  partial_query text,
  suggestion_limit integer DEFAULT 5
)
RETURNS TABLE (
  suggestion text,
  type text,
  count integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.name as suggestion,
    'font'::text as type,
    1 as count
  FROM fonts f
  WHERE f.name ILIKE partial_query || '%'
  ORDER BY f.name
  LIMIT suggestion_limit;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_designer_suggestions(
  partial_query text,
  suggestion_limit integer DEFAULT 5
)
RETURNS TABLE (
  suggestion text,
  type text,
  count integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    f.designer as suggestion,
    'designer'::text as type,
    COUNT(*)::integer as count
  FROM fonts f
  WHERE f.designer ILIKE partial_query || '%'
  GROUP BY f.designer
  ORDER BY count DESC, f.designer
  LIMIT suggestion_limit;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_tag_suggestions(
  partial_query text,
  suggestion_limit integer DEFAULT 5
)
RETURNS TABLE (
  suggestion text,
  type text,
  count integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    tag as suggestion,
    'tag'::text as type,
    COUNT(*)::integer as count
  FROM fonts f, unnest(f.tags) as tag
  WHERE tag ILIKE partial_query || '%'
  GROUP BY tag
  ORDER BY count DESC, tag
  LIMIT suggestion_limit;
END;
$$ LANGUAGE plpgsql;

-- Create a combined search suggestions function
CREATE OR REPLACE FUNCTION get_search_suggestions(
  partial_query text,
  suggestion_limit integer DEFAULT 5
)
RETURNS TABLE (
  suggestion text,
  type text,
  count integer
) AS $$
DECLARE
  font_suggestions RECORD;
  designer_suggestions RECORD;
  tag_suggestions RECORD;
BEGIN
  -- Return font name suggestions
  FOR font_suggestions IN 
    SELECT * FROM get_font_name_suggestions(partial_query, suggestion_limit)
  LOOP
    suggestion := font_suggestions.suggestion;
    type := font_suggestions.type;
    count := font_suggestions.count;
    RETURN NEXT;
  END LOOP;
  
  -- Return designer suggestions
  FOR designer_suggestions IN 
    SELECT * FROM get_designer_suggestions(partial_query, suggestion_limit)
  LOOP
    suggestion := designer_suggestions.suggestion;
    type := designer_suggestions.type;
    count := designer_suggestions.count;
    RETURN NEXT;
  END LOOP;
  
  -- Return tag suggestions
  FOR tag_suggestions IN 
    SELECT * FROM get_tag_suggestions(partial_query, suggestion_limit)
  LOOP
    suggestion := tag_suggestions.suggestion;
    type := tag_suggestions.type;
    count := tag_suggestions.count;
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Create view for search analytics dashboard
CREATE OR REPLACE VIEW search_analytics_summary AS
SELECT 
  query,
  COUNT(*) as search_count,
  AVG(results_count) as avg_results,
  MAX(created_at) as last_searched
FROM search_analytics
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY query
ORDER BY search_count DESC;

-- Grant access to the view and functions
GRANT SELECT ON search_analytics_summary TO authenticated;
GRANT EXECUTE ON FUNCTION search_fonts TO public;
GRANT EXECUTE ON FUNCTION get_search_suggestions TO public;
GRANT EXECUTE ON FUNCTION get_font_name_suggestions TO public;
GRANT EXECUTE ON FUNCTION get_designer_suggestions TO public;
GRANT EXECUTE ON FUNCTION get_tag_suggestions TO public;