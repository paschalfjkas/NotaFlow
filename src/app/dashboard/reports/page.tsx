import Link from "next/link";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { ReportCard } from "@/components/dashboard/report-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export const instant = false;

export default async function ReportsPage() {
  const { user } = await requireUser();
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("reports")
    .select("id, title, status, docx_storage_path, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Reports</h1>
          <p className="mt-1 text-muted-foreground">Every report you&apos;ve started or generated.</p>
        </div>
        <Button asChild>
          <Link href="/generate">Start New Report</Link>
        </Button>
      </div>

      {reports && reports.length > 0 ? (
        <div className="space-y-3">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              id={report.id}
              title={report.title}
              status={report.status}
              createdAt={report.created_at}
              hasDocx={!!report.docx_storage_path}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="You haven't created a report yet"
          description="Start by telling us about your SIWES experience."
          action={
            <Button asChild>
              <Link href="/generate">Create My First Report</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
