/**
 * Send email for automations and 1:1 outreach.
 * Uses the user's connected mailbox (Gmail) when available; otherwise logs only (stub).
 */

import { getConnectedEmailAccount, sendViaGmail } from "@/lib/email-connection";

export type SendEmailParams = {
  to: string;
  subject: string;
  templateId: string;
  context?: Record<string, string | number | boolean>;
  /** Required to use connected mailbox (Gmail). If omitted, stub only. */
  userId?: string;
};

function buildBody(templateId: string, context?: Record<string, string | number | boolean>): string {
  if (templateId === "workspace-invite") {
    const workspaceName = (context?.workspaceName as string) ?? "the workspace";
    const inviterName = (context?.inviterName as string) ?? "A teammate";
    const signUpUrl = (context?.signUpUrl as string) ?? "";
    return (
      `Hi,\n\n${inviterName} has invited you to join ${workspaceName}.\n\n` +
      (signUpUrl ? `Sign up or sign in here to join: ${signUpUrl}\n\n` : "Sign up or sign in with this email address and you'll be added to the workspace.\n\n") +
      "— The BELL CRM"
    );
  }
  const first = context?.firstName ?? "";
  const last = context?.lastName ?? "";
  const name = (context?.name as string) ?? [first, last].filter(Boolean).join(" ");
  const greeting = name ? `Hi ${name},\n\n` : "Hi,\n\n";
  const fallback = `${greeting}This message was sent from your CRM automation (${templateId}).`;
  return fallback;
}

export async function sendEmail(
  params: SendEmailParams
): Promise<{ ok: boolean; error?: string; sent?: boolean }> {
  const { to, subject, templateId, context, userId } = params;

  if (userId) {
    const account = await getConnectedEmailAccount(userId);
    if (account?.provider === "gmail") {
      const body = buildBody(templateId, context);
      const result = await sendViaGmail(account, { to, subject, body });
      return { ...result, sent: result.ok };
    }
  }

  if (process.env.NODE_ENV !== "test") {
    // eslint-disable-next-line no-console
    console.log("[EmailService] No connected mailbox; would send:", {
      to,
      subject,
      templateId,
    });
  }
  return { ok: true, sent: false };
}
