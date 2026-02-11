-- Run in Supabase: SQL Editor → New query → paste all → Run
-- Adds lead/company fields and user-defined prospect key metrics (Phase 4)

-- Lead source enum for Person (skip if already exists, e.g. from forms or AIDA migration)
DO $$ BEGIN
  CREATE TYPE "LeadSource" AS ENUM ('INBOUND', 'OUTREACH', 'EVENT', 'REFERRAL', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Contacts: first/last name, lead source, referral (table is "contacts" in AIDA schema)
ALTER TABLE "contacts"
  ADD COLUMN IF NOT EXISTS "firstName" TEXT,
  ADD COLUMN IF NOT EXISTS "lastName" TEXT,
  ADD COLUMN IF NOT EXISTS "leadSource" "LeadSource",
  ADD COLUMN IF NOT EXISTS "referralFrom" TEXT;

-- Company: prospect key metrics (industry, size, location)
ALTER TABLE "companies"
  ADD COLUMN IF NOT EXISTS "industry" TEXT,
  ADD COLUMN IF NOT EXISTS "sizeTurnover" TEXT,
  ADD COLUMN IF NOT EXISTS "sizePersonnel" TEXT,
  ADD COLUMN IF NOT EXISTS "city" TEXT,
  ADD COLUMN IF NOT EXISTS "state" TEXT,
  ADD COLUMN IF NOT EXISTS "country" TEXT;

-- User-defined dropdown options (Settings → Prospect key metrics)
CREATE TABLE IF NOT EXISTS "prospect_field_options" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "fieldType" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "prospect_field_options_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "prospect_field_options_userId_fieldType_value_key"
  ON "prospect_field_options"("userId", "fieldType", "value");
