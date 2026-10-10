export function buildPreliminaryPrompt(context: string): string {
  return `Here is the student's information:

${context}

---

Write the preliminary pages of a SIWES report:
- coverTitle: a short formal report title (e.g. "A Report On Student Industrial Work Experience Scheme Undertaken At <Company>")
- certification: a standard certification paragraph stating the report was carried out by the named student and submitted in partial fulfilment of SIWES requirements. If the supervisor names are "To be confirmed", use that phrase rather than inventing names.
- dedication: a short, natural one-paragraph dedication (generic is fine here — the student can personalise it later)
- acknowledgement: a short acknowledgement paragraph thanking the institutional and industrial supervisors (by name if known, otherwise generically), the host company, and family/friends
- abstract: a 150-250 word abstract summarising the placement, what the student did, and what they gained

Return ONLY JSON in this exact shape:
{
  "coverTitle": "...",
  "certification": "...",
  "dedication": "...",
  "acknowledgement": "...",
  "abstract": "..."
}`;
}
