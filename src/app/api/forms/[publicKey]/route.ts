import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runAutomation } from "@/lib/automation/runner";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/** Parse POST body as form-urlencoded or JSON. */
async function parseBody(request: NextRequest): Promise<Record<string, string>> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const json = (await request.json()) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(json).map(([k, v]) => [k, String(v ?? "")])
    );
  }
  const form = await request.formData();
  return Object.fromEntries(
    [...form.entries()].map(([k, v]) => [k, v instanceof File ? "" : String(v)])
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ publicKey: string }> }
) {
  try {
    const { publicKey } = await params;
    if (!publicKey) {
      return NextResponse.json(
        { success: false, error: "Missing form key" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const form = await prisma.form.findUnique({
      where: { publicKey, isActive: true },
      include: { fields: { orderBy: { orderIndex: "asc" } }, workspace: true },
    });
    if (!form) {
      return NextResponse.json(
        { success: false, error: "Form not found or inactive" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    const body = await parseBody(request);

    // Validate required fields
    const errors: string[] = [];
    for (const field of form.fields) {
      if (!field.required) continue;
      const value = body[field.name]?.trim();
      if (value === undefined || value === "") {
        errors.push(`${field.label || field.name} is required`);
      }
      if (field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push(`${field.label || field.name} must be a valid email`);
      }
    }
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Get first workspace member as "owner" for new contacts
    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId: form.workspaceId },
      select: { userId: true },
    });
    const ownerUserId = member?.userId ?? "";

    const email = body.email?.trim() || body.Email?.trim() || null;
    const firstName = body.firstName?.trim() || body.first_name?.trim() || body.name?.trim() || null;
    const lastName = body.lastName?.trim() || body.last_name?.trim() || null;
    const phone = body.phone?.trim() || body.Phone?.trim() || null;

    let contactId: string | null = null;
    let isNewContact = false;

    if (email) {
      const existing = await prisma.contact.findFirst({
        where: { workspaceId: form.workspaceId, email },
      });
      if (existing) {
        contactId = existing.id;
        await prisma.contact.update({
          where: { id: existing.id },
          data: {
            firstName: firstName ?? existing.firstName,
            lastName: lastName ?? existing.lastName,
            phone: phone ?? existing.phone,
            formId: form.id,
            leadSource: "FORM",
            referralFrom: `form:${form.id}`,
          },
        });
      } else {
        const contact = await prisma.contact.create({
          data: {
            workspaceId: form.workspaceId,
            userId: ownerUserId,
            email,
            firstName,
            lastName,
            phone,
            funnelStage: "AWARENESS",
            leadSource: "FORM",
            referralFrom: `form:${form.id}`,
            formId: form.id,
          },
        });
        contactId = contact.id;
        isNewContact = true;
      }
    }

    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? null;
    const userAgent = request.headers.get("user-agent") ?? null;

    await prisma.formSubmission.create({
      data: {
        formId: form.id,
        payload: body as object,
        contactId,
        ipAddress,
        userAgent,
      },
    });

    if (isNewContact && contactId) {
      await runAutomation({
        type: "contact_created",
        contactId,
        userId: ownerUserId,
        stage: "AWARENESS",
      });
    }

    const redirectUrl = form.redirectUrl?.trim() || null;
    if (redirectUrl) {
      return NextResponse.redirect(redirectUrl, { status: 302, headers: CORS_HEADERS });
    }
    return NextResponse.json({ success: true }, { status: 200, headers: CORS_HEADERS });
  } catch (e) {
    console.error("[forms] submission error:", e);
    return NextResponse.json(
      { success: false, error: "Submission failed" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
