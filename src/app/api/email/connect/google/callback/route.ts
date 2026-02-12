import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleCode } from "@/lib/email-connection";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(
      new URL("/settings?error=email_connect_no_code", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
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
