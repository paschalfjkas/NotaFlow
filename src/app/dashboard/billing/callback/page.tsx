import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { verifyTransaction } from "@/lib/payments/paystack";
import { fulfillTransaction, markTransactionFailed } from "@/lib/payments/fulfill";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Confirming payment" };
export const instant = false;

function CallbackResult({
  success,
  message,
  reference,
}: {
  success: boolean;
  message: string;
  reference?: string;
}) {
  return (
    <div className="mx-auto max-w-md rounded-xl border bg-background p-8 text-center">
      {success ? (
        <CheckCircle2 className="mx-auto size-10 text-green-600 dark:text-green-400" />
      ) : (
        <XCircle className="mx-auto size-10 text-red-600 dark:text-red-400" />
      )}
      <h1 className="mt-4 text-lg font-semibold">
        {success ? "Payment successful" : "Payment not completed"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      {reference && (
        <p className="mt-2 text-xs text-muted-foreground">Reference: {reference}</p>
      )}
      <Button className="mt-6" asChild>
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}

export default async function BillingCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  await requireUser();
  const { reference } = await searchParams;

  if (!reference) {
    return <CallbackResult success={false} message="No payment reference was provided." />;
  }

  // Confirm this reference is the signed-in user's own transaction before
  // doing anything else. RLS (`transactions_select_own`) already restricts
  // this select to rows the caller owns, so a reference belonging to
  // someone else (e.g. seen in a shared link or browser history) simply
  // comes back empty here — it never reaches verifyTransaction/
  // fulfillTransaction, which don't themselves check who's asking.
  const supabase = await createClient();
  const { data: ownTransaction } = await supabase
    .from("transactions")
    .select("id")
    .eq("reference", reference)
    .maybeSingle();

  if (!ownTransaction) {
    return (
      <CallbackResult success={false} message="We couldn't find this payment on your account." />
    );
  }

  let outcome: { success: boolean; message: string; showReference?: boolean };
  try {
    const verified = await verifyTransaction(reference);

    if (verified.status === "success") {
      await fulfillTransaction(reference, verified.raw);
      outcome = {
        success: true,
        message: "Your payment is confirmed and your credits have been added.",
      };
    } else {
      await markTransactionFailed(reference, verified.raw);
      outcome = {
        success: false,
        message:
          "Your payment wasn't completed, so you haven't been charged. You can try again from the dashboard.",
      };
    }
  } catch {
    outcome = {
      success: false,
      message:
        "We couldn't confirm this payment right now. If you were charged, contact support with the reference below.",
      showReference: true,
    };
  }

  return (
    <CallbackResult
      success={outcome.success}
      message={outcome.message}
      reference={outcome.showReference ? reference : undefined}
    />
  );
}
