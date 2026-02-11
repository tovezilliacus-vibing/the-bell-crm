# Deployment (Vercel + Clerk + Supabase)

## Keep sign-in on your domain

To avoid redirecting users to Clerk’s Account Portal (e.g. `https://accounts.thebellcrm.eu/sign-in`) and to respect your app’s light/dark theme:

1. **Set these in Vercel** (Project → Settings → Environment Variables) for **Production** (and Preview if you want):

   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL` = `/sign-in`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_URL` = `/sign-up`
   - `CLERK_SIGN_IN_URL` = `/sign-in`
   - `CLERK_SIGN_UP_URL` = `/sign-up`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` = `/`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` = `/`

2. **Redeploy** after changing env vars.

After that, unauthenticated users will be sent to `https://www.thebellcrm.eu/sign-in` (your app) instead of `accounts.thebellcrm.eu`, and the app’s theme will follow the browser/OS setting.

## Clerk Dashboard (production instance)

If you use a custom Account Portal domain (e.g. `accounts.thebellcrm.eu`), you can leave it as is. With the env vars above, the app will still use your own `/sign-in` and `/sign-up` pages. To change the theme on Clerk’s hosted pages (if you ever use them), use Clerk Dashboard → Customize → Theme and set it to “System” or “Light” as needed.

## Supabase production database (fix “Page unavailable”)

If **all** dashboard pages show “Page unavailable” (or “We couldn’t load …”), the app is hitting the database but tables or columns are missing in **production** Supabase. Run these SQL scripts in the **Supabase SQL Editor** for your **production** project, in this order:

1. **Core schema** (if the DB was created from scratch): `prisma/supabase-init.sql` or your main migration.
2. **Workspace & billing** (required for Dashboard, Contacts, Tasks, etc.):  
   `prisma/supabase-workspace-billing.sql`
3. **Verify workspace columns** on existing tables:  
   `prisma/supabase-verify-workspace-columns.sql`
4. **Contact stage history** (for Funnel conversion metrics):  
   `prisma/supabase-contact-stage-history.sql`
5. **Forms**: `prisma/supabase-forms.sql`
6. **Automation**: `prisma/supabase-automation-recipe-settings.sql`
7. **Prospect field options** (for Settings prospect metrics): `prisma/supabase-lead-fields.sql`

After running the scripts, redeploy or refresh the app. To see the **exact** error (e.g. missing table name), check **Vercel → your project → Logs** (or **Functions**) and look for `[Dashboard] ensureWorkspaceForUser failed:` or `[Settings] load failed:` etc.

## Fix `PrismaClientInitializationError` (Dashboard / Settings “unavailable”)

If Vercel logs show **`PrismaClientInitializationError`** (e.g. for `workspaceMember` or `prospectFieldOption`) and `DATABASE_URL` is correct, the cause is usually **how** Prisma connects to Supabase in serverless, not missing tables.

**Do this:**

1. **Use the connection pooler (Transaction mode), not the direct connection**
   - In **Supabase Dashboard** → **Project Settings** → **Database** → **Connect** → choose **Transaction** (or “Connection pooling” with port **6543**).
   - Copy that URI. It will look like:
     - `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
     - or `postgres://postgres.[PROJECT-REF]:[PASSWORD]@...pooler.supabase.com:6543/postgres`

