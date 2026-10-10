import { requireUser } from "@/lib/auth";
import { getReportForUser } from "@/lib/reports";
import { StepIndicator } from "@/components/wizard/step-indicator";
import { CompanyInfoForm } from "@/components/forms/wizard/company-info-form";

export const instant = false;

export default async function CompanyInfoPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const { user } = await requireUser();
  const report = await getReportForUser(user.id, reportId);
  const saved = report.report_data.company;

  return (
    <div>
      <StepIndicator step="company" />
      <CompanyInfoForm
        reportId={reportId}
        defaultValues={{
          dontKnow: saved?.dontKnow ?? false,
          whatCompanyDoes: saved?.whatCompanyDoes ?? "",
          industry: saved?.industry ?? "",
          productsServices: saved?.productsServices ?? "",
          mission: saved?.mission ?? "",
          vision: saved?.vision ?? "",
          coreValues: saved?.coreValues ?? "",
          departments: saved?.departments ?? "",
          teamWorkedWith: saved?.teamWorkedWith ?? "",
          companySize: saved?.companySize ?? "",
        }}
      />
    </div>
  );
}
