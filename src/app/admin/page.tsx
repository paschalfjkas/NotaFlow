import Link from "next/link";
import { format } from "date-fns";
import { FileText, TrendingUp, Users as UsersIcon, Wallet } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatKobo } from "@/lib/payments/format";
import { TransactionStatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ReportStatus, TransactionStatus } from "@/types/database";

export const instant = false;

const REPORT_STATUSES: ReportStatus[] = ["draft", "generating", "completed", "failed"];

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AdminOverviewPage() {
  const admin = createAdminClient();

  const [
    { count: userCount },
    reportsByStatus,
    { data: successfulTransactions },
    { data: creditTotals },
    { data: recentTransactions },
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    Promise.all(
      REPORT_STATUSES.map(async (status) => {
        const { count } = await admin
          .from("reports")
          .select("id", { count: "exact", head: true })
          .eq("status", status);
        return { status, count: count ?? 0 };
      })
    ),
    admin.from("transactions").select("amount_kobo").eq("status", "success"),
    admin.from("credits").select("free_credits, paid_credits"),
    admin
      .from("transactions")
      .select("id, reference, user_id, package_key, amount_kobo, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const totalRevenueKobo = (successfulTransactions ?? []).reduce(
    (sum, t) => sum + t.amount_kobo,
    0
  );
  const totalFreeCredits = (creditTotals ?? []).reduce((sum, c) => sum + c.free_credits, 0);
  const totalPaidCredits = (creditTotals ?? []).reduce((sum, c) => sum + c.paid_credits, 0);
  const totalReports = reportsByStatus.reduce((sum, r) => sum + r.count, 0);

  const userIds = Array.from(new Set((recentTransactions ?? []).map((t) => t.user_id)));
  const { data: profilesForTx } = userIds.length
    ? await admin.from("profiles").select("id, email").in("id", userIds)
    : { data: [] as { id: string; email: string }[] };
  const emailById = new Map((profilesForTx ?? []).map((p) => [p.id, p.email]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin Overview</h1>
        <p className="mt-1 text-muted-foreground">Platform-wide metrics.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={UsersIcon} label="Total Users" value={String(userCount ?? 0)} />
        <MetricCard icon={FileText} label="Total Reports" value={String(totalReports)} />
        <MetricCard icon={TrendingUp} label="Revenue" value={formatKobo(totalRevenueKobo)} />
        <MetricCard
          icon={Wallet}
          label="Outstanding Credits"
          value={String(totalFreeCredits + totalPaidCredits)}
        />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Reports by Status</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          {reportsByStatus.map(({ status, count }) => (
            <Card key={status}>
              <CardContent className="py-4">
                <p className="text-sm capitalize text-muted-foreground">{status}</p>
                <p className="text-xl font-semibold">{count}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
          <Link
            href="/admin/transactions"
            className="text-sm text-indigo-700 hover:underline dark:text-indigo-400"
          >
            View all
          </Link>
        </div>
        <div className="rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(recentTransactions ?? []).map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{emailById.get(t.user_id) ?? t.user_id}</TableCell>
                  <TableCell>{t.package_key}</TableCell>
                  <TableCell>{formatKobo(t.amount_kobo)}</TableCell>
                  <TableCell>
                    <TransactionStatusBadge status={t.status as TransactionStatus} />
                  </TableCell>
                  <TableCell>{format(new Date(t.created_at), "MMM d, yyyy")}</TableCell>
                </TableRow>
              ))}
              {(!recentTransactions || recentTransactions.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No transactions yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
