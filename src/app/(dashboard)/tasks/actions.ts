"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import type { ActivityType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ensureWorkspaceForUser } from "@/lib/workspace";
import { runAutomation } from "@/lib/automation/runner";

export async function completeTask(taskId: string) {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };

  const workspaceId = await ensureWorkspaceForUser(userId);
  const task = await prisma.task.findFirst({
    where: { id: taskId, workspaceId },
  });
  if (!task) return { ok: false, error: "Task not found" };
  if (task.status === "COMPLETED") return { ok: true };

  await prisma.task.update({
    where: { id: taskId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  await runAutomation({
    type: "task_completed",
    taskId,
    contactId: task.contactId,
    dealId: task.dealId,
    userId,
    taskTitle: task.title,
  });

  revalidatePath("/tasks");
  revalidatePath("/");
  revalidatePath("/funnel");
  revalidatePath("/contacts/[id]", "page");
  return { ok: true };
}

export async function snoozeTask(taskId: string, days: number = 1) {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };

  const workspaceId = await ensureWorkspaceForUser(userId);
  const task = await prisma.task.findFirst({
    where: { id: taskId, workspaceId },
  });
  if (!task) return { ok: false, error: "Task not found" };

  const newDue = new Date();
  newDue.setDate(newDue.getDate() + days);
  newDue.setHours(9, 0, 0, 0);

  await prisma.task.update({
    where: { id: taskId },
    data: { dueAt: newDue },
  });

  revalidatePath("/tasks");
  revalidatePath("/");
  revalidatePath("/contacts/[id]", "page");
  return { ok: true };
}

export async function updateTask(
  taskId: string,
  data: { title?: string; dueAt?: Date | null }
) {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };

  const workspaceId = await ensureWorkspaceForUser(userId);
  const task = await prisma.task.findFirst({
    where: { id: taskId, workspaceId },
  });
  if (!task) return { ok: false, error: "Task not found" };

  await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.dueAt !== undefined && { dueAt: data.dueAt }),
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/");
  revalidatePath("/contacts/[id]", "page");
  return { ok: true };
}

export async function createTask(input: {
  title: string;
  dueAt?: Date | null;
  contactId?: string | null;
  dealId?: string | null;
}) {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };
  if (!input.title?.trim()) return { ok: false, error: "Title required" };
  if (!input.contactId && !input.dealId) return { ok: false, error: "Contact or deal required" };

  const workspaceId = await ensureWorkspaceForUser(userId);
  await prisma.task.create({
    data: {
      workspaceId,
      userId,
      title: input.title.trim(),
      dueAt: input.dueAt ?? undefined,
      contactId: input.contactId ?? undefined,
      dealId: input.dealId ?? undefined,
      status: "PENDING",
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/");
  revalidatePath("/contacts/[id]", "page");
  return { ok: true };
}

export async function createActivity(input: {
  type: ActivityType;
  description?: string | null;
  contactId?: string | null;
  dealId?: string | null;
}) {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };
  if (!input.contactId && !input.dealId) return { ok: false, error: "Contact or deal required" };

  const workspaceId = await ensureWorkspaceForUser(userId);
  await prisma.activity.create({
    data: {
      workspaceId,
      userId,
      type: input.type,
      description: input.description?.trim() || null,
      contactId: input.contactId ?? undefined,
      dealId: input.dealId ?? undefined,
    },
  });

  revalidatePath("/contacts/[id]", "page");
  revalidatePath("/");
  return { ok: true };
}
