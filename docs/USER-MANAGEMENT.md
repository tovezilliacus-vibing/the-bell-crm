# User management and administrators

## Overview

- **Workspace members** have a role: **ADMIN** or **MEMBER**.
- **Admin** can:
  - Manage the account (Settings)
  - Invite new users (within the plan’s user limit)
  - Set **Prospect key metrics** (industry, size turnover, size personnel) in Settings
- **Member** can use the app (contacts, deals, tasks, forms, etc.) but cannot invite users or edit prospect key metrics.
- When someone buys a plan with more than one user (e.g. **Starter**, 2–10 users), one account is the **administrator**; they invite the rest.

## Database: roles and invites

1. Run the workspace-roles migration in Supabase (if you haven’t already):
   - **Script:** `prisma/supabase-workspace-roles.sql`
   - This adds the `WorkspaceRole` enum, a `role` column on `workspace_members`, and the `workspace_invites` table.

2. **Backfill existing members as admins** (so current users keep full access). In Supabase SQL Editor, run once:
   ```sql
   UPDATE workspace_members SET role = 'ADMIN';
   ```

## Testing: make “Joe Doe” an admin for a Starter workspace

Use this to turn a test user (e.g. Joe Doe) into an admin for a workspace that has a Starter plan.

### 1. Find Joe Doe’s Clerk user ID and the workspace

- **Option A – Clerk Dashboard**  
  In [Clerk Dashboard](https://dashboard.clerk.com) → Users, open the user “Joe Doe” and copy their **User ID** (e.g. `user_2abc...`).

- **Option B – From your app**  
  If Joe Doe is already in the app, you can log in as them (or use a small debug route) and read `userId` from the session. Otherwise use Clerk Dashboard.

- **Workspace ID**  
  In Supabase SQL Editor:
  ```sql
  SELECT w.id, w.name, w.plan, m."userId", m.role
  FROM workspaces w
  JOIN workspace_members m ON m."workspaceId" = w.id
  ORDER BY w."createdAt" DESC;
  ```
  Find the workspace that should be “the company with Starter license” and note its `id` and the `userId` that should become admin (e.g. Joe Doe’s).

### 2. Set the workspace plan to Starter (if needed)

```sql
UPDATE workspaces
SET plan = 'STARTER'
WHERE id = '<WORKSPACE_ID>';
```

Replace `<WORKSPACE_ID>` with the workspace id from step 1.

### 3. Make Joe Doe an admin of that workspace

```sql
UPDATE workspace_members
SET role = 'ADMIN'
WHERE "workspaceId" = '<WORKSPACE_ID>'
  AND "userId" = '<JOE_DOE_CLERK_USER_ID>';
```

Replace:
- `<WORKSPACE_ID>` with the workspace id.
- `<JOE_DOE_CLERK_USER_ID>` with Joe Doe’s Clerk user ID (e.g. `user_2abc...`).

If Joe Doe is not yet a member of that workspace, add them first:

```sql
INSERT INTO workspace_members (id, "workspaceId", "userId", role, "createdAt")
VALUES (
  gen_random_uuid()::text,
  '<WORKSPACE_ID>',
  '<JOE_DOE_CLERK_USER_ID>',
  'ADMIN',
  now()
)
ON CONFLICT ("workspaceId", "userId") DO UPDATE SET role = 'ADMIN';
```

### 4. Verify

- Log in as Joe Doe and open **Settings**.
- You should see:
  - **Team** (members list and “Invite by email”).
  - **Prospect key metrics** (editable).
- Other users in the same workspace with role `MEMBER` should not see the Team section and should see “Only an administrator can edit prospect key metrics” for Prospect key metrics.

## Invite flow

- An **admin** goes to Settings → **Team** and enters an email, then **Send invite**.
- The invite is stored in `workspace_invites` (and counts toward the plan’s user limit).
- When that person **signs up** with the same email and hits the app, `ensureWorkspaceForUser` finds the invite, adds them as a **member** to the workspace, and deletes the invite.
- No email is sent yet; you can later plug in an email provider to send a “You’re invited to …” link.
