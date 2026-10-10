import "server-only";
import { getAIProvider, generateValidatedJSON } from "@/lib/ai";
import { buildReportContext } from "@/lib/ai/context";
import { buildPreliminaryPrompt } from "@/lib/ai/prompts/preliminary";
import { buildChapterPrompt } from "@/lib/ai/prompts/chapters";
import { buildQualityControlPrompt } from "@/lib/ai/prompts/quality-control";
import { buildReferencesPrompt } from "@/lib/ai/prompts/references";
import { SYSTEM_PROMPT } from "@/lib/ai/prompts/system";
import {
  generatedPreliminarySchema,
  generatedChapterSchema,
  generatedReferencesSchema,
  qualityControlResultSchema,
  type GeneratedChapter,
  type GeneratedPreliminary,
  type GeneratedReference,
} from "@/lib/ai/schema";
import type { ReportData } from "@/lib/validation/wizard";
import type { GenerationStage } from "@/lib/ai/stages";

export type { GenerationStage };

export interface GeneratedReport {
  preliminary: GeneratedPreliminary;
  chapters: GeneratedChapter[];
  references: GeneratedReference[];
}

/**
 * Runs the full generation pipeline: preliminary pages, five chapters (in
 * parallel), then a quality-control pass that re-generates any chapter it
 * flags as having invented facts or drifted from the source material
 * (product spec sections 43-45). `onStage` is called with real progress —
 * see STAGE_LABELS — so the client can show honest status, not a fake timer.
 */
export async function generateReport(
  reportData: ReportData,
  onStage: (stage: GenerationStage) => Promise<void>
): Promise<GeneratedReport> {
  const provider = getAIProvider();
  const context = buildReportContext(reportData);

  await onStage("understanding");
  // (No-op beyond context assembly — this stage exists so the user sees
  // something immediately while the first real AI calls are prepared.)

  await onStage("structuring");
  const preliminary = await generateValidatedJSON(provider, {
    system: SYSTEM_PROMPT,
    prompt: buildPreliminaryPrompt(context),
    schema: generatedPreliminarySchema,
    label: "preliminary",
  });

  const includeTables = reportData.preferences?.includeTables !== false;

  await onStage("writing_chapters");
  // Sequential, not Promise.all: free-tier AI API keys commonly cap requests
  // at a handful per minute, and firing five chapter calls at once blows
  // straight through that. One at a time costs wall-clock time but works
  // the same regardless of the provider's rate limit.
  const chapters: GeneratedChapter[] = [];
  for (const n of [1, 2, 3, 4, 5]) {
    chapters.push(
      await generateValidatedJSON(provider, {
        system: SYSTEM_PROMPT,
        prompt: buildChapterPrompt(n, context, includeTables),
        schema: generatedChapterSchema,
        label: `chapter_${n}`,
      })
    );
  }

  await onStage("quality_check");
  const qc = await generateValidatedJSON(provider, {
    system: SYSTEM_PROMPT,
    prompt: buildQualityControlPrompt(context, chapters),
    schema: qualityControlResultSchema,
    label: "quality_control",
  });

  let finalChapters = chapters;
  if (!qc.passed && qc.issues.length > 0) {
    const fixed: GeneratedChapter[] = [];
    for (const chapter of chapters) {
      const issue = qc.issues.find((i) => i.chapterNumber === chapter.number);
      if (!issue) {
        fixed.push(chapter);
        continue;
      }

      fixed.push(
        await generateValidatedJSON(provider, {
          system: SYSTEM_PROMPT,
          prompt: `${buildChapterPrompt(chapter.number, context, includeTables)}\n\nA review of your previous draft found this problem: "${issue.problem}". Rewrite the chapter to fix it.`,
          schema: generatedChapterSchema,
          label: `chapter_${chapter.number}_fix`,
        })
      );
    }
    finalChapters = fixed;
  }

  // References are the one exception to "never invent facts the student
  // didn't give us": bounded strictly to the exact technologies they listed
  // (buildReferencesPrompt refuses to add anything else, and tells the model
  // to omit any URL it isn't sure of rather than guess). Skipped entirely —
  // falling back to the manual placeholder in build-report.ts — when the
  // student opted out or listed no technologies to cite.
  const technologies = reportData.technologies?.technologies ?? [];
  const includeReferences = reportData.preferences?.includeReferences !== false;
  let references: GeneratedReference[] = [];
  if (includeReferences && technologies.length > 0) {
    const result = await generateValidatedJSON(provider, {
      system: SYSTEM_PROMPT,
      prompt: buildReferencesPrompt(technologies),
      schema: generatedReferencesSchema,
      label: "references",
    });
    references = result.references;
  }

  return { preliminary, chapters: finalChapters, references };
}
