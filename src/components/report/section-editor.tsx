"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  regenerateSectionAction,
  removeSectionTableAction,
  rewriteSectionAction,
  updateSectionAction,
} from "@/app/report/[reportId]/actions";
import { REWRITE_MODE_LABELS, type RewriteMode } from "@/lib/ai/prompts/section-edit";
import type { SectionRow } from "@/lib/sections";
import type { ScreenshotRow } from "@/lib/screenshots";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SectionHistory } from "@/components/report/section-history";
import { ScreenshotManager } from "@/components/report/screenshot-manager";

const REWRITE_MODES: RewriteMode[] = [
  "improve",
  "natural",
  "academic",
  "shorten",
  "expand",
  "fix_grammar",
];

export function SectionEditor({
  reportId,
  section,
  screenshots,
  imageUrls,
}: {
  reportId: string;
  section: SectionRow;
  screenshots: ScreenshotRow[];
  imageUrls: Record<string, string>;
}) {
  const [content, setContent] = useState(section.content);
  const [version, setVersion] = useState(section.version);
  const [tableData, setTableData] = useState(section.table_data);
  const [isSaving, startSaving] = useTransition();
  const [isAiBusy, startAi] = useTransition();
  const [isRemovingTable, startRemoveTable] = useTransition();
  const isDirty = content !== section.content;

  function handleRemoveTable() {
    startRemoveTable(async () => {
      const result = await removeSectionTableAction(section.id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setTableData(null);
      toast.success("Table removed.");
    });
  }

  function handleSave() {
    startSaving(async () => {
      const result = await updateSectionAction(section.id, content);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setVersion(result.data.version);
      toast.success("Saved.");
    });
  }

  function handleRewrite(mode: RewriteMode) {
    startAi(async () => {
      const result = await rewriteSectionAction(section.id, mode);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setContent(result.data.content);
      setVersion(result.data.version);
      toast.success(`${REWRITE_MODE_LABELS[mode]} applied.`);
    });
  }

  function handleRegenerate() {
    startAi(async () => {
      const result = await regenerateSectionAction(section.id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setContent(result.data.content);
      setVersion(result.data.version);
      toast.success("Section regenerated.");
    });
  }

  return (
    <div className="rounded-xl border bg-background p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{section.title}</h3>
        <div className="flex items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" disabled={isAiBusy}>
                {isAiBusy ? (
                  <Loader2 className="mr-1 size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="mr-1 size-3.5" />
                )}
                AI actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleRegenerate}>
                Regenerate this section
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {REWRITE_MODES.map((mode) => (
                <DropdownMenuItem key={mode} onClick={() => handleRewrite(mode)}>
                  {REWRITE_MODE_LABELS[mode]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <SectionHistory
            sectionId={section.id}
            currentVersion={version}
            onReverted={(revertedContent) => setContent(revertedContent)}
          />
          <Button type="button" size="sm" disabled={!isDirty || isSaving} onClick={handleSave}>
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={8}
        className="resize-y font-serif text-sm leading-relaxed"
        disabled={isAiBusy}
      />

      {tableData && (
        <div className="mt-4 rounded-lg border p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              Table included in this section: {tableData.caption}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isRemovingTable}
              onClick={handleRemoveTable}
            >
              {isRemovingTable ? "Removing…" : "Remove table"}
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {tableData.headers.map((header, i) => (
                    <th key={i} className="border bg-muted px-2 py-1 text-left font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row, i) => (
                  <tr key={i}>
                    {tableData.headers.map((_, j) => (
                      <td key={j} className="border px-2 py-1">
                        {row[j] ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ScreenshotManager
        reportId={reportId}
        sectionId={section.id}
        screenshots={screenshots}
        imageUrls={imageUrls}
      />
    </div>
  );
}
