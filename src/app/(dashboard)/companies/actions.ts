"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import type { CompanyLifecycle } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ensureWorkspaceForUser } from "@/lib/workspace";

export type CompanyCreateInput = {
  name: string;
  lifecycleStage?: CompanyLifecycle;
  industry?: string | null;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  vatNumber?: string | null;
  registrationNumber?: string | null;
};

export type CompanyUpdateInput = {
  name?: string;
  lifecycleStage?: CompanyLifecycle;
  industry?: string | null;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  vatNumber?: string | null;
  registrationNumber?: string | null;
};

export async function createCompany(data: CompanyCreateInput) {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };

  const workspaceId = await ensureWorkspaceForUser(userId);
  const name = data.name?.trim();
  if (!name) return { ok: false, error: "Company name is required" };

  const company = await prisma.company.create({
    data: {
      workspaceId,
      userId,
      name,
      lifecycleStage: data.lifecycleStage ?? "PROSPECT",
      industry: data.industry?.trim() || null,
      streetAddress: data.streetAddress?.trim() || null,
      city: data.city?.trim() || null,
      state: data.state?.trim() || null,
      country: data.country?.trim() || null,
      vatNumber: data.vatNumber?.trim() || null,
      registrationNumber: data.registrationNumber?.trim() || null,
    },
  });
  revalidatePath("/companies");
  revalidatePath("/leads");
  revalidatePath("/contacts");
  return { ok: true, companyId: company.id };
}

export async function updateCompany(companyId: string, data: CompanyUpdateInput) {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };

  const workspaceId = await ensureWorkspaceForUser(userId);
  const company = await prisma.company.findFirst({
    where: { id: companyId, workspaceId },
  });
  if (!company) return { ok: false, error: "Company not found" };

  await prisma.company.update({
    where: { id: companyId },
    data: {
      ...(data.name !== undefined && { name: data.name?.trim() || company.name }),
      ...(data.lifecycleStage !== undefined && { lifecycleStage: data.lifecycleStage }),
      ...(data.industry !== undefined && { industry: data.industry?.trim() || null }),
      ...(data.streetAddress !== undefined && { streetAddress: data.streetAddress?.trim() || null }),
      ...(data.city !== undefined && { city: data.city?.trim() || null }),
      ...(data.state !== undefined && { state: data.state?.trim() || null }),
      ...(data.country !== undefined && { country: data.country?.trim() || null }),
      ...(data.vatNumber !== undefined && { vatNumber: data.vatNumber?.trim() || null }),
      ...(data.registrationNumber !== undefined && { registrationNumber: data.registrationNumber?.trim() || null }),
    },
  });
  revalidatePath("/companies");
  revalidatePath("/contacts");
  revalidatePath("/leads");
  return { ok: true };
}
