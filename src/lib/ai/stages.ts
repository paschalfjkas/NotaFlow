// No "server-only" here — these labels are displayed client-side while
// polling generation status, so this module must be safe to import from
// client components.
export type GenerationStage =
  | "understanding"
  | "structuring"
  | "writing_chapters"
  | "quality_check";

export const GENERATION_STAGE_ORDER: GenerationStage[] = [
  "understanding",
  "structuring",
  "writing_chapters",
  "quality_check",
];

export const STAGE_LABELS: Record<GenerationStage, string> = {
  understanding: "Understanding your experience",
  structuring: "Structuring your report",
  writing_chapters: "Writing the chapters",
  quality_check: "Personalizing your experience",
};
