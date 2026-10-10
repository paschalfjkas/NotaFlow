import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getReportForUser } from "@/lib/reports";
import { getSections } from "@/lib/sections";
import { getScreenshotsForReport } from "@/lib/screenshots";
import { getSignedUrl } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { GeneratingWait } from "@/components/report/generating-wait";
import { ReportEditor } from "@/components/report/report-editor";

export const instant = false;

export default async function ReportPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const { user } = await requireUser();
  const report = await getReportForUser(user.id, reportId);

  if (report.status === "draft") {
    return (
      <div className="mx-auto max-w-md rounded-xl border bg-background p-8 text-center">
        <h1 className="text-lg font-semibold">This report hasn&apos;t been generated yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Finish the questionnaire and generate it first.
        </p>
        <Button className="mt-4" asChild>
          <Link href={`/generate/${reportId}/review`}>Go to review</Link>
        </Button>
      </div>
    );
  }

  if (report.status === "generating") {
    return <GeneratingWait reportId={reportId} initialStage={report.generation_stage} />;
  }

  if (report.status === "failed") {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/40">
        <TriangleAlert className="mx-auto size-8 text-red-600 dark:text-red-400" />
        <h1 className="mt-3 text-lg font-semibold">Generation failed</h1>
        <p className="mt-2 text-sm text-red-700 dark:text-red-400">
          {report.generation_error ?? "Something went wrong."}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your report credit was not deducted.
        </p>
        <Button className="mt-4" asChild>
          <Link href={`/generate/${reportId}/review`}>Try again</Link>
        </Button>
      </div>
    );
  }

  const [sections, screenshots] = await Promise.all([
    getSections(reportId),
    getScreenshotsForReport(reportId),
  ]);

  const imageUrls: Record<string, string> = {};
  await Promise.all(
    screenshots
      .filter((s) => s.storage_path)
      .map(async (s) => {
        try {
          imageUrls[s.id] = await getSignedUrl(s.storage_path!, 3600);
        } catch {
          // Leave unset — the UI falls back to the placeholder icon.
        }
      })
  );

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-medium text-indigo-700 dark:text-indigo-400">{report.title}</p>
        <h1 className="text-xl font-semibold tracking-tight">Your SIWES Report</h1>
      </div>
      <ReportEditor
        reportId={reportId}
        sections={sections}
        screenshots={screenshots}
        imageUrls={imageUrls}
      />
    </div>
  );
}
