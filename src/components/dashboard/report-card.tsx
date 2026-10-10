import Link from "next/link";
import { format } from "date-fns";
import { Download, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ReportStatus } from "@/types/database";

const STATUS_STYLES: Record<ReportStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  generating: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400",
  completed: "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400",
  failed: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400",
};

const STATUS_LABEL: Record<ReportStatus, string> = {
  draft: "Draft",
  generating: "Generating",
  completed: "Completed",
  failed: "Failed",
};

export function ReportCard({
  id,
  title,
  status,
  createdAt,
  hasDocx,
}: {
  id: string;
  title: string;
  status: ReportStatus;
  createdAt: string;
  hasDocx: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <FileText className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Generated {format(new Date(createdAt), "MMM d, yyyy")}</span>
              <Badge variant="secondary" className={STATUS_STYLES[status]}>
                {STATUS_LABEL[status]}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/report/${id}`}>Open</Link>
          </Button>
          {hasDocx && (
            <Button size="sm" asChild>
              <Link href={`/report/${id}/download`}>
                <Download className="mr-1 size-4" /> Download
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
