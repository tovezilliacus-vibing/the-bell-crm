import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { syncIncomingGmailForUser } from "@/lib/email-sync";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  const result = await syncIncomingGmailForUser(userId);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Sync failed" },
      { status: 400 }
    );
  }
  return NextResponse.json({
    ok: true,
    synced: result.synced ?? 0,
    createdContacts: result.createdContacts ?? 0,
  });
}
