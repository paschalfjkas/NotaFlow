"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updatePaymentSettingsAction } from "@/app/admin/payments/actions";
import type { PaymentSettings } from "@/lib/payments/bank-transfer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function PaymentSettingsForm({ initial }: { initial: PaymentSettings }) {
  const [settings, setSettings] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await updatePaymentSettingsAction(settings);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Payment settings saved.");
    });
  }

  return (
    <div className="rounded-xl border bg-background p-5">
      <p className="mb-4 text-sm font-semibold text-muted-foreground">
        Account students pay into
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="bank_name">Bank name</Label>
          <Input
            id="bank_name"
            value={settings.bank_name}
            onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="account_number">Account number</Label>
          <Input
            id="account_number"
            value={settings.account_number}
            onChange={(e) => setSettings({ ...settings, account_number: e.target.value })}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="account_name">Account name</Label>
          <Input
            id="account_name"
            value={settings.account_name}
            onChange={(e) => setSettings({ ...settings, account_name: e.target.value })}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="instructions">Extra instructions (optional)</Label>
          <Textarea
            id="instructions"
            rows={2}
            value={settings.instructions}
            onChange={(e) => setSettings({ ...settings, instructions: e.target.value })}
            placeholder="e.g. Transfers usually confirm within a few hours"
          />
        </div>
      </div>
      <Button className="mt-4" disabled={isPending} onClick={handleSave}>
        {isPending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
