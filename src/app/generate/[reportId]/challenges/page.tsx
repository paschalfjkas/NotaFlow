import { requireUser } from "@/lib/auth";
import { getReportForUser } from "@/lib/reports";
import { StepIndicator } from "@/components/wizard/step-indicator";
import { ChallengesForm } from "@/components/forms/wizard/challenges-form";

export const instant = false;

export default async function ChallengesPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const { user } = await requireUser();
  const report = await getReportForUser(user.id, reportId);
  const saved = report.report_data.challenges;

  return (
    <div>
      <StepIndicator step="challenges" />
      <ChallengesForm
        reportId={reportId}
        defaultValues={{
          biggestChallenge: saved?.biggestChallenge ?? "",
          howSolved: saved?.howSolved ?? "",
          technicalSkills: saved?.technicalSkills ?? [],
          professionalSkills: saved?.professionalSkills ?? [],
          mostImportantLearning: saved?.mostImportantLearning ?? "",
        }}
      />
    </div>
  );
}
