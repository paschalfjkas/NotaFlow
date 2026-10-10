import Link from "next/link";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FreeTrial() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-indigo-100 dark:border-indigo-900 bg-indigo-50/60 dark:bg-indigo-950/30 px-6 py-12 text-center">
        <Gift className="size-10 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Your first report is FREE.
        </h2>
        <p className="max-w-xl text-muted-foreground">
          Generate your first SIWES report at no cost. Pay only when you need another one.
        </p>
        <Button size="lg" asChild className="mt-2">
          <Link href="/register">Claim My Free Report</Link>
        </Button>
      </div>
    </section>
  );
}
