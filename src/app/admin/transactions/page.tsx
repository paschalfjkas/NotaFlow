import { format } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { TransactionStatusBadge } from "@/components/admin/status-badge";
import { formatKobo } from "@/lib/payments/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const instant = false;

export default async function AdminTransactionsPage() {
  const admin = createAdminClient();

  const { data: transactions } = await admin
    .from("transactions")
    .select("id, reference, user_id, package_key, amount_kobo, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const userIds = Array.from(new Set((transactions ?? []).map((t) => t.user_id)));
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, email").in("id", userIds)
    : { data: [] as { id: string; email: string }[] };
  const emailById = new Map((profiles ?? []).map((p) => [p.id, p.email]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <p className="mt-1 text-muted-foreground">Most recent 200 Paystack transactions.</p>
      </div>
      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(transactions ?? []).map((t) => (
              <TableRow key={t.id}>
                <TableCell className="max-w-40 truncate font-mono text-xs">{t.reference}</TableCell>
                <TableCell>{emailById.get(t.user_id) ?? t.user_id}</TableCell>
                <TableCell>{t.package_key}</TableCell>
                <TableCell>{formatKobo(t.amount_kobo)}</TableCell>
                <TableCell>
                  <TransactionStatusBadge status={t.status} />
                </TableCell>
                <TableCell>{format(new Date(t.created_at), "MMM d, yyyy")}</TableCell>
              </TableRow>
            ))}
            {(!transactions || transactions.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No transactions yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
