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

## Marketing landing page

Right now, visiting the root URL while logged out redirects to sign-in. When you add a marketing landing page, make the root path public in `src/middleware.ts` (e.g. add `"/"` to the public routes or only protect routes under `/dashboard` or similar) and render the landing page at the root.
