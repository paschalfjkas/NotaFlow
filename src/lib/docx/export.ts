import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getScreenshotsForReport } from "@/lib/screenshots";
import { buildReportDocx } from "@/lib/docx/build-report";
import { docxPath, getSignedUrl, uploadFile } from "@/lib/storage";
import type { ReportData } from "@/lib/validation/wizard";

export class DocxNotReadyError extends Error {
  constructor() {
    super("This report isn't ready to download yet.");
  }
}

/**
 * Builds the .docx if it doesn't exist yet (or re-builds it to pick up any
 * edits since the last export — cheap enough to just always regenerate
 * rather than tracking a dirty flag), uploads it, and returns a short-lived
 * signed URL. Shared by the in-editor Download button and the dashboard's
 * one-click download shortcut.
 */
export async function ensureDocxAndGetUrl(reportId: string, userId: string): Promise<string> {
  const supabase = await createClient();
  const { data: report } = await supabase
    .from("reports")
    .select("title, report_data, status")
    .eq("id", reportId)
    .eq("user_id", userId)
    .single();

  if (!report || report.status !== "completed") throw new DocxNotReadyError();

  const { data: sections, error: sectionsError } = await supabase
    .from("report_sections")
    .select("*")
    .eq("report_id", reportId)
    .order("order_index");

  if (sectionsError || !sections) throw new Error("Could not load the report content.");

  const screenshots = await getScreenshotsForReport(reportId);
  const buffer = await buildReportDocx({
    title: report.title,
    reportData: report.report_data as ReportData,
    sections,
    screenshots,
  });

  const path = docxPath(reportId);
  await uploadFile(
    path,
    buffer,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
  await supabase.from("reports").update({ docx_storage_path: path }).eq("id", reportId);

  return getSignedUrl(path, 300);
}
