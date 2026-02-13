/**
 * Sync incoming Gmail into CRM: match sender to contact by email, or create new contact.
 */

import { prisma } from "@/lib/db";
import { ensureWorkspaceForUser } from "@/lib/workspace";
import {
  getConnectedEmailAccount,
  fetchIncomingGmail,
  type IncomingGmailMessage,
} from "@/lib/email-connection";

export type SyncResult = {
  ok: boolean;
  error?: string;
  synced?: number;
  createdContacts?: number;
};

/** Find contact by email in workspace (case-insensitive), or create a new contact. Returns contactId. */
async function findOrCreateContact(
  workspaceId: string,
  userId: string,
  email: string,
  name?: string
): Promise<{ contactId: string; created: boolean }> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) throw new Error("Empty email");

  // Match existing contacts by email case-insensitively so app-created contacts (e.g. "Jane@x.com") are found
  const existing = await prisma.contact.findFirst({
    where: {
      workspaceId,
      email: { equals: normalized, mode: "insensitive" },
    },
    select: { id: true },
  });
  if (existing) return { contactId: existing.id, created: false };

  const contact = await prisma.contact.create({
    data: {
      workspaceId,
      userId,
      email: normalized,
      name: name?.trim() || null,
      funnelStage: "AWARENESS",
    },
  });
  return { contactId: contact.id, created: true };
}

/** Sync incoming Gmail for a user: fetch messages, match or create contacts, store emails. */
export async function syncIncomingGmailForUser(userId: string): Promise<SyncResult> {
  const account = await getConnectedEmailAccount(userId);
  if (!account || account.provider !== "gmail") {
    return { ok: false, error: "No Gmail account connected" };
  }

  const workspaceId = await ensureWorkspaceForUser(userId);
  const dbAccount = await prisma.userEmailAccount.findUnique({
    where: { id: account.id },
    select: { lastEmailSyncAt: true },
  });
  const since = dbAccount?.lastEmailSyncAt ?? undefined;
  const sinceDate = since ?? (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  })();

  let messages: IncomingGmailMessage[];
  try {
    messages = await fetchIncomingGmail(account, {
      since: sinceDate,
      maxResults: 100,
    });
  } catch (e) {
    const err = e instanceof Error ? e.message : "Failed to fetch Gmail";
    return { ok: false, error: err };
  }

  let synced = 0;
  let createdContacts = 0;
  let latestSentAt = since ?? new Date(0);

  for (const msg of messages) {
    if (!msg.fromAddress) continue;
    try {
      const { contactId, created } = await findOrCreateContact(
        workspaceId,
        userId,
        msg.fromAddress,
        msg.fromName
      );
      if (created) createdContacts += 1;

      await prisma.email.upsert({
        where: {
          userId_provider_providerMessageId: {
            userId,
            provider: "gmail",
            providerMessageId: msg.id,
          },
        },
        create: {
          userId,
          userEmailAccountId: account.id,
          contactId,
          provider: "gmail",
          providerMessageId: msg.id,
          threadId: msg.threadId || null,
          direction: "inbound",
          fromAddress: msg.fromAddress,
          toAddresses: msg.toAddresses,
          subject: msg.subject || null,
          bodySnippet: msg.bodySnippet.slice(0, 500) || null,
          body: msg.body || null,
          sentAt: msg.sentAt,
        },
        update: {},
      });
      synced += 1;
      if (msg.sentAt > latestSentAt) latestSentAt = msg.sentAt;
    } catch (e) {
      console.warn("[EmailSync] skip message", msg.id, e);
    }
  }

  await prisma.userEmailAccount.update({
    where: { id: account.id },
    data: { lastEmailSyncAt: latestSentAt },
  });

  return { ok: true, synced, createdContacts };
}
