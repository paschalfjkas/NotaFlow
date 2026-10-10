"use client";

import { useState, useTransition } from "react";
import { Download, Eye, Pencil } from "lucide-react";
import { toast } from "sonner";
import { downloadDocxAction } from "@/app/report/[reportId]/actions";
import type { SectionRow } from "@/lib/sections";
import type { ScreenshotRow } from "@/lib/screenshots";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { SectionEditor } from "@/components/report/section-editor";
import { ReportViewer } from "@/components/report/report-viewer";

const CHAPTER_LABELS: Record<number, string> = {
  1: "Chapter 1 — Introduction",
  2: "Chapter 2 — Company Profile",
  3: "Chapter 3 — Industrial Experience",
  4: "Chapter 4 — Challenges",
  5: "Chapter 5 — Summary & Conclusion",
};

export function ReportEditor({
  reportId,
  sections,
  screenshots,
  imageUrls,
}: {
  reportId: string;
  sections: SectionRow[];
  screenshots: ScreenshotRow[];
  imageUrls: Record<string, string>;
}) {
  const chapterNumbers = Array.from(
    new Set(sections.filter((s) => s.chapter_number !== null).map((s) => s.chapter_number!))
  ).sort((a, b) => a - b);

  const [selected, setSelected] = useState<"preliminary" | number>("preliminary");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [isDownloading, startDownload] = useTransition();

  const visibleSections =
    selected === "preliminary"
      ? sections.filter((s) => s.chapter_number === null).sort((a, b) => a.order_index - b.order_index)
      : sections
          .filter((s) => s.chapter_number === selected)
          .sort((a, b) => a.order_index - b.order_index);

  const screenshotsBySection = new Map<string, ScreenshotRow[]>();
  for (const shot of screenshots) {
    if (!shot.section_id) continue;
    const list = screenshotsBySection.get(shot.section_id) ?? [];
    list.push(shot);
    screenshotsBySection.set(shot.section_id, list);
  }

  function handleDownload() {
    startDownload(async () => {
      const result = await downloadDocxAction(reportId);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      window.location.href = result.url;
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex gap-1.5 rounded-lg border p-1">
          <Button
            type="button"
            size="sm"
            variant={mode === "edit" ? "default" : "ghost"}
            onClick={() => setMode("edit")}
          >
            <Pencil className="mr-1 size-3.5" /> Edit
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "preview" ? "default" : "ghost"}
            onClick={() => setMode("preview")}
          >
            <Eye className="mr-1 size-3.5" /> Preview
          </Button>
        </div>
        <Button type="button" onClick={handleDownload} disabled={isDownloading}>
          <Download className="mr-1.5 size-4" /> {isDownloading ? "Preparing…" : "Download .docx"}
        </Button>
      </div>

      {mode === "preview" ? (
        <div className="rounded-xl border bg-background p-6 sm:p-10">
          <ReportViewer sections={sections} />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[200px_1fr]">
          <nav
            role="tablist"
            aria-label="Report sections"
            className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible"
          >
            <button
              role="tab"
              aria-selected={selected === "preliminary"}
              onClick={() => setSelected("preliminary")}
              className={cn(
                "shrink-0 rounded-md px-3 py-2 text-left text-sm font-medium",
                selected === "preliminary"
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              Preliminary Pages
            </button>
            {chapterNumbers.map((num) => (
              <button
                key={num}
                role="tab"
                aria-selected={selected === num}
                onClick={() => setSelected(num)}
                className={cn(
                  "shrink-0 rounded-md px-3 py-2 text-left text-sm font-medium",
                  selected === num
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {CHAPTER_LABELS[num] ?? `Chapter ${num}`}
              </button>
            ))}
          </nav>

          <div className="space-y-4">
            {visibleSections.map((section) => (
              <SectionEditor
                key={section.id}
                reportId={reportId}
                section={section}
                screenshots={screenshotsBySection.get(section.id) ?? []}
                imageUrls={imageUrls}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
