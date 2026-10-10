/**
 * References are the one place the AI is allowed to produce facts the
 * student didn't type verbatim (an official docs URL) — so the prompt
 * constrains it tightly to only the technologies the student actually
 * listed, and tells it to omit any URL it isn't certain about rather than
 * guess (product spec sections 19/45's anti-fabrication rule still applies).
 */
export function buildReferencesPrompt(technologies: string[]): string {
  return `The student explicitly listed using only these tools/technologies during their SIWES placement: ${technologies.join(", ")}.

Write a References section for their report, citing ONLY these ${technologies.length} tool(s)/technology(ies) — do not add any other entry, and do not invent authors, books, papers, or dates.

For each one, write one reference entry in this style: "<Technology name>. Official documentation." followed by its official documentation homepage URL ONLY if you are highly confident of the exact, stable URL (e.g. https://react.dev, https://nodejs.org, https://docs.python.org). If you are not fully certain of the precise URL for a technology, omit the URL entirely and write just the name and a one-line neutral description instead — never guess or fabricate a URL.

Return ONLY JSON in this exact shape:
{
  "references": [
    { "technology": "...", "citation": "..." }
  ]
}

Produce exactly one entry per technology listed above, in the same order, and nothing else.`;
}
