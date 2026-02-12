# Connect your own email (Gmail) for 1:1 sending

The CRM sends automation and nurture emails **from the user's own Gmail**, not from a marketing/transactional provider. Each user connects their Gmail via OAuth; sending goes through Gmail API so replies stay in their inbox.

## What you need

1. **Database**: Tables `user_email_accounts` and `emails` (from Prisma schema). Run `npx prisma db push` or your migration so these exist.
2. **Google Cloud project** with Gmail API and OAuth consent configured.
3. **Environment variables** (see below).

## Google Cloud setup (step-by-step)

You’ve already **enabled Gmail API**. Do the following next.

---

### Step 1: Open the OAuth consent screen

1. In [Google Cloud Console](https://console.cloud.google.com/), make sure your project is selected (top bar, next to “Google Cloud”).
2. Click the **☰** (hamburger) menu at the top left.
3. Go to **APIs & Services** → **OAuth consent screen** (under “APIs & Services” in the left sidebar).

---

### Step 2: Choose user type

1. If you see **User type** with two options:
   - **Internal** = only people in your Google Workspace org. Pick this if your app is only for your company.
   - **External** = any Google user (e.g. your customers). Pick this for a normal SaaS app.
2. Click **Create** (or **Continue** if you’ve already set this before).

---

### Step 3: Fill in App information (OAuth consent screen)

1. **App name**: e.g. `The BELL CRM` (or your product name). This is what users see when they “Sign in with Google”.
2. **User support email**: Choose your email from the dropdown (e.g. your Gmail or work email).
3. **App logo**: optional; you can skip.
4. **App domain**: optional for testing; you can leave blank.
5. **Developer contact information**: your email (required). Used if Google needs to contact you.
6. Click **Save and Continue**.

---

### Step 4: Add scopes

**Where to do this:** Depends on which Google UI you see.

- **New “Google Auth Platform” UI** (left sidebar: Overview, Branding, Audience, Clients, **Data access**, …): Click **Data access** in the left sidebar. On that page, add the two scopes (e.g. via “Add scope” or by selecting the Gmail API and User Info APIs and choosing `gmail.send` and `userinfo.email`). Save.
- **Classic “APIs & Services → OAuth consent screen” UI**: You add scopes on the **Scopes** step of the consent screen wizard (see below).

**If using the classic UI:**

1. **Get to the Scopes step**
   - If you’re still in the wizard (after filling App information and clicking **Save and Continue**), you should already be on the **Scopes** step.
   - If you’re on the main **OAuth consent screen** overview page instead, click **EDIT APP** (top right or in the middle of the page). Then click **Save and Continue** on **User type** and again on **App information** until you reach the **Scopes** step.

2. **Open the scope picker**
   - On the **Scopes** step you’ll see a section like “Scopes for Google APIs” or “Non-sensitive scopes”.
   - Look for a blue or gray **button/link** that says **Add or remove scopes** or **ADD OR REMOVE SCOPES**. It’s usually in the middle of that section.
   - Click it. A **side panel** or **popup** opens with a long list of APIs and a **search/filter** box at the top.

3. **Add the two scopes**
   - In the **filter/search** box at the top of the panel, type: `gmail.send`
   - In the list, find the scope whose URL ends with **`/auth/gmail.send`** (description like “Send email on your behalf”). **Check the box** next to it.
   - Clear the search box and type: `userinfo.email`
   - Find the scope **`/auth/userinfo.email`** (description like “See your primary Google Account email address”). **Check the box** next to it.

4. **Confirm and continue**
   - At the **bottom of the panel**, click **Update** (or **Done**).
   - Back on the Scopes step, click **Save and Continue**.

---

### Step 5: Add test users (if your app is “Testing”)

1. If the consent screen is in **Testing** mode, you’ll see **Test users**.
2. Click **+ Add users**.
3. Add the Gmail address(es) that will use “Connect Gmail” in your app (e.g. your own). One per line.
4. Click **Add** then **Save and Continue**.
5. You can click through any remaining steps (e.g. Summary) with **Back to Dashboard** or **Save and Continue** until you’re back to the OAuth consent screen.

---

### Step 6: Create OAuth client credentials – what to put in the URIs

You’re on **Create OAuth client ID** (Application type: Web application, Name: e.g. TheBellCRM). The page has two URI sections. Fill **both** like this.

**1. Authorised JavaScript origins** (for use with requests from a browser)

- Click **+ Add URI** in that section.
- In the box that appears, type **exactly** (use your real app domain, no trailing slash):
  ```
  https://app.thebellcrm.eu
  ```
- That’s one origin: your app’s root URL, nothing after the domain.

**2. Authorised redirect URIs** (for use with requests from a web server)

- Click **+ Add URI** in that section.
- In the box that appears, type **exactly** (same domain, path must be exactly this):
  ```
  https://app.thebellcrm.eu/api/email/connect/google/callback
  ```
- This is where Google sends the user after they approve “Connect Gmail”. The path must end with `/api/email/connect/google/callback`.

**3. Create the client**

- Click the blue **Create** button at the bottom.
- A popup will show your **Client ID** and **Client secret** – copy both (Step 7).

---

### Step 7: Copy Client ID and Client secret

1. A popup shows your **Client ID** and **Client secret**.
2. Copy **Client ID** (looks like `xxxxx.apps.googleusercontent.com`).
3. Copy **Client secret** (shorter string).
4. Put them in your `.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (see below). You can close the popup; you can also view the secret again later under **Credentials** → click the OAuth 2.0 Client ID you just created.

## Environment variables

Add to `.env` and to your host (e.g. Vercel):

```bash
# Google OAuth for "Connect Gmail" (1:1 sending)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

Set `NEXT_PUBLIC_APP_URL` to your production URL (e.g. `https://app.thebellcrm.eu`) so the OAuth callback URL is correct. Do not use `localhost` if you only run in production.

## How it works

- **Settings → Your email (1:1 sending)**: User clicks **Connect Gmail**, signs in with Google, and authorizes the app. The app stores an access token and refresh token in `user_email_accounts`.
- **Automations**: When a recipe runs a “send email” action, the app uses that user’s connected Gmail (if any) and sends via Gmail API. If no account is connected, the send is logged only (stub).
- **Disconnect**: User can click **Disconnect** in Settings to remove the connection.

## Outlook (Microsoft 365)

Planned: same pattern with Microsoft OAuth and Graph API for send (and later receive). Not implemented yet.
