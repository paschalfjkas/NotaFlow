import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CreditSource } from "@/types/database";

export class InsufficientCreditsError extends Error {
  constructor() {
    super("insufficient_credits");
    this.name = "InsufficientCreditsError";
  }
}

/**
 * Atomically consumes one report-generation credit (free first, then paid)
 * via the `consume_report_credit` Postgres function, which row-locks the
 * user's credits row so concurrent requests can't double-spend the same
 * credit. Throws InsufficientCreditsError if the user has none left.
 */
export async function consumeReportCredit(userId: string): Promise<CreditSource> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("consume_report_credit", {
    p_user_id: userId,
  });

  if (error) {
    if (error.message.includes("insufficient_credits")) {
      throw new InsufficientCreditsError();
    }
    throw error;
  }

  return data as CreditSource;
}

/** Restores a credit after generation fails post-debit. Best-effort. */
export async function refundReportCredit(userId: string, source: CreditSource) {
  const admin = createAdminClient();
  const { error } = await admin.rpc("refund_report_credit", {
    p_user_id: userId,
    p_source: source,
  });
  if (error) {
    console.error("Failed to refund report credit", { userId, source, error });
  }
}

export async function getCreditBalance(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("credits")
    .select("free_credits, paid_credits")
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data;
}

export async function addPaidCredits(userId: string, credits: number) {
  const admin = createAdminClient();
  const { error } = await admin.rpc("add_paid_credits", {
    p_user_id: userId,
    p_credits: credits,
  });
  if (error) throw error;
}
