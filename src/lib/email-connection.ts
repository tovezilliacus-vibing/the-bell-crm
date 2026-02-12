/**
 * Connected mailbox (Gmail / Outlook) for 1:1 sales email.
 * Users connect their own email via OAuth; we send (and later receive) through their account.
 */

import { google } from "googleapis";
import { prisma } from "@/lib/db";

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

export type ConnectedAccount = {
  id: string;
  provider: string;
  email: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
};

/** Get the user's connected email account (Gmail or first available). */
export async function getConnectedEmailAccount(userId: string): Promise<ConnectedAccount | null> {
  const account = await prisma.userEmailAccount.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  if (!account) return null;
  return {
    id: account.id,
    provider: account.provider,
    email: account.email,
    accessToken: account.accessToken,
    refreshToken: account.refreshToken,
    expiresAt: account.expiresAt,
  };
}

/** Create OAuth2 client for Google (for generating auth URL or exchanging code). */
function getGoogleOAuth2Client(redirectUri: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set");
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/** Get the URL to send the user to for Google OAuth consent. */
export function getGoogleAuthUrl(redirectUri: string): string {
  const oauth2 = getGoogleOAuth2Client(redirectUri);
  return oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GMAIL_SCOPES,
  });
}

/** Exchange Google auth code for tokens and return tokens + user email. */
export async function exchangeGoogleCode(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken: string | null; expiresAt: Date | null; email: string }> {
  const oauth2 = getGoogleOAuth2Client(redirectUri);
  const { tokens } = await oauth2.getToken(code);
  if (!tokens.access_token) throw new Error("No access token from Google");

  oauth2.setCredentials(tokens);
  const oauth2Client = google.oauth2({ version: "v2", auth: oauth2 });
  const { data } = await oauth2Client.userinfo.get();
  const email = (data.email ?? "").trim() || "unknown";

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? null,
    expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    email,
  };
}

/** Refresh Gmail tokens and update DB. */
async function refreshGmailTokens(account: ConnectedAccount): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret || !account.refreshToken)
    throw new Error("Missing Google config or refresh token");

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: account.refreshToken });
  const { credentials } = await oauth2.refreshAccessToken();
  if (!credentials.access_token) throw new Error("Failed to refresh Google token");

  await prisma.userEmailAccount.update({
    where: { id: account.id },
    data: {
      accessToken: credentials.access_token,
      expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
    },
  });
  return credentials.access_token;
}

/** Get authenticated Gmail client (refreshes token if needed). */
async function getGmailClient(account: ConnectedAccount): Promise<ReturnType<typeof google.gmail>> {
  let accessToken = account.accessToken;
  const expiresAt = account.expiresAt;
  if (expiresAt && new Date(expiresAt).getTime() - Date.now() < 60_000) {
    accessToken = await refreshGmailTokens(account);
  }
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth: oauth2 });
}

/** Parse "Name <email@x.com>" or "email@x.com" to { email, name }. */
function parseAddress(header: string): { email: string; name?: string } {
  const trimmed = header.trim();
  const match = trimmed.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    return { email: match[2].trim().toLowerCase(), name: match[1].trim() || undefined };
  }
  return { email: trimmed.toLowerCase() };
}

/** Extract plain text from Gmail message payload (body or parts). */
function getTextFromPayload(payload: unknown): string {
  const p = payload as { body?: { data?: string | null }; parts?: Array<{ mimeType?: string | null; body?: { data?: string | null } }> };
  const bodyData = p?.body?.data;
  if (bodyData) {
    try {
      return Buffer.from(bodyData, "base64url").toString("utf-8");
    } catch {
      return "";
    }
  }
  if (p?.parts?.length) {
    const textPart = p.parts.find((part) => part.mimeType === "text/plain" || part.mimeType === "text/html");
    const partData = textPart?.body?.data;
    if (partData) {
      try {
        return Buffer.from(partData, "base64url").toString("utf-8");
      } catch {
        // ignore
      }
    }
  }
  return "";
}

export type IncomingGmailMessage = {
  id: string;
  threadId: string;
  fromAddress: string;
  fromName?: string;
  toAddresses: string;
  subject: string;
  bodySnippet: string;
  body: string;
  sentAt: Date;
};

/** Fetch incoming inbox messages from Gmail (for sync). Max 100, optionally after since. */
export async function fetchIncomingGmail(
  account: ConnectedAccount,
  options: { since?: Date; maxResults?: number } = {}
): Promise<IncomingGmailMessage[]> {
  const gmail = await getGmailClient(account);
  const maxResults = Math.min(options.maxResults ?? 50, 100);
  let q = "in:inbox";
  if (options.since) {
    const sec = Math.floor(options.since.getTime() / 1000);
    q += ` after:${sec}`;
  }
  const listRes = await gmail.users.messages.list({
    userId: "me",
    q,
    maxResults,
  });
  const messages = listRes.data.messages ?? [];
  const result: IncomingGmailMessage[] = [];
  for (const msg of messages) {
    try {
      const full = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
        format: "full",
      });
      const payload = full.data.payload!;
      const headers = payload.headers ?? [];
      const getH = (name: string) => headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
      const fromHeader = getH("From");
      const { email: fromAddress, name: fromName } = parseAddress(fromHeader || "");
      const toAddresses = getH("To");
      const subject = getH("Subject");
      const bodyRaw = getTextFromPayload(payload);
      const bodySnippet = bodyRaw.slice(0, 500).replace(/\s+/g, " ").trim();
      const internalDate = full.data.internalDate ? new Date(Number(full.data.internalDate)) : new Date();
      result.push({
        id: full.data.id!,
        threadId: full.data.threadId ?? "",
        fromAddress,
        fromName: fromName || undefined,
        toAddresses,
        subject,
        bodySnippet,
        body: bodyRaw,
        sentAt: internalDate,
      });
    } catch (e) {
      console.warn("[Gmail] skip message", msg.id, e);
    }
  }
  return result;
}

/** Send an email via the user's connected Gmail. */
export async function sendViaGmail(
  account: ConnectedAccount,
  params: { to: string; subject: string; body: string; fromEmail?: string }
): Promise<{ ok: boolean; error?: string }> {
  try {
    const gmail = await getGmailClient(account);

    const from = params.fromEmail ?? account.email;
    const message = [
      `From: ${from}`,
      `To: ${params.to}`,
      `Subject: ${params.subject}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      params.body,
    ].join("\r\n");

    const encoded = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encoded },
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gmail send failed";
    return { ok: false, error: message };
  }
}
