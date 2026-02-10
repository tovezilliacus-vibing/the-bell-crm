-- Embeddable contact forms: forms, form_fields, form_submissions
-- Run after workspace + AIDA migrations. Contact.formId and LeadSource.FORM added separately if needed.

-- Add FORM to LeadSource enum if not present (run once)
DO $$ BEGIN
  ALTER TYPE "LeadSource" ADD VALUE 'FORM';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Form field type enum
DO $$ BEGIN
  CREATE TYPE "FormFieldType" AS ENUM ('text', 'email', 'textarea', 'select', 'checkbox', 'hidden');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Forms table
CREATE TABLE IF NOT EXISTS forms (
  id TEXT PRIMARY KEY,
  "workspaceId" TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  "publicKey" TEXT NOT NULL UNIQUE,
  "thankYouMessage" TEXT,
  "redirectUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_forms_workspace_id ON forms("workspaceId");
CREATE UNIQUE INDEX IF NOT EXISTS idx_forms_public_key ON forms("publicKey");

-- Form fields
CREATE TABLE IF NOT EXISTS form_fields (
  id TEXT PRIMARY KEY,
  "formId" TEXT NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  name TEXT NOT NULL,
  type "FormFieldType" NOT NULL,
  required BOOLEAN NOT NULL DEFAULT false,
  options JSONB,
  "orderIndex" INT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_form_fields_form_id ON form_fields("formId");

-- Form submissions
CREATE TABLE IF NOT EXISTS form_submissions (
  id TEXT PRIMARY KEY,
  "formId" TEXT NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  "submittedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  payload JSONB NOT NULL,
  "contactId" TEXT REFERENCES contacts(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions("formId");
CREATE INDEX IF NOT EXISTS idx_form_submissions_contact_id ON form_submissions("contactId");

-- Add formId to contacts (run after forms table exists)
DO $$ BEGIN
  ALTER TABLE contacts ADD COLUMN "formId" TEXT REFERENCES forms(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_contacts_form_id ON contacts("formId") WHERE "formId" IS NOT NULL;

-- RLS: authenticated users see only their workspace's forms and submissions.
-- Note: This app uses Clerk + Prisma (direct DB URL), so RLS is bypassed for server-side requests.
-- These policies apply when using Supabase client with anon/authenticated keys (auth.uid()).
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: workspace members can manage forms (use service role or postgres for API; these apply to anon/authenticated)
CREATE POLICY "Workspace members can read forms"
  ON forms FOR SELECT
  USING (
    "workspaceId" IN (SELECT "workspaceId" FROM workspace_members WHERE "userId" = auth.uid()::text)
  );
CREATE POLICY "Workspace members can insert forms"
  ON forms FOR INSERT
  WITH CHECK (
    "workspaceId" IN (SELECT "workspaceId" FROM workspace_members WHERE "userId" = auth.uid()::text)
  );
CREATE POLICY "Workspace members can update forms"
  ON forms FOR UPDATE
  USING (
    "workspaceId" IN (SELECT "workspaceId" FROM workspace_members WHERE "userId" = auth.uid()::text)
  );
CREATE POLICY "Workspace members can delete forms"
  ON forms FOR DELETE
  USING (
    "workspaceId" IN (SELECT "workspaceId" FROM workspace_members WHERE "userId" = auth.uid()::text)
  );

CREATE POLICY "Workspace members can read form_fields"
  ON form_fields FOR SELECT
  USING (
    "formId" IN (SELECT id FROM forms WHERE "workspaceId" IN (SELECT "workspaceId" FROM workspace_members WHERE "userId" = auth.uid()::text))
  );
CREATE POLICY "Workspace members can manage form_fields"
  ON form_fields FOR ALL
  USING (
    "formId" IN (SELECT id FROM forms WHERE "workspaceId" IN (SELECT "workspaceId" FROM workspace_members WHERE "userId" = auth.uid()::text))
  );

CREATE POLICY "Workspace members can read form_submissions"
  ON form_submissions FOR SELECT
  USING (
    "formId" IN (SELECT id FROM forms WHERE "workspaceId" IN (SELECT "workspaceId" FROM workspace_members WHERE "userId" = auth.uid()::text))
  );
-- Public API inserts form_submissions via Prisma (postgres/service role), not anon key; no INSERT policy for anon.
-- TODO: rate limiting, optional captcha at application layer.
