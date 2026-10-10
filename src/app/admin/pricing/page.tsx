import { createAdminClient } from "@/lib/supabase/admin";
import { PricingTable } from "@/components/admin/pricing-table";

export const instant = false;

export default async function AdminPricingPage() {
  const admin = createAdminClient();

  const { data: packages } = await admin
    .from("pricing_packages")
    .select("id, key, name, credits, price_kobo, active, sort_order")
    .order("sort_order");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pricing</h1>
        <p className="mt-1 text-muted-foreground">
          Manage the credit packages students can buy on{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">/dashboard/billing</code>.
        </p>
      </div>
      <PricingTable packages={packages ?? []} />
    </div>
  );
}
