"use client";

import { useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { History } from "lucide-react";
import { toast } from "sonner";
import { getSectionVersionsAction, revertSectionVersionAction } from "@/app/report/[reportId]/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type VersionRow = { id: string; content: string; version: number; created_at: string };

export function SectionHistory({
  sectionId,
  currentVersion,
  onReverted,
}: {
  sectionId: string;
  currentVersion: number;
  onReverted: (content: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<VersionRow[] | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleOpen(next: boolean) {
    setOpen(next);
    if (next && versions === null) {
      const data = await getSectionVersionsAction(sectionId);
      setVersions(data as VersionRow[]);
    }
  }

  function handleRevert(content: string) {
    startTransition(async () => {
      const result = await revertSectionVersionAction(sectionId, content);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      onReverted(content);
      setVersions(null);
      setOpen(false);
      toast.success("Reverted to the previous version.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm">
          <History className="mr-1 size-3.5" /> History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Previous versions</DialogTitle>
        </DialogHeader>
        {versions === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : versions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No earlier versions yet — edits and AI rewrites will show up here.
          </p>
        ) : (
          <div className="space-y-3">
            {versions.map((v) => (
              <div key={v.id} className="rounded-lg border p-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Version {v.version} · {formatDistanceToNow(new Date(v.created_at), { addSuffix: true })}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => handleRevert(v.content)}
                  >
                    Revert to this
                  </Button>
                </div>
                <p className="line-clamp-3 text-sm text-muted-foreground">{v.content}</p>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">Current version: {currentVersion}</p>
      </DialogContent>
    </Dialog>
  );
}
