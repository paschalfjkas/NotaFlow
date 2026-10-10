import { requireUser } from "@/lib/auth";
import { getReportForUser } from "@/lib/reports";
import { StepIndicator } from "@/components/wizard/step-indicator";
import { ExperienceForm } from "@/components/forms/wizard/experience-form";

export const instant = false;

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const { user } = await requireUser();
  const report = await getReportForUser(user.id, reportId);
  const saved = report.report_data.experience;

  return (
    <div>
      <StepIndicator step="experience" />
      <ExperienceForm
        reportId={reportId}
        defaultValues={{
          projects: saved?.projects ?? [],
          tasks: saved?.tasks ?? [],
        }}
      />
    </div>
  );
}
