/**
 * Workspace resolution for multi-team and billing.
 * All data (contacts, deals, tasks, etc.) is scoped by workspace.
 */

import { prisma } from "@/lib/db";
import type { BillingTier } from "@prisma/client";

/** Get the workspace id for the current user (first membership). */
export async function getWorkspaceId(userId: string): Promise<string | null> {
  const member = await prisma.workspaceMember.findFirst({
    where: { userId },
    select: { workspaceId: true },
  });
  return member?.workspaceId ?? null;
}

/**
 * Ensure the user has a workspace: if none, create one (FREE plan) and add them as member.
 * Returns workspace id.
 */
export async function ensureWorkspaceForUser(userId: string): Promise<string> {
  const existing = await getWorkspaceId(userId);
  if (existing) return existing;

  const workspace = await prisma.workspace.create({
    data: {
      name: "My workspace",
      plan: "FREE",
      members: {
        create: { userId },
      },
    },
  });
  return workspace.id;
}

/** Get workspace with plan (for usage/limits). */
export async function getWorkspace(workspaceId: string) {
  return prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true, name: true, plan: true },
  });
}

/** Get all member userIds in a workspace (for cross-user queries e.g. Email). */
export async function getWorkspaceUserIds(workspaceId: string): Promise<string[]> {
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    select: { userId: true },
  });
  return members.map((m) => m.userId);
}

export type { BillingTier };
