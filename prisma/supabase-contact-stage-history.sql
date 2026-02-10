-- Run in Supabase SQL Editor (after AIDA migration). For 30-day conversion metrics.
CREATE TABLE IF NOT EXISTS "contact_stage_history" (
  "id" TEXT NOT NULL,
  "contactId" TEXT NOT NULL,
  "fromStage" "FunnelStage",
  "toStage" "FunnelStage" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "contact_stage_history_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "contact_stage_history"
  ADD CONSTRAINT "contact_stage_history_contactId_fkey"
  FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "contact_stage_history_contactId_createdAt_idx"
  ON "contact_stage_history"("contactId", "createdAt");
CREATE INDEX IF NOT EXISTS "contact_stage_history_toStage_createdAt_idx"
  ON "contact_stage_history"("toStage", "createdAt");
