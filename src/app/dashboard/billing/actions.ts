"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { initializeTransaction, PaystackError } from "@/lib/payments/paystack";
import {
  generateTransferReference,
  uploadReceipt,
  UnsupportedReceiptTypeError,
} from "@/lib/payments/bank-transfer";
import { getServerEnv, isPaystackConfigured } from "@/lib/env";

export type CheckoutResult = { url: string } | { error: string };

export async function initiateCheckoutAction(packageKey: string): Promise<CheckoutResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Your session has expired." };

  const env = getServerEnv();
  if (!isPaystackConfigured(env)) {
    return { error: "Payments are not configured yet." };
  }

  const { data: pkg } = await supabase
    .from("pricing_packages")
    .select("key, credits, price_kobo, currency")
    .eq("key", packageKey)
    .eq("active", true)
    .maybeSingle();

  if (!pkg) return { error: "That package is no longer available." };

  const reference = `notaflow_${randomUUID()}`;
  const admin = createAdminClient();

  const { error: insertError } = await admin.from("transactions").insert({
    user_id: user.id,
    reference,
    package_key: pkg.key,
    amount_kobo: pkg.price_kobo,
    currency: pkg.currency,
    status: "pending",
    credits: pkg.credits,
  });

  if (insertError) return { error: "Could not start checkout. Please try again." };

  try {
    const { authorizationUrl } = await initializeTransaction({
      email: user.email,
      amountKobo: pkg.price_kobo,
      reference,
      callbackUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing/callback`,
      metadata: { user_id: user.id, package_key: pkg.key },
    });
    return { url: authorizationUrl };
  } catch (error) {
    await admin.from("transactions").update({ status: "failed" }).eq("reference", reference);
    return {
      error:
        error instanceof PaystackError
          ? error.message
          : "Could not start checkout. Please try again.",
    };
  }
}

export type BankTransferResult = { transactionId: string } | { error: string };

export async function initiateBankTransferAction(packageKey: string): Promise<BankTransferResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session has expired." };

  const { data: pkg } = await supabase
    .from("pricing_packages")
    .select("key, credits, price_kobo, currency")
    .eq("key", packageKey)
    .eq("active", true)
    .maybeSingle();

  if (!pkg) return { error: "That package is no longer available." };

  const admin = createAdminClient();
  const { data: created, error } = await admin
    .from("transactions")
    .insert({
      user_id: user.id,
      reference: generateTransferReference(),
      package_key: pkg.key,
      amount_kobo: pkg.price_kobo,
      currency: pkg.currency,
      status: "pending",
      credits: pkg.credits,
      provider: "bank_transfer",
    })
    .select("id")
    .single();

  if (error || !created) return { error: "Could not start this payment. Please try again." };

  return { transactionId: created.id };
}

export type UploadReceiptResult = { success: true } | { error: string };

export async function uploadReceiptAction(formData: FormData): Promise<UploadReceiptResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session has expired." };

  const transactionId = formData.get("transactionId") as string;
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) return { error: "No file selected." };
  if (file.size > 10 * 1024 * 1024) return { error: "File must be under 10MB." };

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadReceipt(transactionId, user.id, buffer, file.type);
    revalidatePath(`/dashboard/billing/pay/${transactionId}`);
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof UnsupportedReceiptTypeError ? error.message : "Upload failed.",
    };
  }
}
