-- Run this in Supabase: SQL Editor → New query → paste → Run
-- Shows all columns for contacts, tasks, and deals so you can see if workspaceId exists.

SELECT 'contacts' AS table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'contacts'
ORDER BY ordinal_position;

SELECT 'tasks' AS table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'tasks'
ORDER BY ordinal_position;

SELECT 'deals' AS table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'deals'
ORDER BY ordinal_position;
