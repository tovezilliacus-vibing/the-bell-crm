import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

/**
 * Public config for a form (fields only). Used by embed.js to render the form dynamically.
 * Only returns config for active forms.
 */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ publicKey: string }> }
) {
  const { publicKey } = await params;
  if (!publicKey) {
    return NextResponse.json(
      { error: "Missing form key" },
      { status: 400, headers: CORS_HEADERS }
    );
  }
  const form = await prisma.form.findFirst({
    where: { publicKey, isActive: true },
    select: {
      fields: {
        orderBy: { orderIndex: "asc" },
        select: { name: true, label: true, type: true, required: true, options: true },
      },
    },
  });
  if (!form) {
    return NextResponse.json(
      { error: "Form not found or inactive" },
      { status: 404, headers: CORS_HEADERS }
    );
  }
  return NextResponse.json(
    { fields: form.fields },
    { headers: { ...CORS_HEADERS, "Cache-Control": "public, max-age=60" } }
  );
}
