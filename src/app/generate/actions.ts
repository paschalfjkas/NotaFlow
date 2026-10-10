"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DRAFT_STEP_SCHEMAS, type ReportData, type WizardStep } from "@/lib/validation/wizard";
import { InsufficientCreditsError } from "@/lib/credits";
import {
  runGeneration,
  getGenerationStatus,
  GenerationNotFoundError,
  GenerationAlreadyRunningError,
} from "@/lib/generation";

export type SaveStepResult = { success: true } | { error: string };

/**
 * Merges one wizard step's answers into `reports.report_data` and bumps
 * `current_step`. Used for both autosave (partial, possibly invalid-in-
 * progress data) and the explicit "Continue" submit (already fully validated
 * client-side by react-hook-form before this is called).
 */
export async function saveWizardStepAction(
  reportId: string,
  step: WizardStep,
  values: Record<string, unknown>
): Promise<SaveStepResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Your session has expired. Please sign in again." };

  const parsed = DRAFT_STEP_SCHEMAS[step].partial().safeParse(values);
  if (!parsed.success) {
    return { error: "Some of your answers couldn't be saved — please check the form." };
  }

  const { data: report, error: fetchError } = await supabase
    .from("reports")
    .select("report_data, title")
    .eq("id", reportId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !report) {
    return { error: "This report could not be found." };
  }

  const reportData = (report.report_data ?? {}) as ReportData;
  const merged: ReportData = { ...reportData, [step]: { ...reportData[step], ...parsed.data } };

  const titleUpdate =
    step === "siwes" && typeof parsed.data === "object" && "companyName" in parsed.data
      ? { title: `${(parsed.data as { companyName?: string }).companyName} SIWES Report` }
      : {};

  const { error: updateError } = await supabase
    .from("reports")
    .update({ report_data: merged, current_step: step, ...titleUpdate })
    .eq("id", reportId)
    .eq("user_id", user.id);

  if (updateError) {
    return { error: "Could not save your progress. Please try again." };
  }

  return { success: true };
}

export async function abandonDraftAction(reportId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("reports")
    .delete()
    .eq("id", reportId)
    .eq("user_id", user.id)
    .eq("status", "draft");

  redirect("/dashboard");
}

export type GenerateReportResult =
  | { success: true }
  | { error: string; code: "insufficient_credits" | "generic" };

/**
 * Kicks off AI generation for a report. Runs synchronously within the
 * action (the pipeline makes several sequential/parallel AI calls, so this
 * can take tens of seconds) — the review page polls getGenerationStatusAction
 * for real progress in the meantime, since this call itself only resolves
 * once generation finishes or fails.
 */
export async function generateReportAction(reportId: string): Promise<GenerateReportResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Your session has expired. Please sign in again.", code: "generic" };

  try {
    await runGeneration(reportId, user.id);
    return { success: true };
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return {
        error: "You've used your free report. Buy credits to generate another.",
        code: "insufficient_credits",
      };
    }
    if (error instanceof GenerationNotFoundError) {
      return { error: "This report could not be found.", code: "generic" };
    }
    if (error instanceof GenerationAlreadyRunningError) {
      return { error: "This report is already generating.", code: "generic" };
    }
    return {
      error:
        error instanceof Error
          ? error.message
          : "We couldn't generate your report right now. Your report credit has not been deducted.",
      code: "generic",
    };
  }
}

export async function getGenerationStatusAction(reportId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return getGenerationStatus(reportId, user.id);
}
