import "server-only";
import { createClient } from "@/lib/supabase/server";
import { consumeReportCredit, refundReportCredit } from "@/lib/credits";
import { generateReport } from "@/lib/ai/pipeline";
import { buildSectionRows } from "@/lib/ai/section-rows";
import { normalizeReportData } from "@/lib/reports";
import type { ReportData } from "@/lib/validation/wizard";
import type { CreditSource } from "@/types/database";

export class GenerationNotFoundError extends Error {
  constructor() {
    super("report_not_found");
  }
}

export class GenerationAlreadyRunningError extends Error {
  constructor() {
    super("already_generating");
  }
}

/**
 * Runs the full generate-report flow for one report: consumes a credit,
 * marks the report "generating" with real stage updates the client can
 * poll, runs the AI pipeline, persists the resulting sections, and either
 * completes the report or refunds the credit and marks it failed.
 *
 * Throws GenerationNotFoundError / GenerationAlreadyRunningError for
 * caller-fixable states, and the credits module's InsufficientCreditsError
 * when the user has no credits left — callers should catch that distinctly
 * to show the payment-gate message rather than a generic failure.
 */
export async function runGeneration(reportId: string, userId: string): Promise<void> {
  const supabase = await createClient();

  const { data: report } = await supabase
    .from("reports")
    .select("status, report_data")
    .eq("id", reportId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!report) throw new GenerationNotFoundError();
  if (report.status === "generating") throw new GenerationAlreadyRunningError();

  const creditSource: CreditSource = await consumeReportCredit(userId);

  await supabase
    .from("reports")
    .update({
      status: "generating",
      generation_stage: "understanding",
      generation_error: null,
      credit_source: creditSource,
    })
    .eq("id", reportId);

  try {
    const reportData = normalizeReportData(report.report_data as ReportData);
    const result = await generateReport(reportData, async (stage) => {
      await supabase.from("reports").update({ generation_stage: stage }).eq("id", reportId);
    });

    await supabase.from("report_sections").delete().eq("report_id", reportId);
    await supabase.from("report_sections").insert(buildSectionRows(reportId, result));

    await supabase
      .from("reports")
      .update({
        status: "completed",
        generation_stage: null,
        generated_content: {
          title: result.preliminary.coverTitle,
          abstract: result.preliminary.abstract,
          generatedAt: new Date().toISOString(),
        },
      })
      .eq("id", reportId);
  } catch (error) {
    await refundReportCredit(userId, creditSource);
    await supabase
      .from("reports")
      .update({
        status: "failed",
        generation_stage: null,
        generation_error:
          error instanceof Error ? error.message : "Report generation failed unexpectedly.",
      })
      .eq("id", reportId);
    throw error;
  }
}

export async function getGenerationStatus(reportId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reports")
    .select("status, generation_stage, generation_error")
    .eq("id", reportId)
    .eq("user_id", userId)
    .maybeSingle();

  return data;
}
