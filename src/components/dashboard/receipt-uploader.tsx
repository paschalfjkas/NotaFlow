"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { uploadReceiptAction } from "@/app/dashboard/billing/actions";
import { Button } from "@/components/ui/button";

export function ReceiptUploader({
  transactionId,
  hasReceipt,
}: {
  transactionId: string;
  hasReceipt: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploaded, setUploaded] = useState(hasReceipt);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("transactionId", transactionId);
      formData.set("file", file);
      const result = await uploadReceiptAction(formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setUploaded(true);
      toast.success("Receipt uploaded — we'll review it shortly.");
      router.refresh();
    });
    e.target.value = "";
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {uploaded
          ? "Receipt uploaded. You can replace it below if you need to."
          : "Upload a photo or PDF of your payment receipt."}
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mr-1.5 size-4" aria-hidden="true" />
        {isPending ? "Uploading…" : uploaded ? "Replace receipt" : "Upload receipt"}
      </Button>
    </div>
  );
}
