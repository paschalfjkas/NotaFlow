import type { GeneratedChapter } from "@/lib/ai/schema";

/**
 * Second-pass validation (product spec section 44): asks the model to
 * review its own output against the original facts and flag — not fix —
 * anything invented or inconsistent. Flagged chapters are regenerated with
 * the specific problem appended to their prompt.
 */
export function buildQualityControlPrompt(context: string, chapters: GeneratedChapter[]): string {
  const chaptersText = chapters
    .map(
      (c) =>
        `Chapter ${c.number} — ${c.title}\n` +
        c.sections.map((s) => `  ${s.heading}: ${s.content}`).join("\n")
    )
    .join("\n\n");

  return `Here is the student's original information:

${context}

---

Here are the generated report chapters:

${chaptersText}

---

Review the generated chapters against the original information. For each chapter, check:
- Did it invent personal information, supervisor names, or company facts not in the original information?
- Did it change or add technologies the student didn't mention?
- Did it exaggerate the student's responsibilities (e.g. claiming they "developed" something they only "tested")?
- Is the writing natural and non-repetitive, without AI clichés?
- Are sections relevant to what the student actually did (no generic padding)?

Return ONLY JSON in this exact shape:
{
  "passed": true or false,
  "issues": [
    { "chapterNumber": 1, "problem": "specific description of what's wrong" }
  ]
}

If there are no problems, return "passed": true and an empty issues array. Only flag real, specific problems — do not flag stylistic nitpicks.`;
}
