-- Run this in Supabase: SQL Editor → New query → paste this entire file → Run
-- It adds "workspaceId" to each table only if the column is missing (safe to run multiple times).

DO $$
BEGIN
  ALTER TABLE contacts ADD COLUMN "workspaceId" TEXT REFERENCES workspaces(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$
BEGIN
  ALTER TABLE companies ADD COLUMN "workspaceId" TEXT REFERENCES workspaces(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$
BEGIN
  ALTER TABLE campaigns ADD COLUMN "workspaceId" TEXT REFERENCES workspaces(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$
BEGIN
  ALTER TABLE deals ADD COLUMN "workspaceId" TEXT REFERENCES workspaces(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$
BEGIN
  ALTER TABLE tasks ADD COLUMN "workspaceId" TEXT REFERENCES workspaces(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$
BEGIN
  ALTER TABLE activities ADD COLUMN "workspaceId" TEXT REFERENCES workspaces(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
