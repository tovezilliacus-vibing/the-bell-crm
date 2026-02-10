"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import type { FunnelStage } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ensureWorkspaceForUser } from "@/lib/workspace";
import { runAutomation } from "@/lib/automation/runner";

export async function updateContactFunnelStage(
  contactId: string,
  toStage: FunnelStage
) {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };

  const workspaceId = await ensureWorkspaceForUser(userId);
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, workspaceId },
  });
  if (!contact) return { ok: false, error: "Contact not found" };

  const fromStage = contact.funnelStage;
  if (fromStage === toStage) return { ok: true };

  await prisma.$transaction([
    prisma.contact.update({
      where: { id: contactId },
      data: { funnelStage: toStage },
    }),
    prisma.contactStageHistory.create({
      data: {
        contactId,
        fromStage,
        toStage,
      },
    }),
  ]);

  await runAutomation({
    type: "stage_changed",
    contactId,
    userId,
    fromStage,
    toStage,
  });

  revalidatePath("/contacts/[id]", "page");
  revalidatePath("/contacts/" + contactId);
  revalidatePath("/funnel");
  revalidatePath("/");
  revalidatePath("/leads");
  revalidatePath("/customers");
  return { ok: true };
}
