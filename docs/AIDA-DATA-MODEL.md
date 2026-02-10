# AIDA CRM — Data Model & Folder Structure

Opinionated CRM for small teams following the **AIDA funnel**: Awareness → Interest → Desire → Action.

---

## 1. Entity overview

| Entity        | Purpose |
|---------------|--------|
| **User**      | Identity via Clerk `userId`; no separate User table unless you need CRM-specific user fields. |
| **Company**   | Organization (account); deals and contacts belong to companies. |
| **Contact**   | Person in the funnel; always in one **FunnelStage** (AIDA). Replaces/conceptualizes “Person” / “Lead”. |
| **Deal**      | Opportunity; linked to Contact + Company. |
| **Task**      | Todo; linked to Contact and/or Deal. |
| **Activity**  | Logged interaction: email, call, or note; linked to Contact and/or Deal. |
| **FunnelStage** | AIDA stages (enum): Awareness, Interest, Desire, Action. |
| **Campaign**  | Source for contacts (utm-style); Contact optionally belongs to a Campaign. |

---

## 2. Enums

- **FunnelStage** — `AWARENESS` | `INTEREST` | `DESIRE` | `ACTION`  
  - One stage per contact; drives pipeline views and reporting.

- **ActivityType** — `EMAIL` | `CALL` | `NOTE`  
  - Replaces free-text `type`; keeps reporting and filters consistent.

- **TaskStatus** — `PENDING` | `COMPLETED` | `CANCELLED`  
  - Explicit status; can still derive from `completedAt` if you prefer, but enum is clearer for filters and UI.

- **DealStage** — keep existing (e.g. INITIATING → CLOSED_WON / CLOSED_LOST) for deal pipeline, separate from AIDA.

---

## 3. Prisma schema (proposed)

Below is the proposed schema. It keeps your existing `Company`, `Deal`, and optional Phase 6 email models, and evolves **Person** into **Contact** (AIDA + Campaign), and extends **Task** and **Activity** to support Deals.

```prisma
// —— AIDA Funnel & Campaign ——

enum FunnelStage {
  AWARENESS
  INTEREST
  DESIRE
  ACTION
}

enum ActivityType {
  EMAIL
  CALL
  NOTE
}

enum TaskStatus {
  PENDING
  COMPLETED
  CANCELLED
}

model Campaign {
  id          String   @id @default(cuid())
  name        String   // e.g. "Q1 Webinar", "LinkedIn Ads"
  utmSource   String?  // utm_source
  utmMedium   String?  // utm_medium
  utmCampaign String?  // utm_campaign
  userId      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  contacts Contact[]

  @@map("campaigns")
}

// Contact = person in AIDA funnel; always has a funnel stage
model Contact {
  id           String       @id @default(cuid())
  firstName    String?
  lastName     String?
  name         String?
  email        String?
  phone        String?
  funnelStage  FunnelStage   @default(AWARENESS)  // required; AIDA position
  campaignId   String?      // source campaign (utm-style)
  leadSource   LeadSource?
  referralFrom String?
  companyId    String?
  userId       String
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  company   Company?   @relation(fields: [companyId], references: [id], onDelete: SetNull)
  campaign  Campaign?  @relation(fields: [campaignId], references: [id], onDelete: SetNull)
  deals     Deal[]
  tasks     Task[]
  activities Activity[]

  @@map("contacts")
}

// Deal: links to Contact + Company (unchanged conceptually)
model Deal {
  id        String   @id @default(cuid())
  title     String
  value     Decimal  @db.Decimal(12, 2) @default(0)
  stage     DealStage @default(INITIATING)
  companyId String?
  contactId String?   // was personId
  userId    String
  closedAt  DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  company  Company?  @relation(fields: [companyId], references: [id], onDelete: SetNull)
  contact  Contact?  @relation(fields: [contactId], references: [id], onDelete: SetNull)
  tasks    Task[]
  activities Activity[]

  @@map("deals")
}

// Task: linked to Contact and/or Deal (at least one in app logic)
model Task {
  id          String     @id @default(cuid())
  title       String
  status      TaskStatus @default(PENDING)
  dueAt       DateTime?
  completedAt DateTime?
  contactId   String?
  dealId      String?
  userId      String
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  contact Contact? @relation(fields: [contactId], references: [id], onDelete: Cascade)
  deal    Deal?    @relation(fields: [dealId], references: [id], onDelete: Cascade)

  @@map("tasks")
}

// Activity: type = email | call | note; linked to Contact and/or Deal
model Activity {
  id          String       @id @default(cuid())
  type        ActivityType // EMAIL | CALL | NOTE
  description String?      @db.Text
  occurredAt  DateTime     @default(now())
  contactId   String?
  dealId      String?
  userId      String
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  contact Contact? @relation(fields: [contactId], references: [id], onDelete: Cascade)
  deal    Deal?    @relation(fields: [dealId], references: [id], onDelete: Cascade)

  @@map("activities")
}
```

**Justifications (schema):**

