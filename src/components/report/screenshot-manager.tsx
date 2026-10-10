"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  addScreenshotAction,
  deleteScreenshotAction,
  updateScreenshotCaptionAction,
  uploadScreenshotAction,
} from "@/app/report/[reportId]/actions";
import type { ScreenshotRow } from "@/lib/screenshots";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function ScreenshotItem({
  reportId,
  screenshot,
  imageUrl,
}: {
  reportId: string;
  screenshot: ScreenshotRow;
  imageUrl: string | null;
}) {
  const [caption, setCaption] = useState(screenshot.caption);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("reportId", reportId);
      formData.set("screenshotId", screenshot.id);
      formData.set("file", file);
      const result = await uploadScreenshotAction(formData);
      if ("error" in result) toast.error(result.error);
    });
    e.target.value = "";
  }

  function handleCaptionBlur() {
    if (caption === screenshot.caption) return;
    startTransition(async () => {
      await updateScreenshotCaptionAction(reportId, screenshot.id, caption);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteScreenshotAction(reportId, screenshot.id);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
        {imageUrl ? (
          <Image src={imageUrl} alt={screenshot.caption} width={64} height={64} className="size-full object-cover" unoptimized />
        ) : (
          <ImagePlus className="size-5 text-muted-foreground" />
        )}
      </div>
      <Input
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        onBlur={handleCaptionBlur}
        placeholder="Caption"
        className="flex-1"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/bmp"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mr-1 size-3.5" /> {screenshot.storage_path ? "Replace" : "Upload"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={isPending}
        onClick={handleDelete}
        aria-label={`Delete screenshot: ${screenshot.caption}`}
      >
        <Trash2 className="size-4 text-destructive" aria-hidden="true" />
      </Button>
    </div>
  );
}

export function ScreenshotManager({
  reportId,
  sectionId,
  screenshots,
  imageUrls,
}: {
  reportId: string;
  sectionId: string;
  screenshots: ScreenshotRow[];
  imageUrls: Record<string, string>;
}) {
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    startTransition(async () => {
      const result = await addScreenshotAction(reportId, sectionId, "New screenshot");
      if (result && "error" in result) toast.error(result.error);
    });
  }

  return (
    <div className="mt-4 space-y-2">
      {screenshots.map((shot) => (
        <ScreenshotItem
          key={shot.id}
          reportId={reportId}
          screenshot={shot}
          imageUrl={shot.storage_path ? (imageUrls[shot.id] ?? null) : null}
        />
      ))}
      <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={handleAdd}>
        <ImagePlus className="mr-1 size-3.5" /> Add screenshot placeholder
      </Button>
    </div>
  );
}
