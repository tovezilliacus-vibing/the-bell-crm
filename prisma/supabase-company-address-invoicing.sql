-- Add company address and invoicing columns
-- Run in Supabase SQL Editor if prisma db push is not used.

-- Add street address (between existing fields and city)
ALTER TABLE "companies"
  ADD COLUMN IF NOT EXISTS "streetAddress" TEXT;

ALTER TABLE "companies"
  ADD COLUMN IF NOT EXISTS "vatNumber" TEXT;

ALTER TABLE "companies"
  ADD COLUMN IF NOT EXISTS "registrationNumber" TEXT;

-- Note: industry, city, state, country already exist on companies.
-- If your schema was created before those, add them too:
-- ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "industry" TEXT;
-- ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "city" TEXT;
-- ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "state" TEXT;
-- ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "country" TEXT;
