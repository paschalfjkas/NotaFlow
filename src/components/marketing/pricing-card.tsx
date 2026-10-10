import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatKobo } from "@/lib/payments/format";

export function PricingCard({
  name,
  credits,
  priceKobo,
  free,
}: {
  name: string;
  credits: number;
  priceKobo: number;
  free?: boolean;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-indigo-300 bg-background p-6 shadow-md ring-1 ring-indigo-100 dark:border-indigo-700 dark:ring-indigo-900">
      <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">{name}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight">
        {free ? "₦0" : formatKobo(priceKobo)}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {credits} report{credits > 1 ? "s" : ""}
      </p>
      <ul className="mt-5 flex-1 space-y-2 text-sm">
        <li className="flex items-center gap-2">
          <Check className="size-4 text-green-600 dark:text-green-400" /> Full academic structure
        </li>
        <li className="flex items-center gap-2">
          <Check className="size-4 text-green-600 dark:text-green-400" /> Editable chapters
        </li>
        <li className="flex items-center gap-2">
          <Check className="size-4 text-green-600 dark:text-green-400" /> Word (.docx) export
        </li>
      </ul>
      <Button className="mt-6" asChild>
        <Link href="/register">{free ? "Get started free" : "Buy credits"}</Link>
      </Button>
    </div>
  );
}
