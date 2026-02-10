"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function setRecipeEnabled(recipeId: string, enabled: boolean) {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };

  try {
    await prisma.automationRecipeSetting.upsert({
      where: {
        userId_recipeId: { userId, recipeId },
      },
      create: { userId, recipeId, enabled },
      update: { enabled },
    });
    revalidatePath("/automation");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Failed to update" };
  }
}
