import { createAdminClient } from "@/lib/supabase/admin";
import { getSignedUrl } from "@/lib/storage";
import { PaymentSettingsForm } from "@/components/admin/payment-settings-form";
import { PendingPaymentsList, type PendingPayment } from "@/components/admin/pending-payments-list";

export const instant = false;

export default async function AdminPaymentsPage() {
  const admin = createAdminClient();

  const [{ data: settings }, { data: pending }] = await Promise.all([
    admin
      .from("payment_settings")
      .select("bank_name, account_number, account_name, instructions")
      .eq("id", "default")
      .maybeSingle(),
    admin
      .from("transactions")
      .select("id, reference, user_id, package_key, amount_kobo, credits, receipt_storage_path, created_at")
      .eq("provider", "bank_transfer")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
  ]);

  const userIds = Array.from(new Set((pending ?? []).map((t) => t.user_id)));
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, email").in("id", userIds)
    : { data: [] as { id: string; email: string }[] };
  const emailById = new Map((profiles ?? []).map((p) => [p.id, p.email]));

  const payments: PendingPayment[] = await Promise.all(
    (pending ?? []).map(async (t) => ({
      id: t.id,
      reference: t.reference,
      email: emailById.get(t.user_id) ?? t.user_id,
      packageKey: t.package_key,
      amountKobo: t.amount_kobo,
      credits: t.credits,
      createdAt: t.created_at,
      receiptUrl: t.receipt_storage_path ? await getSignedUrl(t.receipt_storage_path) : null,
    }))
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
        <p className="mt-1 text-muted-foreground">
          Review bank-transfer receipts and grant credits once a payment is confirmed.
        </p>
      </div>

      <PaymentSettingsForm
        initial={{
          bank_name: settings?.bank_name ?? "",
          account_number: settings?.account_number ?? "",
          account_name: settings?.account_name ?? "",
          instructions: settings?.instructions ?? "",
        }}
      />

      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          Awaiting review ({payments.length})
        </h2>
        <PendingPaymentsList payments={payments} />
      </div>
    </div>
  );
}
