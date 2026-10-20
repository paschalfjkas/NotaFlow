"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { fulfillTransaction, markTransactionFailed } from "@/lib/payments/fulfill";
import { updatePaymentSettings, type PaymentSettings } from "@/lib/payments/bank-transfer";

export type ActionResult = { error: string } | { success: true };

async function getReferenceForTransaction(transactionId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("transactions")
    .select("reference")
    .eq("id", transactionId)
    .eq("provider", "bank_transfer")
    .maybeSingle();
  return data?.reference ?? null;
}

export async function approveBankTransferAction(transactionId: string): Promise<ActionResult> {
  const { user } = await requireAdmin();

  const reference = await getReferenceForTransaction(transactionId);
  if (!reference) return { error: "Transaction not found." };

  const result = await fulfillTransaction(reference, {
    approved_by: user.id,
    approved_at: new Date().toISOString(),
  });

  if (result === "not_found") return { error: "Transaction not found." };
  // "already_processed" happens on a double-click — treat as success, not an error.

  revalidatePath("/admin/payments");
  return { success: true };
}

export async function rejectBankTransferAction(transactionId: string): Promise<ActionResult> {
  const { user } = await requireAdmin();

  const reference = await getReferenceForTransaction(transactionId);
  if (!reference) return { error: "Transaction not found." };

  await markTransactionFailed(reference, {
    rejected_by: user.id,
    rejected_at: new Date().toISOString(),
  });

  revalidatePath("/admin/payments");
  return { success: true };
}

export async function updatePaymentSettingsAction(settings: PaymentSettings): Promise<ActionResult> {
  await requireAdmin();

  if (!settings.bank_name.trim() || !settings.account_number.trim() || !settings.account_name.trim()) {
    return { error: "Bank name, account number, and account name are all required." };
  }

  try {
    await updatePaymentSettings(settings);
  } catch {
    return { error: "Could not save payment settings. Please try again." };
  }

  revalidatePath("/admin/payments");
  revalidatePath("/dashboard/billing");
  return { success: true };
}
