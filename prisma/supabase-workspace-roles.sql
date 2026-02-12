-- Workspace roles (ADMIN / MEMBER) and invites
-- Run after supabase-workspace-billing.sql. Backfill: set existing members to ADMIN so current users keep full access.

DO $$ BEGIN
  CREATE TYPE "WorkspaceRole" AS ENUM ('ADMIN', 'MEMBER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add role to workspace_members (default MEMBER for new rows; backfill existing to ADMIN)
ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS role "WorkspaceRole" NOT NULL DEFAULT 'MEMBER';

-- Backfill (run once after adding column): make all existing members admins
-- UPDATE workspace_members SET role = 'ADMIN';

-- Create workspace_invites for pending invites (admin invites by email)
CREATE TABLE IF NOT EXISTS workspace_invites (
  id TEXT PRIMARY KEY,
  "workspaceId" TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role "WorkspaceRole" NOT NULL DEFAULT 'MEMBER',
  "invitedByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("workspaceId", email)
);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_workspace_id ON workspace_invites("workspaceId");
