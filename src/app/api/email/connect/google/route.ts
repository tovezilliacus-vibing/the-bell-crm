import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/email-connection";

/** Base URL for redirects; no trailing slash. Use app subdomain in production so Google OAuth redirect_uri matches. */
function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const trimmed = raw.replace(/\/$/, "");
  if (trimmed.includes("thebellcrm.eu") && !trimmed.includes("app.thebellcrm.eu")) {
    return "https://app.thebellcrm.eu";
  }
  return trimmed;
}

export async function GET() {
  const { userId } = await auth();
  const baseUrl = getBaseUrl();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", baseUrl));
  }

  const redirectUri = `${baseUrl}/api/email/connect/google/callback`;

  try {
    const url = getGoogleAuthUrl(redirectUri);
    return NextResponse.redirect(url);
  } catch (e) {
    console.error("[Connect Gmail] auth URL failed:", e);
    return NextResponse.redirect(
      new URL("/settings?error=email_connect", baseUrl)
    );
  }
}
