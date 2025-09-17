-- Complete Database Setup Script
-- Run this script to set up the entire database

-- Step 1: Create all tables
\i create_tables.sql

-- Step 2: Create indexes for performance
\i create_indexes.sql

-- Step 3: Create functions and triggers
\i functions_triggers.sql

-- Step 4: Create views
\i views.sql

-- Step 5: Insert sample data
\i sample_data.sql

-- Display setup completion message
SELECT 'Database setup completed successfully!' as status;