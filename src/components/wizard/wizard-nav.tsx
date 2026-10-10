import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WizardNav({
  backHref,
  isSubmitting,
  continueLabel = "Continue",
}: {
  backHref: string | null;
  isSubmitting?: boolean;
  continueLabel?: string;
}) {
  return (
    <div className="mt-8 flex items-center justify-between">
      {backHref ? (
        <Button type="button" variant="ghost" asChild>
          <Link href={backHref}>
            <ArrowLeft className="mr-1 size-4" /> Back
          </Link>
        </Button>
      ) : (
        <span />
      )}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : continueLabel}
      </Button>
    </div>
  );
}
