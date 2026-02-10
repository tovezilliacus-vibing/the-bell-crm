# The Bell CRM — Build Plan

This document breaks down the build of The Bell CRM into five phases, aligned with the blueprint (Person → Lead/Prospect/Customer, Company/Account, Deals, Tasks, Activities).

---

## Architecture Overview

**Core entities (from blueprint):**
- **Person** — Central entity; can be Lead, Prospect, or Customer. Always linkable to Tasks and Activities.
- **Company** — Organization; becomes an **Account** when it has won deals / is a customer.
- **Deal** — Opportunity with stages: Initiating → Needs development → Proposal → Negotiation → Close (WIN / LOST). Winning creates/updates an Account.
- **Task** — Planned future action (“call person A at date/time”); always related to a Person.
- **Activity** — Record of something done; always related to a Person. User completes a Task → records Activity → may create a follow-up Task.

**UI structure:** Dashboard, Leads, Customers, Deals, Tasks, Companies/Accounts, Settings (sidebar + main content).

---

## Phase 1: Auth ✅

**Goal:** Secure sign-in and session so all CRM data is user-scoped.

**Tasks:**
- Choose auth provider (e.g. NextAuth.js with credentials or OAuth). ✅ **Clerk** (hosted auth, sign-in/sign-up UI).
- Implement login/logout and session handling. ✅ ClerkProvider, Clerk sign-in/sign-up at `/sign-in` and `/sign-up`, UserButton in Sidebar for account and sign out.
- Protect routes (middleware or layout checks). ✅ `clerkMiddleware` with `createRouteMatcher`; public: `/sign-in`, `/sign-up`; all other routes require auth.
- Optional: user profile and basic settings (name, avatar). ✅ Settings page shows Clerk user name/email; Sidebar shows user and Clerk UserButton.
- Ensure all future data access is filtered by authenticated user (or org). Ready for Phase 2 (use `auth().userId` from `@clerk/nextjs/server` in API and server components).

**Deliverables:** Sign-in/sign-up pages, protected app shell, session via Clerk.

