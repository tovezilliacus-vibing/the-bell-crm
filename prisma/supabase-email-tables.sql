-- Run in Supabase SQL Editor when you're ready to build Phase 6 (Email in CRM).
-- Creates tables for connected email accounts and synced emails.

CREATE TABLE "user_email_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_email_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_email_accounts_userId_provider_key" ON "user_email_accounts"("userId", "provider");

CREATE TABLE "emails" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmailAccountId" TEXT,
    "contactId" TEXT,
    "provider" TEXT NOT NULL,
    "providerMessageId" TEXT NOT NULL,
    "threadId" TEXT,
    "direction" TEXT NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "toAddresses" TEXT NOT NULL,
    "subject" TEXT,
    "bodySnippet" TEXT,
    "body" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emails_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "emails_userId_provider_providerMessageId_key" ON "emails"("userId", "provider", "providerMessageId");

ALTER TABLE "emails" ADD CONSTRAINT "emails_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "emails" ADD CONSTRAINT "emails_userEmailAccountId_fkey" FOREIGN KEY ("userEmailAccountId") REFERENCES "user_email_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RLS
ALTER TABLE "user_email_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "emails" ENABLE ROW LEVEL SECURITY;
