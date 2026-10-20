import "server-only";
import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { receiptPath, uploadFile } from "@/lib/storage";

export type PaymentSettings = {
  bank_name: string;
  account_number: string;
  account_name: string;
  instructions: string;
};

/** True once the admin has actually filled in an account to pay into. */
export function isPaymentSettingsConfigured(settings: PaymentSettings | null): boolean {
  return !!settings?.bank_name && !!settings?.account_number && !!settings?.account_name;
}

export async function getPaymentSettings(): Promise<PaymentSettings | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_settings")
    .select("bank_name, account_number, account_name, instructions")
    .eq("id", "default")
    .maybeSingle();
  return data;
}

export async function updatePaymentSettings(settings: PaymentSettings): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("payment_settings")
    .update(settings)
    .eq("id", "default");
  if (error) throw error;
}

// Short, easy to type into a bank app's transfer narration — not a security
// token, just a reconciliation aid for matching a transfer to a student.
export function generateTransferReference(): string {
  return `NF-${randomBytes(4).toString("hex").toUpperCase()}`;
}

const ALLOWED_RECEIPT_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export class UnsupportedReceiptTypeError extends Error {
  constructor() {
    super("Unsupported file type — please upload a PNG, JPG, WEBP, or PDF.");
  }
}

export class TransactionNotFoundError extends Error {
  constructor() {
    super("Transaction not found.");
  }
}

/**
 * Attaches a receipt to the student's own pending bank-transfer transaction.
 * Ownership is checked with the user-scoped client BEFORE touching storage
 * (uploadFile uses the admin client, which bypasses RLS entirely) — same
 * defensive order as uploadScreenshotImage().
 */
export async function uploadReceipt(
  transactionId: string,
  userId: string,
  file: Buffer,
  mimeType: string
): Promise<void> {
  const ext = ALLOWED_RECEIPT_TYPES[mimeType];
  if (!ext) throw new UnsupportedReceiptTypeError();

  const supabase = await createClient();
  const { data: owned } = await supabase
    .from("transactions")
    .select("id")
    .eq("id", transactionId)
    .eq("user_id", userId)
    .eq("provider", "bank_transfer")
    .maybeSingle();

  if (!owned) throw new TransactionNotFoundError();

  const path = receiptPath(transactionId, ext);
  await uploadFile(path, file, mimeType);

  const admin = createAdminClient();
  const { error } = await admin
    .from("transactions")
    .update({ receipt_storage_path: path })
    .eq("id", transactionId);
  if (error) throw error;
}