2. **Append `?pgbouncer=true` to the URL**
   - Supabase’s pooler (Supavisor) works like PgBouncer in transaction mode. Prisma must be told so it doesn’t use prepared statements in a way that breaks.
   - In **Vercel** → **Settings** → **Environment Variables**, set **`DATABASE_URL`** to that pooler URI **with** `?pgbouncer=true` at the end, for example:
     - `postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
   - If the URI already has a query string (e.g. `?foo=bar`), use `&pgbouncer=true` instead of `?pgbouncer=true`.

3. **Redeploy** the project so the new `DATABASE_URL` is used.

After this, the same schema and tables will be used, but Prisma will use the pooler in a compatible way and the initialization error should stop.

## Planned site structure: landing vs app

**Goal:** `thebellcrm.eu` = marketing landing page (public). `app.thebellcrm.eu` = the actual CRM app (sign-in, dashboard, etc.).

**Options when you’re ready:**

1. **Two deployments**  
   - Landing: one Vercel project (or static site) on `thebellcrm.eu`.  
   - App: this Next.js app on `app.thebellcrm.eu`.  
   Configure DNS so `app.thebellcrm.eu` points to the app project.

2. **Single deployment, subdomain routing**  
   - One Vercel project. In middleware, read `req.nextUrl.hostname`: if `app.thebellcrm.eu` run auth and app; if `thebellcrm.eu` serve the landing (e.g. redirect to a `/landing` route or a separate landing app).

3. **Single deployment, path-based (for now)**  
   - Keep app at `/` (or move it under `/app` or `/dashboard`).  
   - Add a public landing at `/` and move the dashboard to e.g. `/dashboard` so unauthenticated users see the landing and authenticated users use `/dashboard/*`.  
   - When you split domains later, point `app.thebellcrm.eu` at the same app; optionally restrict by host so `app.thebellcrm.eu` only serves app routes.

**Background image:** The Lucid-origin background is applied only inside the app (dashboard layout), not on sign-in, sign-up, or the future landing page.

## Marketing landing page

Right now, visiting the root URL while logged out redirects to sign-in. When you add a marketing landing page, make the root path public in `src/middleware.ts` (e.g. add `"/"` to the public routes or only protect routes under `/dashboard` or similar) and render the landing page at the root.

## Still “Page unavailable” after running SQL?

If you’ve run all the Supabase scripts and pages (or Settings) still fail, do the following.

### 1. Confirm Vercel uses the same Supabase project

You need to make sure the app in production talks to the **same** Supabase project where you ran the SQL scripts.

**Get the Supabase connection string (the DB you ran scripts in):**

1. Open [Supabase Dashboard](https://supabase.com/dashboard) and select the project where you ran the scripts.
2. Go to **Project Settings** (gear icon in the sidebar) → **Database**.
3. Under **Connection string**, choose **URI**.
4. Copy the URI. It looks like:  
   `postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`  
   The important part is **`[PROJECT-REF]`** and the **host** (e.g. `aws-0-eu-central-1.pooler.supabase.com`). That identifies the project.

**Check what Vercel is using:**

1. Open [Vercel Dashboard](https://vercel.com) → your project (The Bell CRM).
2. Go to **Settings** → **Environment Variables**.
3. Find **`DATABASE_URL`** (Production). You can click **Reveal** to see the value (or edit to compare).
4. Compare with the Supabase URI:
   - Same **host** (e.g. `…pooler.supabase.com`) and same **project ref** (e.g. `postgres.abcdefgh`) → same project.
   - Different host or different project ref → Vercel is using a **different** database. Update `DATABASE_URL` in Vercel to the Supabase **Production** URI (with the correct password), save, then **redeploy** (Deployments → … on latest → Redeploy).

**If you have multiple Supabase projects:** Use the one where you actually ran the SQL scripts (the one you see in the SQL Editor). That’s the one whose connection string must be in Vercel’s `DATABASE_URL`.

### 2. Find the exact error in Vercel logs

The “Page unavailable” message is generic; the real error is in the server logs.

1. Vercel Dashboard → your project → **Logs** (or **Monitoring** → **Logs**).
2. Trigger the error: in the browser go to e.g. **Settings** or **Dashboard** so the page shows “Page unavailable”.
3. In Vercel Logs, look at the time of that request. Filter by **Function** or search for your domain.
4. Open the log entry for that request. Look for a line containing:
   - `[Settings] load failed:` or  
   - `[Dashboard] ensureWorkspaceForUser failed:` or  
   - `[Contacts] load failed:`  
   (or similar from other pages).
5. The next line (or the same line) usually shows the real error, e.g.:
   - `relation "workspaces" does not exist` → run `supabase-workspace-billing.sql`.
   - `relation "prospect_field_options" does not exist` → run `supabase-lead-fields.sql`.
   - `column "workspaceId" does not exist` → run `supabase-verify-workspace-columns.sql`.

Use that exact message to decide which script to run (or re-run) in the **same** Supabase project you confirmed in step 1.

### 3. Inspect tables in Supabase

In the **same** Supabase project (SQL Editor), run:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

You should see tables such as `workspaces`, `workspace_members`, `contacts`, `companies`, `prospect_field_options`, `forms`, `automation_recipe_settings`, etc. If something is missing, run the corresponding script from the repo again.
