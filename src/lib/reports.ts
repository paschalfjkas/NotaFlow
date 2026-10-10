import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ReportData } from "@/lib/validation/wizard";
import type { ReportStatus } from "@/types/database";

export type ReportRow = {
  id: string;
  user_id: string;
  title: string;
  status: ReportStatus;
  current_step: string;
  report_data: ReportData;
  generated_content: Record<string, unknown> | null;
  docx_storage_path: string | null;
  generation_error: string | null;
  generation_stage: string | null;
  created_at: string;
  updated_at: string;
};

// Migrates rows saved before `technologies` became { name, notes }[] instead
// of a flat string[] — without this, an older draft/failed report would feed
// `undefined` names into the tag input and the AI context.
export function normalizeReportData(raw: ReportData): ReportData {
  const techs = raw.technologies?.technologies;
  if (!Array.isArray(techs) || techs.length === 0 || typeof techs[0] !== "string") return raw;
  return {
    ...raw,
    technologies: {
      ...raw.technologies,
      technologies: (techs as unknown as string[]).map((name) => ({ name, notes: "" })),
    },
  };
}

function normalizeRow(row: Record<string, unknown>): ReportRow {
  return { ...row, report_data: normalizeReportData(row.report_data as ReportData) } as ReportRow;
}

/**
 * Resumes the user's most recent draft report, or creates a new one. Used by
 * the /generate entry route so "Start New Report" never orphans an
 * in-progress draft (see product spec section 47, "Save progress").
 */
export async function getOrCreateDraftReport(userId: string): Promise<ReportRow> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("reports")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "draft")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return normalizeRow(existing);

  const { data: created, error } = await supabase
    .from("reports")
    .insert({ user_id: userId, status: "draft", current_step: "personal", report_data: {} })
    .select("*")
    .single();

  if (error) throw error;
  return created as ReportRow;
}

/** Fetches a report owned by the given user, or 404s. RLS also enforces this. */
export async function getReportForUser(userId: string, reportId: string): Promise<ReportRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", reportId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) notFound();
  return normalizeRow(data);
}

export async function getLatestDraftReport(userId: string): Promise<ReportRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reports")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "draft")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? normalizeRow(data) : null;
}
