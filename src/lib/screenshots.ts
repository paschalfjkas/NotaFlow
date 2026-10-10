import "server-only";
import { createClient } from "@/lib/supabase/server";
import { screenshotPath, uploadFile, deleteFile } from "@/lib/storage";

export type ScreenshotRow = {
  id: string;
  report_id: string;
  section_id: string | null;
  storage_path: string | null;
  caption: string;
  order_index: number;
  created_at: string;
};

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/bmp": "bmp",
};

export class UnsupportedImageTypeError extends Error {
  constructor() {
    super(
      "Unsupported image type — please upload a PNG, JPG, GIF, or BMP file (Word embedding doesn't support WebP/AVIF)."
    );
  }
}

export async function getScreenshotsForReport(reportId: string): Promise<ScreenshotRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("report_screenshots")
    .select("*")
    .eq("report_id", reportId)
    .order("order_index");

  if (error) throw error;
  return data as ScreenshotRow[];
}

export async function addScreenshotPlaceholder(
  reportId: string,
  sectionId: string,
  caption: string
): Promise<ScreenshotRow> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("report_screenshots")
    .select("id", { count: "exact", head: true })
    .eq("report_id", reportId);

  const { data, error } = await supabase
    .from("report_screenshots")
    .insert({ report_id: reportId, section_id: sectionId, caption, order_index: count ?? 0 })
    .select("*")
    .single();

  if (error) throw error;
  return data as ScreenshotRow;
}

export class ScreenshotNotFoundError extends Error {
  constructor() {
    super("Screenshot not found.");
  }
}

export async function uploadScreenshotImage(
  reportId: string,
  screenshotId: string,
  file: Buffer,
  mimeType: string
): Promise<ScreenshotRow> {
  const ext = ALLOWED_IMAGE_TYPES[mimeType];
  if (!ext) throw new UnsupportedImageTypeError();

  const supabase = await createClient();

  // Ownership check BEFORE touching storage: uploadFile()/deleteFile() use
  // the admin client (it has to, to manage the private bucket), which
  // bypasses RLS entirely. Without this, any logged-in user could overwrite
  // another student's screenshot file by guessing/obtaining their
  // reportId/screenshotId — the row update below is RLS-protected, but a
  // storage write that happened first wouldn't be.
  const { data: owned } = await supabase
    .from("report_screenshots")
    .select("id")
    .eq("id", screenshotId)
    .eq("report_id", reportId)
    .maybeSingle();

  if (!owned) throw new ScreenshotNotFoundError();

  const path = screenshotPath(reportId, screenshotId, ext);
  await uploadFile(path, file, mimeType);

  const { data, error } = await supabase
    .from("report_screenshots")
    .update({ storage_path: path })
    .eq("id", screenshotId)
    .select("*")
    .single();

  if (error) throw error;
  return data as ScreenshotRow;
}

export async function updateScreenshotCaption(
  screenshotId: string,
  caption: string
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("report_screenshots").update({ caption }).eq("id", screenshotId);
}

export async function deleteScreenshot(screenshotId: string): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("report_screenshots")
    .select("storage_path")
    .eq("id", screenshotId)
    .single();

  if (data?.storage_path) {
    await deleteFile(data.storage_path);
  }

  await supabase.from("report_screenshots").delete().eq("id", screenshotId);
}
