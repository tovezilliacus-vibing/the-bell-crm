# Customer email connection & 2-way email

This doc describes what it takes to let customers connect their own email to the CRM and support **2-way email** (send from the CRM and receive/reply in the CRM).

---

## What “connect their own email” can mean

1. **Transactional sending (e.g. Resend, SendGrid)**  
   The customer adds an API key. The CRM sends emails (automations, “email this contact”) **from an address they configure** (e.g. `hello@customercompany.com` via their domain in Resend).  
   - **Send**: Yes.  
   - **Receive**: Only if the provider supports **inbound webhooks** and you ingest them (see below).

2. **Connected mailbox (Gmail, Outlook via OAuth)**  
   The customer signs in with Google/Microsoft. The CRM can **send** from their mailbox and **read** their inbox (or a folder) to show threads and replies in the contact timeline.  
   - **Send**: Yes (Gmail API / Microsoft Graph).  
   - **Receive**: Yes (same APIs to fetch messages and match to contacts).

3. **SMTP/IMAP (legacy)**  
   Customer provides SMTP (send) and IMAP (receive) credentials. Works with any provider but is less secure and not ideal for Gmail/Outlook (prefer OAuth).

---

## What “2-way email” means here

- **Outbound**: The CRM sends emails (automation, manual “Email contact”) and they appear in the contact’s email timeline; sent from the customer’s chosen address or connected mailbox.
- **Inbound**: When someone replies (or sends a new email that we can associate to a contact), the CRM **receives** that message (via webhook or mailbox sync) and **attaches it to the right contact** and shows it in the timeline.

So “2-way” = send + receive, with both sides visible in the CRM and tied to contacts.

---

## Option A: Transactional provider (Resend, SendGrid, etc.) + inbound webhook

**Good for:** Simple setup, one API key, reliable delivery, good for automations and “send from your domain”.

### Send path

- **Storage**: Store per workspace (or per user) “email connection”:
  - `provider`: `"resend"` | `"sendgrid"` | etc.
  - `apiKey` (encrypted or in env-backed secret).
  - Optional: `fromEmail`, `fromName` (or use provider default).
- **Code**: Replace the stub in `src/lib/automation/email-service.ts` (and any future “Email contact” action) with a call to the provider’s API using the workspace’s (or user’s) credentials.
- **UI**: Settings → Email & automations: form to select provider and paste API key, optional from address.

### Receive path (2-way)

- **Provider feature**: Resend (and others) support **inbound email**: you get a dedicated address (e.g. `replies@yourdomain.com` or `inbound.resend.dev`) and they POST to your webhook when an email is received.
- **Your backend**:
  - **API route**: e.g. `POST /api/email/inbound` (or provider-specific path). Verify webhook signature, parse body (from, to, subject, body, thread id if present).
  - **Matching**: Match to a **contact** by `from` (or `to`) email; create or update an `Email` record linked to that `contactId`, `direction: "inbound"`.
  - **Threading**: Use `Message-Id` / `In-Reply-To` / `References` to group into threads; optional `threadId` on `Email` for UI.
- **Schema**: Your existing `Email` model (or equivalent) can store inbound as well; ensure `contactId`, `direction`, `fromAddress`, `toAddresses`, `body`, `sentAt` (receivedAt) are set. Add `workspaceId` if you scope emails by workspace.
- **UI**: Contact detail → “Email” tab or timeline: list emails (sent + received) for that contact.

**Scope**: Workspace-level “one sending identity per workspace” is simple; or one connection per user if each user has their own Resend key.

---

## Option B: Connected mailbox (Gmail / Outlook OAuth)

**Good for:** True “their own email”: send and receive from the same inbox they use every day; replies land in their real mailbox and can be synced into the CRM.

### Send path

- **OAuth**: User clicks “Connect Gmail” (or Outlook) in Settings; you use Google/Microsoft OAuth, store `accessToken`, `refreshToken`, `expiresAt` in `UserEmailAccount` (or a new `WorkspaceEmailConnection` if you prefer workspace-level).
- **Send**: For Gmail: Gmail API “send message”; for Outlook: Graph API “send mail”. Use the token for that user (or workspace’s connected user).
- **From address**: The connected mailbox’s email (e.g. `joe@company.com`).

