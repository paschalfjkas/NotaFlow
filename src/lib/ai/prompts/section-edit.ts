export type RewriteMode =
  | "improve"
  | "natural"
  | "academic"
  | "shorten"
  | "expand"
  | "fix_grammar";

export const REWRITE_MODE_LABELS: Record<RewriteMode, string> = {
  improve: "Improve writing",
  natural: "Make more natural",
  academic: "Make more academic",
  shorten: "Shorten",
  expand: "Expand",
  fix_grammar: "Fix grammar",
};

const REWRITE_INSTRUCTIONS: Record<RewriteMode, string> = {
  improve: "Improve the overall clarity, flow, and professionalism of this text without changing its meaning.",
  natural: "Rewrite this to sound more natural and human, less like an AI wrote it — vary sentence structure, cut clichés.",
  academic: "Rewrite this in a more formal academic register appropriate for a university report.",
  shorten: "Shorten this to roughly two-thirds its current length while keeping every factual claim.",
  expand: "Expand this with more professional detail and elaboration, without introducing any new facts not already implied by the text.",
  fix_grammar: "Fix any grammar, spelling, and punctuation errors. Do not change the meaning or wording otherwise.",
};

/**
 * Rewrites take the EXISTING section text as the only source of truth — no
 * access to the original wizard answers — so the instruction is explicit
 * that no new facts may be introduced, only transformed.
 */
export function buildRewritePrompt(content: string, mode: RewriteMode): string {
  return `Here is a section from a student's SIWES report:

"""
${content}
"""

${REWRITE_INSTRUCTIONS[mode]}

Do not invent any new facts, names, technologies, or claims that aren't already in the text above.

Return ONLY JSON in this exact shape:
{ "content": "the rewritten text" }`;
}

export function buildSectionRegeneratePrompt(
  context: string,
  chapterTitle: string,
  sectionHeading: string
): string {
  return `Here is the student's information:

${context}

---

Rewrite ONLY this one section of their SIWES report:

Chapter: ${chapterTitle}
Section: ${sectionHeading}

Write 2-4 paragraphs of flowing prose for this section specifically, drawing only from the student's information above. Never invent facts not present in it.

Return ONLY JSON in this exact shape:
{ "content": "the section text" }`;
}
