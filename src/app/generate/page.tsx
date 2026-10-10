import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getOrCreateDraftReport } from "@/lib/reports";
import { WIZARD_STEPS } from "@/lib/validation/wizard";

export const instant = false;

const RESUMABLE_STEPS: readonly string[] = [...WIZARD_STEPS, "review"];

/** Resumes the user's in-progress draft, or starts a new one. */
export default async function GenerateEntryPage() {
  const { user } = await requireUser();
  const report = await getOrCreateDraftReport(user.id);

  const step = RESUMABLE_STEPS.includes(report.current_step) ? report.current_step : "personal";

  redirect(`/generate/${report.id}/${step}`);
}
