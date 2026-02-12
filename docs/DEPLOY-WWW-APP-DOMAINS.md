# www vs app domains (Vercel)

- **www.thebellcrm.eu** → landing page only. “Get started” and “Sign in” link to the app.
- **app.thebellcrm.eu** → the CRM app (sign-in, dashboard, settings, Connect Gmail, etc.).

## What the code does

- **Middleware** (`src/middleware.ts`): If the request host is `www.thebellcrm.eu`, the root path `/` is rewritten to the landing page; any other path (e.g. `/sign-in`) redirects to `app.thebellcrm.eu`. On `app.thebellcrm.eu` (or localhost), the app and auth run as usual.
- **Landing page** (`src/app/landing/page.tsx`): Simple marketing page with links to `NEXT_PUBLIC_APP_URL/sign-up` and `NEXT_PUBLIC_APP_URL/sign-in`.
- **OAuth and invite emails** use `NEXT_PUBLIC_APP_URL` (must be `https://app.thebellcrm.eu`) so redirects and links point to the app.

## Vercel

1. **Domains**
   - In the Vercel project: **Settings → Domains**.
   - Add **www.thebellcrm.eu** and **app.thebellcrm.eu** (and thebellcrm.eu if you want the apex to redirect).
   - Both domains should point to the **same** Vercel project (this repo).

2. **Environment variables** (Settings → Environment variables)
   - `NEXT_PUBLIC_APP_URL` = **https://app.thebellcrm.eu** (no trailing slash).  
     Used for OAuth redirects, invite emails, and landing-page links. Must be the app domain.
   - Keep your existing vars: Clerk keys, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DATABASE_URL`, etc.

3. **Redeploy**
   - After adding or changing domains or env vars, trigger a new deployment (e.g. push to git or “Redeploy” in Vercel).

4. **DNS**
   - At your DNS provider, point **www** and **app** to Vercel (CNAME to `cname.vercel-dns.com` or the value Vercel shows). Vercel will serve the same deployment for both; the middleware chooses landing vs app by host.

## Supabase

No changes needed for www vs app. Supabase is used only as the database; domain routing is handled in the Next.js app on Vercel.

## Clerk

- Sign-in and sign-up URLs are relative (`/sign-in`, `/sign-up`), so they run on whichever domain the user is on. On the landing (www) we redirect those paths to app, so users always sign in on **app.thebellcrm.eu**. No Clerk config change required if `NEXT_PUBLIC_APP_URL` is set as above.
