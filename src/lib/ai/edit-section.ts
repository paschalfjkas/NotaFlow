import "server-only";
import { getAIProvider, generateValidatedJSON } from "@/lib/ai";
import { buildReportContext } from "@/lib/ai/context";
import { buildRewritePrompt, buildSectionRegeneratePrompt, type RewriteMode } from "@/lib/ai/prompts/section-edit";
import { SYSTEM_PROMPT } from "@/lib/ai/prompts/system";
import { sectionContentSchema, CHAPTER_TITLES } from "@/lib/ai/schema";
import type { ReportData } from "@/lib/validation/wizard";

export async function rewriteSectionContent(content: string, mode: RewriteMode): Promise<string> {
  const provider = getAIProvider();
  const result = await generateValidatedJSON(provider, {
    system: SYSTEM_PROMPT,
    prompt: buildRewritePrompt(content, mode),
    schema: sectionContentSchema,
    label: `rewrite_${mode}`,
  });
  return result.content;
}

export async function regenerateSectionContent(
  reportData: ReportData,
  chapterNumber: number | null,
  sectionHeading: string
): Promise<string> {
  const provider = getAIProvider();
  const context = buildReportContext(reportData);
  const chapterTitle = chapterNumber ? CHAPTER_TITLES[chapterNumber] : "Preliminary Pages";

  const result = await generateValidatedJSON(provider, {
    system: SYSTEM_PROMPT,
    prompt: buildSectionRegeneratePrompt(context, chapterTitle ?? "", sectionHeading),
    schema: sectionContentSchema,
    label: "regenerate_section",
  });
  return result.content;
}
