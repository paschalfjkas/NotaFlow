"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { initiateCheckoutAction } from "@/app/dashboard/billing/actions";
import { formatKobo } from "@/lib/payments/format";
import { Button } from "@/components/ui/button";

export function BillingPackages({
  packages,
}: {
  packages: { key: string; name: string; credits: number; price_kobo: number }[];
}) {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleBuy(key: string) {
    setLoadingKey(key);
    startTransition(async () => {
      const result = await initiateCheckoutAction(key);
      if ("error" in result) {
        toast.error(result.error);
        setLoadingKey(null);
        return;
      }
      window.location.href = result.url;
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {packages.map((pkg) => (
        <div
          key={pkg.key}
          className="flex flex-col rounded-xl border border-indigo-300 bg-background p-5 ring-1 ring-indigo-100 dark:border-indigo-700 dark:ring-indigo-900"
        >
          <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">{pkg.name}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight">{formatKobo(pkg.price_kobo)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {pkg.credits} report{pkg.credits > 1 ? "s" : ""}
          </p>
          <Button
            className="mt-5"
            disabled={isPending && loadingKey === pkg.key}
            onClick={() => handleBuy(pkg.key)}
          >
            {isPending && loadingKey === pkg.key ? "Redirecting…" : "Buy Now"}
          </Button>
        </div>
      ))}
    </div>
  );
}
