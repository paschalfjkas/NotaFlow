import { createClient } from "@/lib/supabase/server";
import { PricingCard } from "@/components/marketing/pricing-card";
import { Skeleton } from "@/components/ui/skeleton";

export function PricingSkeleton() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Simple, student-friendly pricing
        </h2>
        <p className="mt-3 text-muted-foreground">
          Your first report is free. Pay only when you need more.
        </p>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-72 rounded-xl" />
        ))}
      </div>
    </section>
  );
}

export async function Pricing() {
  let packages: { key: string; name: string; credits: number; price_kobo: number }[] = [];
  let loadError = false;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("pricing_packages")
      .select("key, name, credits, price_kobo")
      .eq("active", true)
      .order("sort_order");

    if (error) throw error;
    packages = data ?? [];
  } catch {
    loadError = true;
  }

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Simple, student-friendly pricing
        </h2>
        <p className="mt-3 text-muted-foreground">
          Your first report is free. Pay only when you need more.
        </p>
      </div>

      {loadError ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Pricing is being configured. Connect Supabase to display live packages — see{" "}
          <code className="rounded bg-muted px-1.5 py-0.5">.env.example</code>.
        </p>
      ) : (
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <PricingCard name="Free" credits={1} priceKobo={0} free />
          {packages.map((pkg) => (
            <PricingCard
              key={pkg.key}
              name={pkg.name}
              credits={pkg.credits}
              priceKobo={pkg.price_kobo}
            />
          ))}
        </div>
      )}
    </section>
  );
}
