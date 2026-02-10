"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ensureWorkspaceForUser } from "@/lib/workspace";
import { generateFormPublicKey } from "@/lib/forms";
import type { FormFieldType } from "@prisma/client";

export async function getForms(workspaceId: string) {
  return prisma.form.findMany({
    where: { workspaceId },
    include: {
      _count: { select: { submissions: true } },
      fields: { orderBy: { orderIndex: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getForm(id: string, workspaceId: string) {
  return prisma.form.findFirst({
    where: { id, workspaceId },
    include: { fields: { orderBy: { orderIndex: "asc" } } },
  });
}

export async function createForm(data: {
  name: string;
  description?: string | null;
  thankYouMessage?: string | null;
  redirectUrl?: string | null;
}) {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };
  const workspaceId = await ensureWorkspaceForUser(userId);
  const publicKey = generateFormPublicKey();
  try {
    const form = await prisma.form.create({
      data: {
        workspaceId,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        publicKey,
        thankYouMessage: data.thankYouMessage?.trim() || null,
        redirectUrl: data.redirectUrl?.trim() || null,
        isActive: true,
      },
    });
    revalidatePath("/forms");
    return { ok: true, formId: form.id };
  } catch (e) {
    return { ok: false, error: "Failed to create form" };
  }
}

export async function updateForm(
  formId: string,
  data: {
    name?: string;
    description?: string | null;
    thankYouMessage?: string | null;
    redirectUrl?: string | null;
    isActive?: boolean;
  }
) {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };
  const workspaceId = await ensureWorkspaceForUser(userId);
  const form = await prisma.form.findFirst({ where: { id: formId, workspaceId } });
  if (!form) return { ok: false, error: "Form not found" };
  try {
    await prisma.form.update({
      where: { id: formId },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
        ...(data.thankYouMessage !== undefined && { thankYouMessage: data.thankYouMessage?.trim() || null }),
        ...(data.redirectUrl !== undefined && { redirectUrl: data.redirectUrl?.trim() || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    revalidatePath("/forms");
    revalidatePath(`/forms/${formId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Failed to update form" };
  }
}

export async function deleteForm(formId: string) {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };
  const workspaceId = await ensureWorkspaceForUser(userId);
  const form = await prisma.form.findFirst({ where: { id: formId, workspaceId } });
  if (!form) return { ok: false, error: "Form not found" };
  try {
    await prisma.form.delete({ where: { id: formId } });
    revalidatePath("/forms");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Failed to delete form" };
  }
}

export async function createFormField(
  formId: string,
  data: { label: string; name: string; type: FormFieldType; required?: boolean; options?: unknown }
) {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };
  const workspaceId = await ensureWorkspaceForUser(userId);
  const form = await prisma.form.findFirst({ where: { id: formId, workspaceId } });
  if (!form) return { ok: false, error: "Form not found" };
  const maxOrder = await prisma.formField.aggregate({
    where: { formId },
    _max: { orderIndex: true },
  });
  const orderIndex = (maxOrder._max.orderIndex ?? -1) + 1;
  try {
    await prisma.formField.create({
      data: {
        formId,
        label: data.label.trim(),
        name: data.name.trim().replace(/\s+/g, "_") || "field",
        type: data.type,
        required: data.required ?? false,
        options: data.options ?? undefined,
        orderIndex,
      },
    });
    revalidatePath(`/forms/${formId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Failed to add field" };
  }
}

export async function updateFormField(
  fieldId: string,
  data: { label?: string; name?: string; required?: boolean; options?: unknown }
) {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };
  const workspaceId = await ensureWorkspaceForUser(userId);
  const field = await prisma.formField.findFirst({
    where: { id: fieldId },
    include: { form: true },
  });
  if (!field || field.form.workspaceId !== workspaceId) return { ok: false, error: "Field not found" };
  try {
    await prisma.formField.update({
      where: { id: fieldId },
      data: {
        ...(data.label !== undefined && { label: data.label.trim() }),
        ...(data.name !== undefined && { name: data.name.trim().replace(/\s+/g, "_") || field.name }),
        ...(data.required !== undefined && { required: data.required }),
        ...(data.options !== undefined && { options: data.options as object }),
      },
    });
    revalidatePath(`/forms/${field.formId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Failed to update field" };
  }
}

export async function deleteFormField(fieldId: string) {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };
  const workspaceId = await ensureWorkspaceForUser(userId);
  const field = await prisma.formField.findFirst({
    where: { id: fieldId },
    include: { form: true },
  });
  if (!field || field.form.workspaceId !== workspaceId) return { ok: false, error: "Field not found" };
  try {
    await prisma.formField.delete({ where: { id: fieldId } });
    revalidatePath(`/forms/${field.formId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Failed to delete field" };
  }
}

export async function reorderFormFields(formId: string, fieldIds: string[]) {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };
  const workspaceId = await ensureWorkspaceForUser(userId);
  const form = await prisma.form.findFirst({ where: { id: formId, workspaceId } });
  if (!form) return { ok: false, error: "Form not found" };
  try {
    await Promise.all(
      fieldIds.map((id, index) =>
        prisma.formField.update({ where: { id }, data: { orderIndex: index } })
      )
    );
    revalidatePath(`/forms/${formId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Failed to reorder" };
  }
}
