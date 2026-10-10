import { Suspense } from "react";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Features } from "@/components/marketing/features";
import { FreeTrial } from "@/components/marketing/free-trial";
import { Pricing, PricingSkeleton } from "@/components/marketing/pricing";
import { Faq } from "@/components/marketing/faq";

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Features />
      <FreeTrial />
      <Suspense fallback={<PricingSkeleton />}>
        <Pricing />
      </Suspense>
      <Faq />
    </>
  );
}
