import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleCode } from "@/lib/email-connection";
import { prisma } from "@/lib/db";

/** Base URL for redirects; no trailing slash. Must match the redirect_uri sent to Google. */
function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const trimmed = raw.replace(/\/$/, "");
  if (trimmed.includes("thebellcrm.eu") && !trimmed.includes("app.thebellcrm.eu")) {
    return "https://app.thebellcrm.eu";
  }
  return trimmed;
}

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl();
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", baseUrl));
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/settings?error=email_connect_no_code", baseUrl));
  }

  const redirectUri = `${baseUrl}/api/email/connect/google/callback`;

  try {
    const { accessToken, refreshToken, expiresAt, email } = await exchangeGoogleCode(code, redirectUri);

    await prisma.userEmailAccount.upsert({
      where: {
        userId_provider: { userId, provider: "gmail" },
      },
      create: {
        userId,
        provider: "gmail",
        email,
        accessToken,
        refreshToken,
        expiresAt,
      },
      update: {
        email,
        accessToken,
        refreshToken,
        expiresAt,
      },
    });

    return NextResponse.redirect(new URL("/settings?email_connected=gmail", baseUrl));
  } catch (e) {
    console.error("[Connect Gmail] callback failed:", e);
    return NextResponse.redirect(
      new URL("/settings?error=email_connect", baseUrl)
    );
  }
}
