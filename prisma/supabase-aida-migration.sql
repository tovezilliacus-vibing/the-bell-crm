-- AIDA full migration — Run in Supabase SQL Editor after schema.prisma is updated.
-- Run in order. Assumes existing tables: persons, companies, deals, tasks, activities, emails (and optionally prospect_field_options from lead-fields).

-- 1. New enums
CREATE TYPE "FunnelStage" AS ENUM ('AWARENESS', 'INTEREST', 'DESIRE', 'ACTION');
CREATE TYPE "ActivityType" AS ENUM ('EMAIL', 'CALL', 'NOTE');
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- 2. Campaigns table
CREATE TABLE IF NOT EXISTS "campaigns" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- 3. Persons → Contacts (add AIDA columns, backfill from status, drop status, rename)
ALTER TABLE "persons" ADD COLUMN IF NOT EXISTS "funnelStage" "FunnelStage";
UPDATE "persons" SET "funnelStage" = CASE
  WHEN "status"::text = 'LEAD' THEN 'AWARENESS'::"FunnelStage"
  WHEN "status"::text = 'PROSPECT' THEN 'INTEREST'::"FunnelStage"
  WHEN "status"::text = 'CUSTOMER' THEN 'ACTION'::"FunnelStage"
  ELSE 'AWARENESS'::"FunnelStage"
END
WHERE "funnelStage" IS NULL;
ALTER TABLE "persons" ALTER COLUMN "funnelStage" SET DEFAULT 'AWARENESS'::"FunnelStage";
ALTER TABLE "persons" ALTER COLUMN "funnelStage" SET NOT NULL;

ALTER TABLE "persons" DROP COLUMN IF EXISTS "status";

ALTER TABLE "persons" ADD COLUMN IF NOT EXISTS "campaignId" TEXT;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'persons_campaignId_fkey'
  ) THEN
    ALTER TABLE "persons" ADD CONSTRAINT "persons_campaignId_fkey"
      FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "persons" RENAME TO "contacts";

-- 4. Deals: personId → contactId
ALTER TABLE "deals" RENAME COLUMN "personId" TO "contactId";

-- 5. Tasks: personId → contactId, add dealId and status
ALTER TABLE "tasks" RENAME COLUMN "personId" TO "contactId";
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "dealId" TEXT;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "status" "TaskStatus" NOT NULL DEFAULT 'PENDING';
UPDATE "tasks" SET "status" = 'COMPLETED'::"TaskStatus" WHERE "completedAt" IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_dealId_fkey') THEN
    ALTER TABLE "tasks" ADD CONSTRAINT "tasks_dealId_fkey"
      FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "tasks" ALTER COLUMN "contactId" DROP NOT NULL;

-- 6. Activities: personId → contactId, add dealId, type → ActivityType
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "typeNew" "ActivityType";
UPDATE "activities" SET "typeNew" = CASE
  WHEN LOWER(TRIM("type")) IN ('email') THEN 'EMAIL'::"ActivityType"
  WHEN LOWER(TRIM("type")) IN ('call') THEN 'CALL'::"ActivityType"
  ELSE 'NOTE'::"ActivityType"
END
WHERE "typeNew" IS NULL;
ALTER TABLE "activities" DROP COLUMN "type";
ALTER TABLE "activities" RENAME COLUMN "typeNew" TO "type";
ALTER TABLE "activities" ALTER COLUMN "type" SET NOT NULL;

ALTER TABLE "activities" RENAME COLUMN "personId" TO "contactId";
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "dealId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activities_dealId_fkey') THEN
    ALTER TABLE "activities" ADD CONSTRAINT "activities_dealId_fkey"
      FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "activities" ALTER COLUMN "contactId" DROP NOT NULL;

-- 7. Emails: personId → contactId (only if Phase 6 emails table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'emails') THEN
    ALTER TABLE "emails" RENAME COLUMN "personId" TO "contactId";
  END IF;
END $$;

-- 8. Update FK names that referenced persons (now contacts)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deals_personId_fkey') THEN
    ALTER TABLE "deals" RENAME CONSTRAINT "deals_personId_fkey" TO "deals_contactId_fkey";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_personId_fkey') THEN
    ALTER TABLE "tasks" RENAME CONSTRAINT "tasks_personId_fkey" TO "tasks_contactId_fkey";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activities_personId_fkey') THEN
    ALTER TABLE "activities" RENAME CONSTRAINT "activities_personId_fkey" TO "activities_contactId_fkey";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'emails')
     AND EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'emails_personId_fkey') THEN
    ALTER TABLE "emails" RENAME CONSTRAINT "emails_personId_fkey" TO "emails_contactId_fkey";
  END IF;
END $$;

-- 9. RLS: enable on new/renamed tables (if you use RLS)
ALTER TABLE "contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "campaigns" ENABLE ROW LEVEL SECURITY;
