import { requireUser } from "@/lib/auth";
import { getReportForUser } from "@/lib/reports";
import { StepIndicator } from "@/components/wizard/step-indicator";
import { PreferencesForm } from "@/components/forms/wizard/preferences-form";

export const instant = false;

export default async function PreferencesPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const { user } = await requireUser();
  const report = await getReportForUser(user.id, reportId);
  const saved = report.report_data.preferences;

  return (
    <div>
      <StepIndicator step="preferences" />
      <PreferencesForm
        reportId={reportId}
        defaultValues={{
          reportLength: saved?.reportLength ?? "standard",
          writingStyle: saved?.writingStyle ?? "professional_natural",
          includeScreenshots: saved?.includeScreenshots ?? true,
          includeTables: saved?.includeTables ?? true,
          includeFigures: saved?.includeFigures ?? true,
          includeReferences: saved?.includeReferences ?? true,
        }}
      />
    </div>
  );
}
