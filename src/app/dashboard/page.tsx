import Link from "next/link";
import { FileText, FilePlus2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getLatestDraftReport } from "@/lib/reports";
import { CreditCard } from "@/components/dashboard/credit-card";
import { ReportCard } from "@/components/dashboard/report-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const { user, profile } = await requireUser();
  const supabase = await createClient();

  const [{ data: credits }, { data: reports }, draftReport] = await Promise.all([
    supabase
      .from("credits")
      .select("free_credits, paid_credits")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("reports")
      .select("id, title, status, docx_storage_path, created_at")
      .eq("user_id", user.id)
      .neq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(5),
    getLatestDraftReport(user.id),
  ]);

  const firstName = (profile?.full_name || "").split(" ")[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}
          {firstName ? `, ${firstName}` : ""} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s what&apos;s happening with your SIWES report.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <CreditCard
          freeCredits={credits?.free_credits ?? 0}
          paidCredits={credits?.paid_credits ?? 0}
        />
        <div className="flex items-center justify-center rounded-xl border bg-background p-5">
          <Button size="lg" className="w-full" asChild>
            <Link href="/generate">Start New Report</Link>
          </Button>
        </div>
      </div>

      {draftReport && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 px-5 py-4">
          <div className="flex items-center gap-3">
            <FilePlus2 className="size-5 text-amber-700 dark:text-amber-400" />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-200">You have an unfinished report</p>
              <p className="text-sm text-amber-800/80 dark:text-amber-300/80">
                Pick up where you left off — your answers are already saved.
              </p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href="/generate">Continue</Link>
          </Button>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold">Recent Reports</h2>
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
    </div>
  );
}
