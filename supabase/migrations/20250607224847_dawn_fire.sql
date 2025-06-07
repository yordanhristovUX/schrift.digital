/*
  # Add Font Analytics Feature

  This migration adds analytics tracking for font usage and user behavior.
  
  ## What this migration does:
  - Creates tables to track font views, downloads, and user interactions
  - Adds proper indexing for analytics queries
  - Enables RLS for data privacy
  
  ## New Tables:
  1. `font_analytics` - Track font interactions
  2. `user_font_favorites` - User favorite fonts
  3. `font_preview_sessions` - Track preview sessions
  
  ## Security:
  - Enable RLS on all tables
  - Users can only see their own data
  - Admins can see aggregated analytics
*/

-- Generated at: 2025-01-27 10:35:00 UTC

-- Create font_analytics table
CREATE TABLE IF NOT EXISTS font_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  font_id uuid NOT NULL REFERENCES fonts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('view', 'download', 'preview', 'favorite', 'unfavorite')),
  session_id text,
  user_agent text,
  ip_address inet,
  referrer text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create user_font_favorites table
CREATE TABLE IF NOT EXISTS user_font_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  font_id uuid NOT NULL REFERENCES fonts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, font_id)
);

-- Create font_preview_sessions table
CREATE TABLE IF NOT EXISTS font_preview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  font_id uuid NOT NULL REFERENCES fonts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  preview_text text,
  font_size integer,
  font_weight text,
  duration_seconds integer,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE font_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_font_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE font_preview_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for font_analytics
CREATE POLICY "Users can view their own analytics"
  ON font_analytics
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin users can view all analytics"
  ON font_analytics
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'::user_role
  ));

CREATE POLICY "Anyone can insert analytics"
  ON font_analytics
  FOR INSERT
  TO public
  WITH CHECK (true);

-- RLS Policies for user_font_favorites
CREATE POLICY "Users can manage their own favorites"
  ON user_font_favorites
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for font_preview_sessions
CREATE POLICY "Users can view their own preview sessions"
  ON font_preview_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin users can view all preview sessions"
  ON font_preview_sessions
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'::user_role
  ));

CREATE POLICY "Anyone can insert preview sessions"
  ON font_preview_sessions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_font_analytics_font_id ON font_analytics(font_id);
CREATE INDEX IF NOT EXISTS idx_font_analytics_user_id ON font_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_font_analytics_event_type ON font_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_font_analytics_created_at ON font_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_font_analytics_session_id ON font_analytics(session_id);

CREATE INDEX IF NOT EXISTS idx_user_font_favorites_user_id ON user_font_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_font_favorites_font_id ON user_font_favorites(font_id);

CREATE INDEX IF NOT EXISTS idx_font_preview_sessions_font_id ON font_preview_sessions(font_id);
CREATE INDEX IF NOT EXISTS idx_font_preview_sessions_session_id ON font_preview_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_font_preview_sessions_created_at ON font_preview_sessions(created_at);

-- Create a view for popular fonts
CREATE OR REPLACE VIEW popular_fonts AS
SELECT 
  f.id,
  f.name,
  f.designer,
  f.category,
  COUNT(CASE WHEN fa.event_type = 'view' THEN 1 END) as view_count,
  COUNT(CASE WHEN fa.event_type = 'download' THEN 1 END) as download_count,
  COUNT(CASE WHEN fa.event_type = 'favorite' THEN 1 END) as favorite_count,
  COUNT(CASE WHEN fa.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_activity
FROM fonts f
LEFT JOIN font_analytics fa ON f.id = fa.font_id
GROUP BY f.id, f.name, f.designer, f.category
ORDER BY recent_activity DESC, view_count DESC;

-- Grant access to the view
GRANT SELECT ON popular_fonts TO public;