/*
  # Add Enhanced Search Features

  This migration adds full-text search and advanced filtering capabilities.
  
  ## What this migration does:
  - Adds full-text search indexes for fonts
  - Creates search functions for better font discovery
  - Adds search analytics tracking
  
  ## New Features:
  1. Full-text search on font names, descriptions, and tags
  2. Advanced filtering by multiple criteria
  3. Search suggestions and autocomplete
  4. Search analytics
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

-- Create function for search suggestions
CREATE OR REPLACE FUNCTION get_search_suggestions(
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
  -- Font names
  SELECT 
    f.name as suggestion,
    'font' as type,
    1 as count
  FROM fonts f
  WHERE f.name ILIKE partial_query || '%'
  LIMIT suggestion_limit
  
  UNION ALL
  
  -- Designer names
  SELECT DISTINCT
    f.designer as suggestion,
    'designer' as type,
    COUNT(*)::integer as count
  FROM fonts f
  WHERE f.designer ILIKE partial_query || '%'
  GROUP BY f.designer
  LIMIT suggestion_limit
  
  UNION ALL
  
  -- Tags
  SELECT DISTINCT
    unnest(f.tags) as suggestion,
    'tag' as type,
    COUNT(*)::integer as count
  FROM fonts f
  WHERE EXISTS (
    SELECT 1 FROM unnest(f.tags) as tag 
    WHERE tag ILIKE partial_query || '%'
  )
  GROUP BY unnest(f.tags)
  LIMIT suggestion_limit;
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