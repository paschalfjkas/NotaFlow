import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getPaymentSettings, isPaymentSettingsConfigured } from "@/lib/payments/bank-transfer";
import { formatKobo } from "@/lib/payments/format";
import { BillingPackages } from "@/components/dashboard/billing-packages";
import { TransactionStatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Buy Credits" };
export const instant = false;

export default async function BillingPage() {
  const { user } = await requireUser();
  const supabase = await createClient();

  const [{ data: packages }, settings, { data: pendingPayments }] = await Promise.all([
    supabase
      .from("pricing_packages")
      .select("key, name, credits, price_kobo")
      .eq("active", true)
      .order("sort_order"),
    getPaymentSettings(),
    supabase
      .from("transactions")
      .select("id, reference, package_key, amount_kobo, status, receipt_storage_path, created_at")
      .eq("user_id", user.id)
      .eq("provider", "bank_transfer")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const settingsReady = isPaymentSettingsConfigured(settings);

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Buy Report Credits</h1>
        <p className="mt-1 text-muted-foreground">
          Pick a package, pay by bank transfer, then upload your receipt — credits are added once
          we confirm the payment.
        </p>
      </div>

      {!settingsReady ? (
        <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
          Payments aren&apos;t configured yet. Check back soon.
        </p>
      ) : packages && packages.length > 0 ? (
        <BillingPackages packages={packages} />
      ) : (
        <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
          No packages are available right now.
        </p>
      )}

      {pendingPayments && pendingPayments.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Your payments</h2>
          <div className="space-y-2">
            {pendingPayments.map((t) => (
              <div
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
              >
                <div>
                  <p className="font-mono text-xs text-muted-foreground">{t.reference}</p>
                  <p>
                    {formatKobo(t.amount_kobo)} · {format(new Date(t.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <TransactionStatusBadge status={t.status} />
                  {t.status === "pending" && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/billing/pay/${t.id}`}>
                        {t.receipt_storage_path ? "View" : "Upload receipt"}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
