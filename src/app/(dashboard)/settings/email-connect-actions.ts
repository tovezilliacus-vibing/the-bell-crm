"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function disconnectEmailAccount() {
  const { userId } = await auth();
  if (!userId) return;

  await prisma.userEmailAccount.deleteMany({
    where: { userId },
  });
  revalidatePath("/settings");
}