### Receive path (2-way)

- **Sync**: Periodically (cron or background job) or on a schedule:
  - **Gmail**: Gmail API list messages (e.g. inbox or label), fetch body, map `from`/`to` to contacts.
  - **Outlook**: Graph API list messages in Inbox (or folder), same idea.
- **Matching**: Match message `from` or `to` to `Contact.email` (and optionally `workspaceId`). Create `Email` rows with `direction: "inbound"` (or `"outbound"` for sends you did via the CRM).
- **Threading**: Use provider `threadId` (Gmail) or ConversationId (Graph) to group messages.
- **Idempotency**: Use provider message id (e.g. Gmail `id`) in `Email.providerMessageId` to avoid duplicates (you already have a unique on this).

**Existing schema**: `UserEmailAccount` and `Email` fit this: one account per user per provider, emails linked to `contactId`. Add `workspaceId` to `Email` if you need to scope by workspace.

---

## What to build (minimal 2-way with Option A)

A practical first step is **Option A** (Resend or similar) so customers can connect **one sending identity** and get **real sends** plus a path to **inbound**:

1. **Workspace email connection (DB)**  
   - Table (or key-value) per workspace: `provider`, `apiKey` (or reference to secret), optional `fromEmail`/`fromName`.  
   - Or: reuse/expand a “workspace settings” or “integration” table.

2. **Settings UI**  
   - Under “Email & automations”: “Connect email provider” → choose Resend → paste API key, optional from address → Save.  
   - Show status: “Connected as …” or “Not connected”.

3. **Send path**  
   - `email-service.ts`: if workspace has a Resend (or other) connection, call provider API; else fall back to current stub (log only).  
   - Automations and future “Email contact” use this.

4. **Inbound (2-way)**  
   - **Resend**: Enable “Inbound” in Resend, set webhook URL to `https://your-app.com/api/email/inbound` (or similar).  
   - **API route**: Parse webhook payload, find contact by sender/recipient email, insert `Email` with `direction: "inbound"`.  
   - **Contact UI**: Contact detail page shows sent + received emails (from `Email` where `contactId` = current contact).

5. **Optional**  
   - Store `workspaceId` on `Email` if not already present, so all emails are scoped to the workspace.  
   - Simple “Email contact” action from contact detail (compose form → call same send path).

---

## What to build (Option B – Gmail/Outlook)

- **OAuth**: Add Google and Microsoft OAuth apps; “Connect Gmail” / “Connect Outlook” in Settings; store tokens in `UserEmailAccount` (or workspace equivalent).
- **Send**: One service that uses Gmail API or Graph API depending on provider.
- **Receive**: Cron/job that for each connected account fetches recent messages, matches to contacts by email, inserts `Email` rows; respect rate limits and use incremental sync (e.g. history or delta) where possible.
- **UI**: Same as above: contact timeline of sent + received emails.

---

## Recommendation

- **Short term**: Implement **Option A** (Resend first): workspace-level API key in Settings, wire send path, then add inbound webhook + contact email timeline. That gives customers “connect their own email” (their domain/API key) and real 2-way once inbound is configured.
- **Later**: Add **Option B** (Gmail/Outlook OAuth) for users who want to use their existing mailbox as the sending/receiving identity and have replies synced from their real inbox.

---

## Summary table

| Approach              | Send              | Receive                    | Customer setup           |
|-----------------------|-------------------|----------------------------|--------------------------|
| Resend + inbound      | API key, from addr| Webhook → your API         | API key + domain in Resend |
| Gmail/Outlook OAuth   | OAuth token       | Sync via Gmail/Graph API   | “Connect Gmail” button   |
| SMTP/IMAP             | SMTP credentials | IMAP poll                  | Host, user, password     |

All of these can feed the same `Email` model and contact timeline; the only difference is how you **get** credentials (API key vs OAuth vs SMTP/IMAP) and how you **receive** (webhook vs API poll).
