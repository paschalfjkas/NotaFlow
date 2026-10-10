import { format } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { ReportStatusBadge } from "@/components/admin/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const instant = false;

export default async function AdminReportsPage() {
  const admin = createAdminClient();

  const { data: reports } = await admin
    .from("reports")
    .select("id, title, status, user_id, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const userIds = Array.from(new Set((reports ?? []).map((r) => r.user_id)));
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, email").in("id", userIds)
    : { data: [] as { id: string; email: string }[] };
  const emailById = new Map((profiles ?? []).map((p) => [p.id, p.email]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="mt-1 text-muted-foreground">
          Every report across all students (most recent 200).
        </p>
      </div>
      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(reports ?? []).map((r) => (
              <TableRow key={r.id}>
                <TableCell className="max-w-xs truncate">{r.title}</TableCell>
                <TableCell>{emailById.get(r.user_id) ?? r.user_id}</TableCell>
                <TableCell>
                  <ReportStatusBadge status={r.status} />
                </TableCell>
                <TableCell>{format(new Date(r.created_at), "MMM d, yyyy")}</TableCell>
              </TableRow>
            ))}
            {(!reports || reports.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No reports yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
