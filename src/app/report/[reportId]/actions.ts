"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  clearSectionTable,
  getSection,
  getSectionVersions,
  updateSectionContent,
  type SectionRow,
} from "@/lib/sections";
import {
  addScreenshotPlaceholder,
  deleteScreenshot,
  uploadScreenshotImage,
  updateScreenshotCaption,
  UnsupportedImageTypeError,
} from "@/lib/screenshots";
import { rewriteSectionContent, regenerateSectionContent } from "@/lib/ai/edit-section";
import { assertUnderAiEditRateLimit, AiEditRateLimitError } from "@/lib/ai/rate-limit";
import { AIGenerationError } from "@/lib/ai/types";
import type { RewriteMode } from "@/lib/ai/prompts/section-edit";
import type { ReportData } from "@/lib/validation/wizard";
import { ensureDocxAndGetUrl } from "@/lib/docx/export";

export type ActionResult<T = undefined> =
  | ({ success: true } & (T extends undefined ? object : { data: T }))
  | { error: string };

async function requireUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function updateSectionAction(
  sectionId: string,
  content: string
): Promise<ActionResult<SectionRow>> {
  if (!(await requireUserId())) return { error: "Your session has expired." };

  try {
    const updated = await updateSectionContent(sectionId, content);
    revalidatePath(`/report/${updated.report_id}`);
    return { success: true, data: updated };
  } catch {
    return { error: "Could not save this section. Please try again." };
  }
}

export async function rewriteSectionAction(
  sectionId: string,
  mode: RewriteMode
): Promise<ActionResult<SectionRow>> {
  if (!(await requireUserId())) return { error: "Your session has expired." };

  const section = await getSection(sectionId);
  if (!section) return { error: "Section not found." };

  try {
    await assertUnderAiEditRateLimit();
    const newContent = await rewriteSectionContent(section.content, mode);
    const updated = await updateSectionContent(sectionId, newContent);
    revalidatePath(`/report/${updated.report_id}`);
    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof AiEditRateLimitError) return { error: error.message };
    return {
      error:
        error instanceof AIGenerationError
          ? error.message
          : "The AI rewrite failed. Your original text is unchanged.",
    };
  }
}

export async function regenerateSectionAction(
  sectionId: string
): Promise<ActionResult<SectionRow>> {
  if (!(await requireUserId())) return { error: "Your session has expired." };

  const section = await getSection(sectionId);
  if (!section) return { error: "Section not found." };

  const supabase = await createClient();
  const { data: report } = await supabase
    .from("reports")
    .select("report_data")
    .eq("id", section.report_id)
    .single();

  if (!report) return { error: "Report not found." };

  try {
    await assertUnderAiEditRateLimit();
    const newContent = await regenerateSectionContent(
      report.report_data as ReportData,
      section.chapter_number,
      section.title
    );
    const updated = await updateSectionContent(sectionId, newContent);
    revalidatePath(`/report/${updated.report_id}`);
    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof AiEditRateLimitError) return { error: error.message };
    return {
      error:
        error instanceof AIGenerationError
          ? error.message
          : "Regeneration failed. Your original text is unchanged.",
    };
  }
}

export async function removeSectionTableAction(
  sectionId: string
): Promise<ActionResult<SectionRow>> {
  if (!(await requireUserId())) return { error: "Your session has expired." };

  try {
    const updated = await clearSectionTable(sectionId);
    revalidatePath(`/report/${updated.report_id}`);
    return { success: true, data: updated };
  } catch {
    return { error: "Could not remove this table." };
  }
}

export async function getSectionVersionsAction(sectionId: string) {
  if (!(await requireUserId())) return [];
  return getSectionVersions(sectionId);
}

export async function revertSectionVersionAction(
  sectionId: string,
  versionContent: string
): Promise<ActionResult<SectionRow>> {
  if (!(await requireUserId())) return { error: "Your session has expired." };

  try {
    const updated = await updateSectionContent(sectionId, versionContent);
    revalidatePath(`/report/${updated.report_id}`);
    return { success: true, data: updated };
  } catch {
    return { error: "Could not revert this section." };
  }
}

export async function addScreenshotAction(
  reportId: string,
  sectionId: string,
  caption: string
) {
  if (!(await requireUserId())) return { error: "Your session has expired." };

  try {
    const screenshot = await addScreenshotPlaceholder(reportId, sectionId, caption || "Untitled screenshot");
    revalidatePath(`/report/${reportId}`);
    return { success: true as const, data: screenshot };
  } catch {
    return { error: "Could not add the screenshot placeholder." };
  }
}

export async function uploadScreenshotAction(formData: FormData) {
  if (!(await requireUserId())) return { error: "Your session has expired." };

  const reportId = formData.get("reportId") as string;
  const screenshotId = formData.get("screenshotId") as string;
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) return { error: "No file selected." };
  if (file.size > 5 * 1024 * 1024) return { error: "Image must be under 5MB." };

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const updated = await uploadScreenshotImage(reportId, screenshotId, buffer, file.type);
    revalidatePath(`/report/${reportId}`);
    return { success: true as const, data: updated };
  } catch (error) {
    return {
      error: error instanceof UnsupportedImageTypeError ? error.message : "Upload failed.",
    };
  }
}

export async function updateScreenshotCaptionAction(
  reportId: string,
  screenshotId: string,
  caption: string
) {
  if (!(await requireUserId())) return { error: "Your session has expired." };
  await updateScreenshotCaption(screenshotId, caption);
  revalidatePath(`/report/${reportId}`);
  return { success: true as const };
}

export async function deleteScreenshotAction(reportId: string, screenshotId: string) {
  if (!(await requireUserId())) return { error: "Your session has expired." };
  await deleteScreenshot(screenshotId);
  revalidatePath(`/report/${reportId}`);
  return { success: true as const };
}

export async function downloadDocxAction(
  reportId: string
): Promise<{ url: string } | { error: string }> {
  const userId = await requireUserId();
  if (!userId) return { error: "Your session has expired." };

  try {
    const url = await ensureDocxAndGetUrl(reportId, userId);
    return { url };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not generate the Word document.",
    };
  }
}
