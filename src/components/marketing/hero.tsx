import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/60 to-background dark:from-indigo-950/30">
      <Image
        src="/images/hero-reports.webp"
        alt=""
        aria-hidden
        fill
        priority
        className="object-cover opacity-15 dark:opacity-10"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />

      <div className="relative mx-auto max-w-3xl px-4 py-20 sm:px-6 md:py-28">
        <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl md:text-5xl">
          Generate Your SIWES Report Without Starting From Scratch.
        </h1>
        <p className="mt-5 max-w-lg text-lg text-muted-foreground">
          Answer a few questions about your internship and let AI turn your experience
          into a structured, professional SIWES report.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/register">Generate My Report</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#how-it-works">See How It Works</Link>
          </Button>
        </div>
        <p className="mt-4 flex items-center gap-2 text-sm font-medium text-indigo-700 dark:text-indigo-400">
          <CheckCircle2 className="size-4" /> Your first report is completely free
        </p>
      </div>
    </section>
  );
}
