/*
  # Test Migration

  This is a simple test migration to verify that the migration system is working properly.
  
  1. Creates a temporary test table
  2. Inserts a test record
  3. Cleans up by dropping the table
  
  This migration should execute successfully and help us verify the connection.
*/

-- Create a temporary test table
CREATE TABLE IF NOT EXISTS test_migration_table (
  id SERIAL PRIMARY KEY,
  test_message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert a test record
INSERT INTO test_migration_table (test_message) 
VALUES ('Migration system is working - ' || NOW()::TEXT);

-- Verify the record was inserted
DO $$
DECLARE
  record_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO record_count FROM test_migration_table;
  
  IF record_count > 0 THEN
    RAISE NOTICE 'Test migration successful: % records found', record_count;
  ELSE
    RAISE EXCEPTION 'Test migration failed: no records found';
  END IF;
END $$;

-- Clean up - drop the test table
DROP TABLE IF EXISTS test_migration_table;

-- Log success
DO $$
BEGIN
  RAISE NOTICE 'Test migration completed successfully at %', NOW();
END $$;