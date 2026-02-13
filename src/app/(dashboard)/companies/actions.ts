"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import type { CompanyLifecycle } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ensureWorkspaceForUser } from "@/lib/workspace";

export async function createCompany(data: { name: string; lifecycleStage?: CompanyLifecycle }) {
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
    },
  });
  revalidatePath("/companies");
  revalidatePath("/leads");
  revalidatePath("/contacts");
  return { ok: true, companyId: company.id };
}

export async function updateCompany(
  companyId: string,
  data: { name?: string; lifecycleStage?: CompanyLifecycle }
) {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };

  const workspaceId = await ensureWorkspaceForUser(userId);
  const company = await prisma.company.findFirst({
    where: { id: companyId, workspaceId },
  });
  if (!company) return { ok: false, error: "Company not found" };

  const update: { name?: string; lifecycleStage?: CompanyLifecycle } = {};
  if (data.name !== undefined) update.name = data.name.trim() || company.name;
  if (data.lifecycleStage !== undefined) update.lifecycleStage = data.lifecycleStage;

  await prisma.company.update({
    where: { id: companyId },
    data: update,
  });
  revalidatePath("/companies");
  revalidatePath("/contacts");
  revalidatePath("/leads");
  return { ok: true };
}
