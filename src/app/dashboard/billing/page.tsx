import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getServerEnv, isPaystackConfigured } from "@/lib/env";
import { BillingPackages } from "@/components/dashboard/billing-packages";

export const metadata: Metadata = { title: "Buy Credits" };
export const instant = false;

export default async function BillingPage() {
  await requireUser();
  const supabase = await createClient();

  const { data: packages } = await supabase
    .from("pricing_packages")
    .select("key, name, credits, price_kobo")
    .eq("active", true)
    .order("sort_order");

  const paystackReady = isPaystackConfigured(getServerEnv());

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Buy Report Credits</h1>
        <p className="mt-1 text-muted-foreground">
          Pick a package below — payment is handled securely by Paystack.
        </p>
      </div>

      {!paystackReady ? (
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
    </div>
  );
}