- **Contact + FunnelStage** — Every contact is in exactly one AIDA stage; required `funnelStage` keeps pipeline views and reporting simple.
- **Campaign** — Optional `campaignId` on Contact supports “where did this contact come from?” (landing pages, ads, webinars) and UTM-style reporting.
- **Task/Activity on Contact or Deal** — Tasks and activities can be “about a contact” or “about a deal”; both optional FKs with “at least one” enforced in app logic keeps the schema flexible (e.g. “call this contact” vs “send proposal for this deal”).
- **ActivityType enum** — Replaces string `type` for consistent filtering and reporting (email/call/note).
- **TaskStatus enum** — Clear lifecycle (pending/completed/cancelled) for lists and filters; can be synced with `completedAt` in app code.

---

## 4. Folder structure (App Router)

Keep the dashboard layout and add AIDA-oriented routes and shared modules:

```
src/
  app/
    (dashboard)/
      layout.tsx              # sidebar + main (existing)
      page.tsx                # dashboard home (funnel + deals + tasks)
      contacts/               # AIDA pipeline + list
        page.tsx              # list/filter by FunnelStage
        [id]/
          page.tsx            # contact detail + activities/tasks
      companies/
        page.tsx
        [id]/
          page.tsx
      deals/
        page.tsx
        [id]/
          page.tsx
      tasks/
        page.tsx
      campaigns/
        page.tsx              # list/create campaigns (sources)
        [id]/
          page.tsx
      settings/
        page.tsx
    (auth)/
      sign-in/[[...sign-in]]/page.tsx
      sign-up/[[...sign-up]]/page.tsx
    layout.tsx
    globals.css
  components/
    layout/
      Sidebar.tsx
      ...
    ui/                       # shadcn
    contacts/                 # contact-specific (e.g. FunnelStageBadge, ContactCard)
    deals/
    campaigns/
  lib/
    db.ts
    auth.ts
  server/
    contacts/                 # server actions or API helpers for contacts
    deals/
    campaigns/
  types/
    contact.ts
    deal.ts
```

**Justifications (folders):**

- **`contacts/`** — Replaces “leads” as the main pipeline; list and detail by AIDA stage. “Leads” can redirect to contacts filtered by early stages if you want to keep the word.
- **`campaigns/`** — Dedicated section to create and list campaigns; contact forms can select a campaign as source.
- **`contacts/[id]`** — Contact-centric view: profile, stage, linked deals, tasks, activities (email/call/note).
- **`server/`** — Keeps server actions and data access by domain (contacts, deals, campaigns) instead of scattering under each route.
- **`types/`** — Shared TS types for Contact, Deal, Campaign, FunnelStage, etc., used by server and UI.

---

## 5. Migration from current schema

- **persons → contacts** — Rename table and add `funnel_stage` (default `AWARENESS`), `campaign_id`; backfill stage from current `status` if desired (e.g. LEAD→AWARENESS/INTEREST, PROSPECT→DESIRE, CUSTOMER→ACTION).
- **Deal** — Rename `personId` → `contactId` (FK to contacts).
- **Task** — Add `dealId` (optional); keep `personId` then rename to `contactId` when persons becomes contacts; add `status` if you introduce `TaskStatus`.
- **Activity** — Add `dealId` (optional); rename `personId` → `contactId`; add `ActivityType` enum and backfill from existing `type` string.
- **Campaign** — New table; no backfill required.
- **Leads/Customers pages** — Can become “Contacts” filtered by `funnelStage`, or keep “Leads” as a view of AWARENESS+INTEREST and “Customers” as ACTION (or post-sale).

---

## 6. Summary

| Deliverable   | Content |
|--------------|--------|
| **Schema**   | Contact (required FunnelStage, optional Campaign); Deal (Contact + Company); Task & Activity (Contact and/or Deal); enums FunnelStage, ActivityType, TaskStatus; Campaign model. |
| **Folders** | `app/(dashboard)/contacts`, `contacts/[id]`, `campaigns`, `campaigns/[id]`; `server/contacts|deals|campaigns`; `types/`. |
| **Enums**   | FunnelStage (AIDA), ActivityType (EMAIL/CALL/NOTE), TaskStatus (PENDING/COMPLETED/CANCELLED); keep DealStage as-is. |

---

## 7. Files created in this repo

- **`prisma/schema-aida.prisma`** — Full AIDA schema (Contact, Campaign, FunnelStage, TaskStatus, ActivityType, Deal.contactId, Task/Activity on Contact and/or Deal). Use as the target when migrating; replace `schema.prisma` with this (or merge in steps) and run migrations.
- **`docs/AIDA-DATA-MODEL.md`** — This document.

### Phase 1 (additive, no renames)

To adopt AIDA without breaking existing code, you can add to your **current** `schema.prisma` only:

1. **New enums:** `FunnelStage`, `ActivityType`, `TaskStatus`.
2. **New model:** `Campaign` (id, name, utmSource, utmMedium, utmCampaign, userId, timestamps).
3. **On Person:** `funnelStage FunnelStage @default(AWARENESS)`, `campaignId String?`, and relation `campaign Campaign?`.
4. **New route:** `app/(dashboard)/campaigns/` (list + create).

Keep using `Person`, `personId`, and existing Deal/Task/Activity shapes until you are ready to rename to Contact and add Deal-scoped tasks/activities. Then switch to `schema-aida.prisma` and run a single migration (or Supabase SQL) to rename tables/columns and add new columns.

---

If you want, next step can be: (1) apply Phase 1 to your existing `prisma/schema.prisma` (and add a migration or SQL script for Supabase), and (2) add the new routes and minimal pages for `contacts` and `campaigns` without removing your current leads/companies/deals/tasks pages.
