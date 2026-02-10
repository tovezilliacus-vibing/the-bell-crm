-- Workspace & billing tier (multi-team, plan limits)
-- Run after supabase-aida-migration.sql (or equivalent). Backfill existing data after adding columns.

-- Enum for billing tier: FREE (1 user), STARTER (2–10), GROWTH (11–50), PAID (legacy)
DO $$ BEGIN
  CREATE TYPE "BillingTier" AS ENUM ('FREE', 'STARTER', 'GROWTH', 'PAID');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
-- If you already created the enum with only 'FREE', 'PAID', add the new values (run once):
-- ALTER TYPE "BillingTier" ADD VALUE 'STARTER';
-- ALTER TYPE "BillingTier" ADD VALUE 'GROWTH';

-- Workspace table
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT,
  plan "BillingTier" NOT NULL DEFAULT 'FREE',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Workspace members (user ↔ workspace)
CREATE TABLE IF NOT EXISTS workspace_members (
  id TEXT PRIMARY KEY,
  "workspaceId" TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("workspaceId", "userId")
);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members("userId");

-- Add workspaceId to campaigns (optional first for backfill)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS "workspaceId" TEXT REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_campaigns_workspace_id ON campaigns("workspaceId") WHERE "workspaceId" IS NOT NULL;

-- Add workspaceId to companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS "workspaceId" TEXT REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_companies_workspace_id ON companies("workspaceId") WHERE "workspaceId" IS NOT NULL;

-- Add workspaceId to contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS "workspaceId" TEXT REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_contacts_workspace_id ON contacts("workspaceId") WHERE "workspaceId" IS NOT NULL;

-- Add workspaceId to deals
ALTER TABLE deals ADD COLUMN IF NOT EXISTS "workspaceId" TEXT REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_deals_workspace_id ON deals("workspaceId") WHERE "workspaceId" IS NOT NULL;

-- Add workspaceId to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "workspaceId" TEXT REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_id ON tasks("workspaceId") WHERE "workspaceId" IS NOT NULL;

-- Add workspaceId to activities
ALTER TABLE activities ADD COLUMN IF NOT EXISTS "workspaceId" TEXT REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_activities_workspace_id ON activities("workspaceId") WHERE "workspaceId" IS NOT NULL;

-- Backfill: create one workspace per distinct userId and assign their data (run once after first deploy)
-- Uncomment and run when you have existing data, then set NOT NULL on workspaceId columns.
/*
INSERT INTO workspaces (id, name, plan, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'My workspace', 'FREE', now(), now()
FROM (SELECT DISTINCT "userId" FROM contacts) u
ON CONFLICT DO NOTHING;
-- Then update contacts/deals/tasks/activities/companies/campaigns to set workspaceId from workspace_members.
-- After backfill, alter columns to SET NOT NULL and drop the optional index.
*/
