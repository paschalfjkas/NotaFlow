import { Badge } from "@/components/ui/badge";
import type { ReportStatus, TransactionStatus } from "@/types/database";

const REPORT_STATUS_STYLES: Record<ReportStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  generating: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400",
  completed: "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400",
  failed: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400",
};

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return (
    <Badge variant="secondary" className={REPORT_STATUS_STYLES[status]}>
      {status}
    </Badge>
  );
}

const TRANSACTION_STATUS_STYLES: Record<TransactionStatus, string> = {
  pending: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400",
  success: "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400",
  failed: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400",
  cancelled: "bg-muted text-muted-foreground",
};

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <Badge variant="secondary" className={TRANSACTION_STATUS_STYLES[status]}>
      {status}
    </Badge>
  );
}
