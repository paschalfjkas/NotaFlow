import { requireUser } from "@/lib/auth";
import { getReportForUser } from "@/lib/reports";
import { StepIndicator } from "@/components/wizard/step-indicator";
import { PersonalInfoForm } from "@/components/forms/wizard/personal-info-form";

export const instant = false;

export default async function PersonalInfoPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const { user, profile } = await requireUser();
  const report = await getReportForUser(user.id, reportId);

  const saved = report.report_data.personal;

  return (
    <div>
      <StepIndicator step="personal" />
      <PersonalInfoForm
        reportId={reportId}
        defaultValues={{
          fullName: saved?.fullName ?? profile?.full_name ?? "",
          matricNumber: saved?.matricNumber ?? profile?.matric_number ?? "",
          university: saved?.university ?? profile?.university ?? "",
          facultySchool: saved?.facultySchool ?? profile?.faculty ?? "",
          department: saved?.department ?? profile?.department ?? "",
          programme: saved?.programme ?? profile?.programme ?? "",
          academicSession: saved?.academicSession ?? profile?.academic_session ?? "",
          graduationYear: saved?.graduationYear ?? profile?.graduation_year?.toString() ?? "",
        }}
      />
    </div>
  );
}
