"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { approveBankTransferAction, rejectBankTransferAction } from "@/app/admin/payments/actions";
import { formatKobo } from "@/lib/payments/format";
import { Button } from "@/components/ui/button";

export type PendingPayment = {
  id: string;
  reference: string;
  email: string;
  packageKey: string;
  amountKobo: number;
  credits: number;
  createdAt: string;
  receiptUrl: string | null;
};

function PendingPaymentRow({ payment }: { payment: PendingPayment }) {
  const [isPending, startTransition] = useTransition();
  const [resolved, setResolved] = useState(false);

  function handleApprove() {
    startTransition(async () => {
      const result = await approveBankTransferAction(payment.id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`Granted ${payment.credits} credit${payment.credits > 1 ? "s" : ""} to ${payment.email}.`);
      setResolved(true);
    });
  }

  function handleReject() {
    startTransition(async () => {
      const result = await rejectBankTransferAction(payment.id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`Rejected payment from ${payment.email}.`);
      setResolved(true);
    });
  }

  if (resolved) return null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1 text-sm">
        <p className="font-medium">{payment.email}</p>
        <p className="text-muted-foreground">
          {payment.packageKey} · {formatKobo(payment.amountKobo)} · {payment.credits} credit
          {payment.credits > 1 ? "s" : ""}
        </p>
        <p className="font-mono text-xs text-muted-foreground">
          {payment.reference} · {format(new Date(payment.createdAt), "MMM d, yyyy")}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {payment.receiptUrl ? (
          <Button variant="outline" size="sm" asChild>
            <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer">
              View receipt
            </a>
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">No receipt yet</span>
        )}
        <Button
          size="sm"
          disabled={isPending || !payment.receiptUrl}
          onClick={handleApprove}
          aria-label={`Approve payment from ${payment.email}`}
        >
          <Check className="size-4" aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={handleReject}
          aria-label={`Reject payment from ${payment.email}`}
        >
          <X className="size-4 text-destructive" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

export function PendingPaymentsList({ payments }: { payments: PendingPayment[] }) {
  if (payments.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
        Nothing waiting on review.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <PendingPaymentRow key={payment.id} payment={payment} />
      ))}
    </div>
  );
}
