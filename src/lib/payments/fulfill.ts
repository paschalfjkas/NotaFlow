import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { addPaidCredits } from "@/lib/credits";

export type FulfillResult = "credited" | "already_processed" | "not_found";

/**
 * Marks a transaction successful and credits the student's account — exactly
 * once. Both the webhook and the browser-redirect callback call this for the
 * same reference, so the pending -> success transition is a single
 * conditional UPDATE: only the caller that actually flips the row (Postgres
 * guarantees one winner) goes on to credit the account.
 */
export async function fulfillTransaction(
  reference: string,
  providerRaw: Record<string, unknown>
): Promise<FulfillResult> {
  const admin = createAdminClient();

  const { data: updated, error } = await admin
    .from("transactions")
    .update({ status: "success", provider_raw: providerRaw })
    .eq("reference", reference)
    .eq("status", "pending")
    .select("user_id, credits")
    .maybeSingle();

  if (error) throw error;

  if (!updated) {
    const { data: existing } = await admin
      .from("transactions")
      .select("id")
      .eq("reference", reference)
      .maybeSingle();
    return existing ? "already_processed" : "not_found";
  }

  await addPaidCredits(updated.user_id, updated.credits);
  return "credited";
}

/** Marks a transaction as failed/cancelled — only while it's still pending, so a later success can't be clobbered. */
export async function markTransactionFailed(
  reference: string,
  providerRaw: Record<string, unknown>
): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("transactions")
    .update({ status: "failed", provider_raw: providerRaw })
    .eq("reference", reference)
    .eq("status", "pending");
}
