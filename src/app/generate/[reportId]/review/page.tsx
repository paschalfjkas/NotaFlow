import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil, TriangleAlert } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getReportForUser } from "@/lib/reports";
import {
  REPORT_LENGTH_LABELS,
  WRITING_STYLE_LABELS,
  type ReportData,
} from "@/lib/validation/wizard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GenerateButton } from "@/components/forms/wizard/generate-button";

export const instant = false;
// Report generation runs as a Server Action invoked from this page (see
// GenerateButton) and makes ~7 sequential AI calls with retry backoff —
// normally 30s-2min, but can run longer under heavy rate-limiting/retries.
// Explicit rather than relying on the platform default: matches Vercel
// Hobby's actual ceiling (300s); bump this (and your plan) if you see
// generation time out under load — Pro allows up to 800s.
export const maxDuration = 300;

function SummaryCard({
  title,
  editHref,
  rows,
}: {
  title: string;
  editHref: string;
  rows: { label: string; value: string }[];
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">{title}</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href={editHref}>
              <Pencil className="mr-1 size-3.5" /> Edit
            </Link>
          </Button>
        </div>
        <dl className="space-y-1.5 text-sm">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex gap-2">
              <dt className="w-40 shrink-0 text-muted-foreground">{label}</dt>
              <dd className="flex-1">{value || "—"}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function val(v: string | undefined): string {
  return v && v.trim().length > 0 ? v : "";
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const { user } = await requireUser();
  const report = await getReportForUser(user.id, reportId);

  if (report.status === "completed" || report.status === "generating") {
    redirect(`/report/${reportId}`);
  }

  const data: ReportData = report.report_data ?? {};
  const base = `/generate/${reportId}`;

  if (report.current_step !== "review") {
    const supabase = await createClient();
    await supabase
      .from("reports")
      .update({ current_step: "review" })
      .eq("id", reportId)
      .eq("user_id", user.id);
  }

  return (
    <div>
      <div className="mb-8">
        <span className="font-medium text-indigo-700 dark:text-indigo-400">Review</span>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">
          Check your answers before we generate your report
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You can jump back to any step to make changes — nothing here is final yet.
        </p>
      </div>

      <div className="space-y-4">
        <SummaryCard
          title="Personal Information"
          editHref={`${base}/personal`}
          rows={[
            { label: "Full name", value: val(data.personal?.fullName) },
            { label: "University", value: val(data.personal?.university) },
            { label: "Department", value: val(data.personal?.department) },
            { label: "Programme", value: val(data.personal?.programme) },
          ]}
        />
        <SummaryCard
          title="SIWES Information"
          editHref={`${base}/siwes`}
          rows={[
            { label: "Company", value: val(data.siwes?.companyName) },
            { label: "Duration", value: val(data.siwes?.duration) },
            { label: "Industrial supervisor", value: val(data.siwes?.industrialSupervisor) || "To be confirmed" },
            { label: "Institutional supervisor", value: val(data.siwes?.institutionalSupervisor) || "To be confirmed" },
          ]}
        />
        <SummaryCard
          title="Company Information"
          editHref={`${base}/company`}
          rows={
            data.company?.dontKnow
              ? [{ label: "Status", value: "Marked as unknown — AI will not invent company facts" }]
              : [
                  { label: "Industry", value: val(data.company?.industry) },
                  { label: "What they do", value: val(data.company?.whatCompanyDoes) },
                ]
          }
        />
        <Card>
          <CardContent className="pt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Work Experience</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`${base}/experience`}>
                  <Pencil className="mr-1 size-3.5" /> Edit
                </Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {(data.experience?.projects?.length ?? 0)} project
              {(data.experience?.projects?.length ?? 0) === 1 ? "" : "s"} ·{" "}
              {(data.experience?.tasks?.length ?? 0)} task
              {(data.experience?.tasks?.length ?? 0) === 1 ? "" : "s"}
            </p>
            {data.experience?.projects && data.experience.projects.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-sm">
                {data.experience.projects.map((p) => (
                  <li key={p.id}>{p.projectName || "Untitled project"}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Tools & Technologies</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`${base}/technologies`}>
                  <Pencil className="mr-1 size-3.5" /> Edit
                </Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(data.technologies?.technologies ?? []).length === 0 && (
                <span className="text-sm text-muted-foreground">None selected</span>
              )}
              {(data.technologies?.technologies ?? []).map((t) => (
                <Badge key={t} variant="secondary">
                  {t}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        <SummaryCard
          title="Challenges & Learning"
          editHref={`${base}/challenges`}
          rows={[
            { label: "Biggest challenge", value: val(data.challenges?.biggestChallenge) },
            { label: "Most important learning", value: val(data.challenges?.mostImportantLearning) },
          ]}
        />
        <SummaryCard
          title="Report Preferences"
          editHref={`${base}/preferences`}
          rows={[
            {
              label: "Length",
              value: data.preferences?.reportLength
                ? REPORT_LENGTH_LABELS[data.preferences.reportLength]
                : "",
            },
            {
              label: "Writing style",
              value: data.preferences?.writingStyle
                ? WRITING_STYLE_LABELS[data.preferences.writingStyle]
                : "",
            },
          ]}
        />
      </div>

      {report.status === "failed" && report.generation_error && (
        <div className="mt-8 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          <TriangleAlert className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-medium">Generation failed last time</p>
            <p className="mt-0.5">{report.generation_error}</p>
            <p className="mt-1 text-muted-foreground">
              Your report credit was not deducted — you can try again below.
            </p>
          </div>
        </div>
      )}

      <GenerateButton reportId={reportId} />
    </div>
  );
}
