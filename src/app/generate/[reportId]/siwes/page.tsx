import { requireUser } from "@/lib/auth";
import { getReportForUser } from "@/lib/reports";
import { StepIndicator } from "@/components/wizard/step-indicator";
import { SiwesInfoForm } from "@/components/forms/wizard/siwes-info-form";

export const instant = false;

export default async function SiwesInfoPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const { user } = await requireUser();
  const report = await getReportForUser(user.id, reportId);
  const saved = report.report_data.siwes;

  return (
    <div>
      <StepIndicator step="siwes" />
      <SiwesInfoForm
        reportId={reportId}
        defaultValues={{
          companyName: saved?.companyName ?? "",
          companyAddress: saved?.companyAddress ?? "",
          startDate: saved?.startDate ?? "",
          endDate: saved?.endDate ?? "",
          duration: saved?.duration ?? "",
          departmentTeam: saved?.departmentTeam ?? "",
          industrialSupervisor: saved?.industrialSupervisor ?? "",
          institutionalSupervisor: saved?.institutionalSupervisor ?? "",
          headOfDepartment: saved?.headOfDepartment ?? "",
        }}
      />
    </div>
  );
}
