/**
 * Lead source options for dropdown (Contact.leadSource).
 * "Referral" includes a separate "From who?" field (referralFrom).
 */
export const LEAD_SOURCE_OPTIONS = [
  { value: "INBOUND", label: "Inbound" },
  { value: "OUTREACH", label: "Outreach" },
  { value: "EVENT", label: "Event" },
  { value: "REFERRAL", label: "Referral" },
  { value: "OTHER", label: "Other" },
] as const;

export type LeadSourceValue = (typeof LEAD_SOURCE_OPTIONS)[number]["value"];

/**
 * Format phone for display and for tel: links (direct calling).
 * Strips non-digits for href; keeps a readable display form.
 */
export function formatPhoneForDisplay(phone: string | null | undefined): string {
  if (!phone?.trim()) return "";
  return phone.trim();
}

/**
 * Normalize phone to digits only for tel: href (best compatibility for direct calling).
 * E.g. "+46 70 123 45 67" -> "46701234567"
 */
export function phoneToTelHref(phone: string | null | undefined): string | null {
  if (!phone?.trim()) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 0) return null;
  return `tel:${digits}`;
}

/**
 * Display name for a contact: firstName + lastName, or legacy name, or fallback.
 */
export function personDisplayName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  legacyName: string | null | undefined
): string {
  const first = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (first) return first;
  if (legacyName?.trim()) return legacyName.trim();
  return "—";
}
