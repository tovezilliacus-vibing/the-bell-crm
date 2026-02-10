"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ensureWorkspaceForUser } from "@/lib/workspace";
import { runAutomation } from "@/lib/automation/runner";
import type { LeadSource } from "@prisma/client";

type CreateLeadInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  leadSource: LeadSource | "";
  referralFrom: string;
  companyId: string | null;
  newCompanyName?: string;
  industry?: string;
  sizeTurnover?: string;
  sizePersonnel?: string;
  city?: string;
  state?: string;
  country?: string;
};

export async function createLead(input: CreateLeadInput) {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };

  const workspaceId = await ensureWorkspaceForUser(userId);

  const firstName = input.firstName.trim() || null;
  const lastName = input.lastName.trim() || null;
  const email = input.email.trim() || null;
  const phone = input.phone.trim() || null;
  const leadSource = (input.leadSource as LeadSource) || null;
  const referralFrom = input.referralFrom.trim() || null;

  let companyId: string | null = input.companyId || null;

  if (!companyId && input.newCompanyName?.trim()) {
    const company = await prisma.company.create({
      data: {
        workspaceId,
        userId,
        name: input.newCompanyName.trim(),
        industry: input.industry?.trim() || null,
        sizeTurnover: input.sizeTurnover?.trim() || null,
        sizePersonnel: input.sizePersonnel?.trim() || null,
        city: input.city?.trim() || null,
        state: input.state?.trim() || null,
        country: input.country?.trim() || null,
      },
    });
    companyId = company.id;
  }

  try {
    const contact = await prisma.contact.create({
      data: {
        workspaceId,
        userId,
        firstName,
        lastName,
        email,
        phone,
        funnelStage: "AWARENESS",
        leadSource,
        referralFrom: leadSource === "REFERRAL" ? referralFrom : null,
        companyId,
      },
    });
    await runAutomation({
      type: "contact_created",
      contactId: contact.id,
      userId,
      stage: "AWARENESS",
    });
    revalidatePath("/leads");
    revalidatePath("/contacts");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Failed to create lead" };
  }
}
