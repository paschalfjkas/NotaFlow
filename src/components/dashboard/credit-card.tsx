import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function CreditCard({
  freeCredits,
  paidCredits,
}: {
  freeCredits: number;
  paidCredits: number;
}) {
  const total = freeCredits + paidCredits;

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 py-5">
        <div className="flex items-center gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="size-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Report credits</p>
            {total > 0 ? (
              <p className="text-lg font-semibold">
                {freeCredits > 0
                  ? `${freeCredits} Free Generation${freeCredits > 1 ? "s" : ""}`
                  : `${paidCredits} Report Credit${paidCredits > 1 ? "s" : ""}`}
              </p>
            ) : (
              <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">No credits remaining</p>
            )}
          </div>
        </div>
        <Link
          href="/dashboard/billing"
          className="shrink-0 text-sm font-medium text-indigo-700 hover:underline dark:text-indigo-400"
        >
          Buy credits
        </Link>
      </CardContent>
    </Card>
  );
}
