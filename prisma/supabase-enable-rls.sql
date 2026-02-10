-- Run this in Supabase: SQL Editor → New query → paste → Run
-- Enables Row Level Security (RLS) on all CRM tables to clear Security Advisor errors.
-- Your app uses Prisma with the database owner (postgres), which bypasses RLS, so behaviour stays the same.
-- Anyone using the anon/key API without policies would see no rows.

ALTER TABLE "companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "persons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "deals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "activities" ENABLE ROW LEVEL SECURITY;