**Setup:** Copy `.env.example` to `.env.local`. Create an application at [dashboard.clerk.com](https://dashboard.clerk.com), then set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.

---

## Phase 2: Database Schema ✅

**Goal:** Persist Persons, Companies, Deals, Tasks, and Activities with correct relationships.

**Tasks:**
- **Persons:** `id`, `email`, `name`, `phone`, `status` (lead | prospect | customer), `companyId`, `createdAt`, `updatedAt`, `userId` (Clerk). ✅
- **Companies:** `id`, `name`, `domain`, `isAccount` (true when customer), `createdAt`, `updatedAt`, `userId`. ✅
- **Deals:** `id`, `title`, `value`, `stage` (initiating → closed_won/closed_lost), `companyId`, `personId`, `userId`, `closedAt`, timestamps. ✅
- **Tasks:** `id`, `title`, `dueAt`, `completedAt`, `personId`, `userId`, timestamps. ✅
- **Activities:** `id`, `type`, `description`, `occurredAt`, `personId`, `userId`, timestamps. ✅
- Set up ORM (Prisma) and migrations. ✅
- Relations: Person ↔ Company, Person ↔ Tasks/Activities, Deal ↔ Company/Person. ✅

**Deliverables:** `prisma/schema.prisma`, `src/lib/db.ts`, migrations. Use `auth().userId` from `@clerk/nextjs/server` to scope queries.

---

## Phase 3: Dashboard UI ✅

**Goal:** Single-page overview of pipeline and workload.

**Tasks:**
- **Layout:** Sidebar navigation + main content area (Tailwind). ✅
- **Dashboard widgets (using Shadcn Card/Table):**
  - Lead funnel: counts for Lead → Prospect → Customer. ✅ Cards show counts; link to /leads.
  - Deal pipeline: total deals + open (non-closed) count. ✅ Card links to /deals.
  - My tasks: pending task count + upcoming 5 tasks by due date. ✅ Card + table; link to /tasks.
  - Recent activity: last 10 activities with type, description, person, date. ✅
- All data scoped by Clerk `auth().userId` via Prisma.

**Deliverables:** Dashboard route with real data from DB; cards link to Leads, Deals, Tasks; View all buttons.

---

## Phase 4: Lead Management

**Goal:** Full CRUD and lifecycle for Leads → Prospects → Customers and Companies/Accounts.

**Tasks:**
- **Leads list:** Table of persons with status = lead (and company); filters, search.
- **Lead detail:** View/edit person + company; actions: “Convert to Prospect”, “Create Deal”.
- **Prospects:** Same for status = prospect; “Convert to Customer” / “Create Account”.
- **Customers & Accounts:** List customers (persons with status = customer) and accounts (companies that are customers); link to deals and activities.
- **Companies:** List companies; distinguish “Company” vs “Account” (customer company).
- **Tasks & Activities:** Per-person task list; create Task, mark complete, record Activity (and optional follow-up Task).
- Forms and validation; use Shadcn Input, Button, Card, Table.

**Deliverables:** Routes and pages for Leads, Prospects, Customers, Companies, Tasks; forms and list views; API routes or server actions for CRUD.

---

## Phase 5: Analytics

**Goal:** Insights on conversion and pipeline performance.

**Tasks:**
- **Lead analytics:** Conversion rates (Lead → Prospect → Customer); time in stage.
- **Deal analytics:** Conversion by stage; win/loss rate; average deal value; time in stage.
- **Task/activity metrics:** Completed vs pending tasks; activity volume over time.
- **Dashboard integration:** Add charts/summaries to dashboard (e.g. conversion funnel, pipeline value).
- Use charts library (e.g. Recharts) with Shadcn styling; keep tables for raw data where useful.

**Deliverables:** Analytics page(s), dashboard widgets with charts, optional export (CSV).

---

## Phase 6: Email in CRM (full visibility & management)

**Goal:** All incoming and outgoing email visible and manageable in the CRM. The CRM is the place users manage their email for contacts.

**Requirements:**
- User connects their own email (Gmail, Outlook/Microsoft 365) via OAuth.
- All relevant emails (inbox + sent) are visible in the CRM and linked to Persons (contacts) by email address.
- User can read, compose, send, and reply from the CRM; sent mail stays in sync with their connected account.
- Full visibility: every in/out email with a contact appears in the CRM (per contact and/or unified inbox).

**Architecture (high level):**
1. **Connect:** OAuth with Google and/or Microsoft; store refresh + access tokens per user (and which provider) in `UserEmailAccount`. Clerk userId identifies the user.
2. **Sync:** Periodically (or via webhooks if provider supports) fetch new messages; for each message, resolve to/from addresses to a CRM Person (by email); store metadata + body in `Email` (or fetch on-demand and cache).
3. **Link:** Each `Email` row has `personId` (primary contact), `userId` (owner), direction (in/out), provider message/thread id, subject, body/snippet, date.
4. **UI:** Inbox/unified view (all emails or filter by contact); per-Person “Communication” tab (emails + activities); compose modal/page; reply from CRM (send via provider API, then store or re-sync so it appears in CRM).

**Data model (add to schema):**
- **UserEmailAccount:** userId (Clerk), provider (gmail | outlook), email (address), accessToken (encrypted), refreshToken, expiresAt. One row per connected account per user.
- **Email:** id, userId, personId (nullable until matched), provider, providerMessageId, threadId, direction (in | out), from, to (JSON or text), subject, bodySnippet, body (optional), sentAt, createdAt. Unique on (userId, provider, providerMessageId). Enables “all emails in CRM” and per-person thread view.

**Tech:**
- **Gmail:** Google Cloud project, Gmail API, OAuth 2.0 (read/send). Scopes: `gmail.readonly`, `gmail.send`, `gmail.modify` (if we want labels).
- **Outlook:** Azure app registration, Microsoft Graph (mail read/send). Scopes: `Mail.Read`, `Mail.Send`, `offline_access`.
- **Sync:** Cron job or background worker (e.g. Vercel cron, or queue) to refresh tokens and fetch new mail; match addresses to Person.email; upsert Email rows. Optional: Gmail push (watch) or webhooks for near-real-time.
- **Send/Reply:** Use provider API (Gmail API or Graph) with stored tokens; then either re-fetch that message or create an Email row for the sent item so it appears in CRM immediately.

**Phased implementation:**
1. **Phase 6a – Connect:** Add “Connect email” in Settings; OAuth for Gmail (or Outlook); store tokens in UserEmailAccount; list connected accounts.
2. **Phase 6b – Sync & link:** Background sync (cron): fetch recent inbox + sent, match to Persons, upsert Email. Show “Emails” count or last sync time on Person/dashboard.
3. **Phase 6c – In-CRM inbox & per-contact view:** UI: unified “Inbox” (or “Emails”) and per-Person “Email” / “Communication” tab listing Email rows; open thread/body in CRM.
4. **Phase 6d – Compose & reply:** Compose new email (to a Person); send via provider API; reply from CRM. Ensure sent items are synced back so “full visibility” is maintained.

**Deliverables:** UserEmailAccount + Email models; OAuth connect flow; sync job; inbox and per-person email views; compose and reply from CRM.

---

## Folder Structure (Suggested)

```
src/
  app/
    (auth)/           # login, register if needed
    (dashboard)/      # layout with sidebar + main content
      layout.tsx      # sidebar + main area
      page.tsx        # dashboard home
      leads/
      customers/
      deals/
      tasks/
      companies/
      settings/
    layout.tsx        # root layout
    globals.css
  components/
    ui/               # Shadcn (button, card, table, input)
    layout/           # Sidebar, MainContent, Header
  lib/
    db.ts             # Prisma client
    auth.ts           # Auth config
  types/              # Shared types for Person, Company, Deal, Task, Activity
```

---

## Tech Stack Summary

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **UI:** Shadcn (Button, Card, Table, Input)
- **Auth:** TBD in Phase 1 (e.g. NextAuth.js)
- **Database:** TBD in Phase 2 (e.g. Prisma + PostgreSQL/SQLite)

---

*Next steps: scaffold Next.js, add Shadcn, then implement Phase 3 layout (sidebar + main content) and basic dashboard.*
