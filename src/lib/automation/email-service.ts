/**
 * Stub email service. Replace with real provider (SendGrid, Resend, etc.) later.
 * For v1 we log and return; no actual send.
 */

export type SendEmailParams = {
  to: string;
  subject: string;
  templateId: string;
  context?: Record<string, string | number | boolean>;
};

export async function sendEmail(params: SendEmailParams): Promise<{ ok: boolean; error?: string }> {
  // Stub: log and succeed. Plug in real sending here later.
  if (process.env.NODE_ENV !== "test") {
    // eslint-disable-next-line no-console
    console.log("[EmailService stub] would send:", {
      to: params.to,
      subject: params.subject,
      templateId: params.templateId,
      context: params.context,
    });
  }
  return { ok: true };
}
