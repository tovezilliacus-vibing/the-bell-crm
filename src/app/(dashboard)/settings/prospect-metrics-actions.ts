"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getWorkspaceAdminUserId, isWorkspaceAdmin } from "@/lib/workspace";

export type ProspectFieldType = "industry" | "size_turnover" | "size_personnel";

export async function getProspectFieldOptions(userId: string) {
  const options = await prisma.prospectFieldOption.findMany({
    where: { userId },
    orderBy: [{ fieldType: "asc" }, { sortOrder: "asc" }, { value: "asc" }],
  });
  return options;
}

/** Get prospect options for a workspace (admin's options; used in lead/contact forms). */
export async function getProspectFieldOptionsForWorkspace(workspaceId: string) {
  const adminUserId = await getWorkspaceAdminUserId(workspaceId);
  if (!adminUserId) return [];
  return getProspectFieldOptions(adminUserId);
}

export async function addProspectFieldOption(
  fieldType: ProspectFieldType,
  value: string
) {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };
  const { getWorkspaceId } = await import("@/lib/workspace");
  const workspaceId = await getWorkspaceId(userId);
  if (!workspaceId || !(await isWorkspaceAdmin(workspaceId, userId)))
    return { ok: false, error: "Only an administrator can edit prospect key metrics" };
  const trimmed = value.trim();
  if (!trimmed) return { ok: false, error: "Value is required" };
  try {
    await prisma.prospectFieldOption.upsert({
      where: {
        userId_fieldType_value: { userId, fieldType, value: trimmed },
      },
      create: {
        userId,
        fieldType,
        value: trimmed,
        sortOrder: 0,
      },
      update: {},
    });
    revalidatePath("/settings");
    revalidatePath("/leads");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Failed to add option" };
  }
}

export async function removeProspectFieldOption(id: string) {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };
  const { getWorkspaceId } = await import("@/lib/workspace");
  const workspaceId = await getWorkspaceId(userId);
  if (!workspaceId || !(await isWorkspaceAdmin(workspaceId, userId)))
    return { ok: false, error: "Only an administrator can edit prospect key metrics" };
  try {
    await prisma.prospectFieldOption.deleteMany({
      where: { id, userId },
    });
    revalidatePath("/settings");
    revalidatePath("/leads");
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to remove option" };
  }
}
