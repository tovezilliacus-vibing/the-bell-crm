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

If you’ve run all the Supabase scripts and pages (or Settings) still fail:

1. **Confirm the right database**  
   In Vercel, check that `DATABASE_URL` for Production is the **connection string for the Supabase project** where you ran the scripts (not a different env or local DB).

2. **Check Vercel logs**  
   Vercel → Project → Logs (or Functions). Reproduce the error, then search for `ensureWorkspaceForUser failed`, `load failed`, or the request’s digest. The log line will show the real error (e.g. relation "x" does not exist, or column "y" does not exist).

3. **Inspect production schema**  
   In Supabase → SQL Editor, run `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;` to list tables. Ensure `workspaces`, `workspace_members`, `contacts`, `companies`, `prospect_field_options`, `forms`, `automation_recipe_settings`, etc. exist. If any table or column is missing, run the corresponding script again or fix the schema to match Prisma.
