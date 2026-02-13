"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import type { FunnelStage, PersonType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ensureWorkspaceForUser } from "@/lib/workspace";

export type UpdateContactInput = {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  companyId?: string | null;
  funnelStage?: FunnelStage;
  personType?: PersonType;
};

export async function updateContact(contactId: string, input: UpdateContactInput) {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };

  const workspaceId = await ensureWorkspaceForUser(userId);
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, workspaceId },
  });
  if (!contact) return { ok: false, error: "Contact not found" };

  const data: Partial<UpdateContactInput> = {};
  if (input.firstName !== undefined) data.firstName = input.firstName?.trim() || null;
  if (input.lastName !== undefined) data.lastName = input.lastName?.trim() || null;
  if (input.name !== undefined) data.name = input.name?.trim() || null;
  if (input.email !== undefined) data.email = input.email?.trim() || null;
  if (input.phone !== undefined) data.phone = input.phone?.trim() || null;
  if (input.companyId !== undefined) data.companyId = input.companyId || null;
  if (input.funnelStage !== undefined) data.funnelStage = input.funnelStage;
  if (input.personType !== undefined) data.personType = input.personType;

  await prisma.contact.update({
    where: { id: contactId },
    data,
  });

  revalidatePath("/contacts");
  revalidatePath("/contacts/[id]", "page");
  revalidatePath("/contacts/" + contactId);
  revalidatePath("/funnel");
  revalidatePath("/leads");
  revalidatePath("/customers");
  revalidatePath("/");
  return { ok: true };
}

/** Delete multiple contacts by ID (must belong to user's workspace). */
export async function deleteContacts(contactIds: string[]) {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };
  if (!contactIds.length) return { ok: false, error: "No contacts selected" };

  const workspaceId = await ensureWorkspaceForUser(userId);
  const deleted = await prisma.contact.deleteMany({
    where: {
      id: { in: contactIds },
      workspaceId,
    },
  });
  revalidatePath("/contacts");
  revalidatePath("/funnel");
  revalidatePath("/leads");
  revalidatePath("/");
  return { ok: true, deleted: deleted.count };
}
