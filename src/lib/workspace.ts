/**
 * Workspace resolution for multi-team and billing.
 * All data (contacts, deals, tasks, etc.) is scoped by workspace.
 * Admins can manage account, invite users, and set prospect key metrics.
 */

import { prisma } from "@/lib/db";
import type { BillingTier, WorkspaceRole } from "@prisma/client";

/** Get the workspace id for the current user (first membership). */
export async function getWorkspaceId(userId: string): Promise<string | null> {
  const member = await prisma.workspaceMember.findFirst({
    where: { userId },
    select: { workspaceId: true },
  });
  return member?.workspaceId ?? null;
}

/**
 * Ensure the user has a workspace: if none, check for a pending invite by email (add them to that workspace), else create one (FREE plan) and add them as admin.
 * Returns workspace id.
 */
export async function ensureWorkspaceForUser(userId: string): Promise<string> {
  const existing = await getWorkspaceId(userId);
  if (existing) return existing;

  const { currentUser } = await import("@clerk/nextjs/server");
  const user = await currentUser();
  const email = user?.id === userId ? user.primaryEmailAddress?.emailAddress?.trim().toLowerCase() : null;
  if (email) {
    const invite = await prisma.workspaceInvite.findFirst({
      where: { email },
      select: { id: true, workspaceId: true, role: true },
    });
    if (invite) {
      await prisma.workspaceMember.create({
        data: { workspaceId: invite.workspaceId, userId, role: invite.role },
      });
      await prisma.workspaceInvite.delete({ where: { id: invite.id } });
      return invite.workspaceId;
    }
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: "My workspace",
      plan: "FREE",
      members: {
        create: { userId, role: "ADMIN" },
      },
    },
  });
  return workspace.id;
}

/** Get the current user's role in a workspace, or null if not a member. */
export async function getWorkspaceMemberRole(
  workspaceId: string,
  userId: string
): Promise<WorkspaceRole | null> {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { role: true },
  });
  return member?.role ?? null;
}

/** True if the user is an admin of the workspace. On FREE plan the single user is always admin. */
export async function isWorkspaceAdmin(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const [member, workspace] = await Promise.all([
    prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { role: true },
    }),
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { plan: true },
    }),
  ]);
  if (!member) return false;
  if (workspace?.plan === "FREE") return true;
  return member.role === "ADMIN";
}

/** Get all members of a workspace (for admin UI). */
export async function getWorkspaceMembers(workspaceId: string) {
  return prisma.workspaceMember.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
    select: { id: true, userId: true, role: true, createdAt: true },
  });
}

/** Get pending invites for a workspace (for admin UI). */
export async function getWorkspaceInvites(workspaceId: string) {
  return prisma.workspaceInvite.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, role: true, createdAt: true },
  });
}

/** Get workspace's first admin userId (for "workspace" prospect options — admin's options). */
export async function getWorkspaceAdminUserId(
  workspaceId: string
): Promise<string | null> {
  const admin = await prisma.workspaceMember.findFirst({
    where: { workspaceId, role: "ADMIN" },
    select: { userId: true },
  });
  return admin?.userId ?? null;
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
