"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { addPaidCredits } from "@/lib/credits";

export type ActionResult = { error: string } | { success: true };

export async function grantCreditsAction(userId: string, credits: number): Promise<ActionResult> {
  await requireAdmin();

  if (!Number.isFinite(credits) || credits <= 0) {
    return { error: "Enter a positive number of credits." };
  }

  try {
    await addPaidCredits(userId, Math.floor(credits));
  } catch {
    return { error: "Could not grant credits. Please try again." };
  }

  revalidatePath("/admin/users");
  return { success: true };
}
