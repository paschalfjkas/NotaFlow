import { requireUser } from "@/lib/auth";
import { getReportForUser } from "@/lib/reports";
import { StepIndicator } from "@/components/wizard/step-indicator";
import { TechnologiesForm } from "@/components/forms/wizard/technologies-form";

export const instant = false;

export default async function TechnologiesPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const { user } = await requireUser();
  const report = await getReportForUser(user.id, reportId);
  const saved = report.report_data.technologies;

  return (
    <div>
      <StepIndicator step="technologies" />
      <TechnologiesForm reportId={reportId} defaultValues={{ technologies: saved?.technologies ?? [] }} />
    </div>
  );
}
