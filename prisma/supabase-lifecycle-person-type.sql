-- Add CompanyLifecycle and PersonType enums + columns for companies.lifecycleStage and contacts.personType
-- Run this in Supabase SQL Editor if prisma db push fails (e.g. TLS).

-- Create enums if they don't exist (PostgreSQL 9.1+)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CompanyLifecycle') THEN
    CREATE TYPE "CompanyLifecycle" AS ENUM ('PROSPECT', 'CUSTOMER');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PersonType') THEN
    CREATE TYPE "PersonType" AS ENUM ('LEAD', 'CONTACT');
  END IF;
END
$$;

-- Add lifecycleStage to companies (skip if column exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'lifecycleStage'
  ) THEN
    ALTER TABLE "companies"
    ADD COLUMN "lifecycleStage" "CompanyLifecycle" NOT NULL DEFAULT 'PROSPECT';
  END IF;
END
$$;

-- Add personType to contacts (skip if column exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contacts' AND column_name = 'personType'
  ) THEN
    ALTER TABLE "contacts"
    ADD COLUMN "personType" "PersonType" NOT NULL DEFAULT 'LEAD';
  END IF;
END
$$;

-- Indexes (ignore errors if they already exist)
CREATE INDEX IF NOT EXISTS "companies_workspaceId_lifecycleStage_idx"
  ON "companies" ("workspaceId", "lifecycleStage");

CREATE INDEX IF NOT EXISTS "contacts_workspaceId_personType_idx"
  ON "contacts" ("workspaceId", "personType");
