import { CHAPTER_TITLES } from "@/lib/ai/schema";

const CHAPTER_GUIDANCE: Record<number, string> = {
  1: `Write Chapter One — Introduction. This chapter is mostly general/educational (it does not need much student-specific detail), covering:
- Introduction (brief framing of the report)
- Background of SIWES (what the scheme is, why it exists in Nigerian tertiary education)
- Objectives of SIWES
- Importance of SIWES
- Benefits of Industrial Training
- Scope of Training (tie this one to the student's actual placement — company, duration, department)
Produce 4-6 sections covering these points (you may combine related points into one section).`,

  2: `Write Chapter Two — Company Profile and Organisational Overview, built entirely from the COMPANY INFORMATION in the context. If the student marked company information as unknown, write a short honest chapter noting that detailed company information was not available, and keep sections brief rather than inventing facts. Otherwise cover:
- Company Profile (overview, nature of business)
- Mission, Vision, Core Values
- Products and Services
- Organisational Structure / Departments
- Team Worked With
Produce 4-6 sections.`,

  3: `Write Chapter Three — Industrial Experience and Work Undertaken. This is the LONGEST and most important chapter — it should be substantially longer than the others. Build it entirely from the PROJECTS, TASKS PERFORMED, and TOOLS AND TECHNOLOGIES in the context. Generate sections relevant to what the student actually did — for example (only include ones that fit their real activities): Orientation, each notable Project, Software Development, Testing/QA, Database Activities, Documentation, Research, APIs/System Integration, Technical Support, Meetings/Training, Tools and Technologies Used. Do not create empty or generic sections for activities the student didn't mention. Produce 6-10 sections.`,

  4: `Write Chapter Four — Challenges Encountered and Solutions, built from the CHALLENGES AND LEARNING in the context. Cover the specific challenge(s) described, how they were solved, and lessons learned. If only one challenge was provided, write a focused chapter around it rather than inventing additional challenges. Produce 3-5 sections.`,

  5: `Write Chapter Five — Summary, Conclusion and Recommendations. Cover:
- Summary of the SIWES experience
- Skills gained (technical and professional, from the context)
- Lessons learned
- Recommendations to students
- Recommendations to the university
- Recommendations to the host organisation
- Conclusion
Produce 5-7 sections.`,
};

export function buildChapterPrompt(
  chapterNumber: number,
  context: string,
  includeTables: boolean
): string {
  const guidance = CHAPTER_GUIDANCE[chapterNumber];
  const title = CHAPTER_TITLES[chapterNumber];

  const tableGuidance = includeTables
    ? `TABLES: For at most one or two sections in this chapter where the student's information above is itself a list of discrete items (e.g. tasks performed, tools and technologies used, a list of projects, a weekly/monthly schedule), you may set that section's "table" field to a table built ONLY from that exact information — never invent rows, counts, or dates that aren't present above. Every other section must leave "table" as null. Table shape: { "caption": "short descriptive caption", "headers": ["col1", "col2", ...], "rows": [["...", "..."], ...] }.`
    : `TABLES: Always leave each section's "table" field as null — the student did not request tables.`;

  return `Here is the student's information:

${context}

---

${guidance}

${tableGuidance}

Return ONLY JSON in this exact shape:
{
  "number": ${chapterNumber},
  "title": "${title}",
  "sections": [
    { "heading": "...", "content": "...", "table": null }
  ]
}

Each section's "content" should be 2-4 paragraphs of flowing prose (not bullet points), written in the requested writing style and appropriate for the requested report length. Remember: never invent facts not present in the student's information above.`;
}
