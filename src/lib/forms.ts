import { randomBytes } from "crypto";

/** Generate a URL-safe public key for embed forms (unauthenticated submissions). */
export function generateFormPublicKey(): string {
  return randomBytes(16).toString("base64url");
}
