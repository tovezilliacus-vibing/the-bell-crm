import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/email-connection";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
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
