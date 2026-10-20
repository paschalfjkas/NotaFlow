import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getPaymentSettings } from "@/lib/payments/bank-transfer";
import { formatKobo } from "@/lib/payments/format";
import { TransactionStatusBadge } from "@/components/admin/status-badge";
import { ReceiptUploader } from "@/components/dashboard/receipt-uploader";

export const metadata: Metadata = { title: "Complete Payment" };
export const instant = false;

export default async function PayPage({
  params,
}: {
  params: Promise<{ transactionId: string }>;
}) {
  const { transactionId } = await params;
  const { user } = await requireUser();
  const supabase = await createClient();

  const { data: transaction } = await supabase
    .from("transactions")
    .select("id, reference, amount_kobo, credits, status, receipt_storage_path")
    .eq("id", transactionId)
    .eq("user_id", user.id)
    .eq("provider", "bank_transfer")
    .maybeSingle();

  if (!transaction) notFound();

  const settings = await getPaymentSettings();

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Complete Payment</h1>
        <p className="mt-1 text-muted-foreground">
          {transaction.credits} report{transaction.credits > 1 ? "s" : ""} ·{" "}
          {formatKobo(transaction.amount_kobo)}
        </p>
      </div>

      <div className="rounded-xl border bg-background p-5">
        <p className="mb-3 text-sm font-semibold text-muted-foreground">Pay into this account</p>
        {settings?.account_number ? (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Bank</dt>
              <dd className="font-medium">{settings.bank_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Account number</dt>
              <dd className="font-mono font-medium">{settings.account_number}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Account name</dt>
              <dd className="font-medium">{settings.account_name}</dd>
            </div>
            {settings.instructions && (
              <p className="pt-2 text-muted-foreground">{settings.instructions}</p>
            )}
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">
            Payment details aren&apos;t available right now — please check back shortly.
          </p>
        )}
        <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          Include <span className="font-mono font-semibold">{transaction.reference}</span> in your
          transfer description so we can match your payment.
        </div>
      </div>

      <div className="rounded-xl border bg-background p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground">Status</p>
          <TransactionStatusBadge status={transaction.status} />
        </div>
        {transaction.status === "pending" ? (
          <ReceiptUploader
            transactionId={transaction.id}
            hasReceipt={!!transaction.receipt_storage_path}
          />
        ) : transaction.status === "success" ? (
          <p className="text-sm text-muted-foreground">
            Payment confirmed — your credits have been added.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            This payment couldn&apos;t be confirmed. Contact support if you believe this is a
            mistake.
          </p>
        )}
      </div>
    </div>
  );
}
