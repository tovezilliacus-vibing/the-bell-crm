"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  getWorkspaceId,
  isWorkspaceAdmin,
  getWorkspace,
  getWorkspaceInvites,
} from "@/lib/workspace";
import { getPlanLimits } from "@/lib/plans";
import { sendEmail } from "@/lib/automation/email-service";
import type { BillingTier } from "@prisma/client";

export async function updateWorkspacePlan(plan: BillingTier) {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };

  const workspaceId = await getWorkspaceId(userId);
  if (!workspaceId) return { ok: false, error: "No workspace" };
  if (!(await isWorkspaceAdmin(workspaceId, userId)))
    return { ok: false, error: "Only an administrator can change the plan" };

  try {
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { plan },
    });
    if (plan === "STARTER" || plan === "GROWTH" || plan === "PAID") {
      await prisma.workspaceMember.updateMany({
        where: { workspaceId, userId },
        data: { role: "ADMIN" },
      });
    }
    revalidatePath("/settings");
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to update plan" };
  }
}

export async function inviteByEmail(email: string, role: "ADMIN" | "MEMBER" = "MEMBER") {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };

  const workspaceId = await getWorkspaceId(userId);
  if (!workspaceId) return { ok: false, error: "No workspace" };
  if (!(await isWorkspaceAdmin(workspaceId, userId)))
    return { ok: false, error: "Only an administrator can invite users" };

  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { ok: false, error: "Email is required" };

  const workspace = await getWorkspace(workspaceId);
  if (!workspace) return { ok: false, error: "Workspace not found" };
  const limits = getPlanLimits(workspace.plan);
  const [membersCount, invitesCount] = await Promise.all([
    prisma.workspaceMember.count({ where: { workspaceId } }),
    prisma.workspaceInvite.count({ where: { workspaceId } }),
  ]);
  if (membersCount + invitesCount >= limits.users)
    return { ok: false, error: `User limit (${limits.users}) reached. Upgrade your plan to invite more.` };

  try {
    await prisma.workspaceInvite.upsert({
      where: {
        workspaceId_email: { workspaceId, email: trimmed },
      },
      create: {
        workspaceId,
        email: trimmed,
        role,
        invitedByUserId: userId,
      },
      update: { role, invitedByUserId: userId },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
    const signUpUrl = appUrl ? `${appUrl}/sign-up` : "";
    const inviter = await currentUser();
    const inviterName =
      (inviter?.firstName || inviter?.lastName
        ? [inviter.firstName, inviter.lastName].filter(Boolean).join(" ")
        : null) || inviter?.primaryEmailAddress?.emailAddress ?? "A teammate";

    const emailResult = await sendEmail({
      to: trimmed,
      subject: `You're invited to join ${workspace.name}`,
      templateId: "workspace-invite",
      context: {
        workspaceName: workspace.name,
        inviterName,
        signUpUrl,
      },
      userId,
    });

    revalidatePath("/settings");
    return { ok: true, emailSent: emailResult.sent === true };
  } catch (e) {
    return { ok: false, error: "Failed to send invite" };
  }
}

export async function revokeInvite(inviteId: string) {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };

  const workspaceId = await getWorkspaceId(userId);
  if (!workspaceId) return { ok: false, error: "No workspace" };
  if (!(await isWorkspaceAdmin(workspaceId, userId)))
    return { ok: false, error: "Only an administrator can revoke invites" };

  const invite = await prisma.workspaceInvite.findFirst({
    where: { id: inviteId, workspaceId },
  });
  if (!invite) return { ok: false, error: "Invite not found" };

  try {
    await prisma.workspaceInvite.delete({ where: { id: inviteId } });
    revalidatePath("/settings");
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to revoke invite" };
  }
}
