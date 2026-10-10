import type { GeneratedReport } from "@/lib/ai/pipeline";
import type { GeneratedTable } from "@/lib/ai/schema";

export const REFERENCES_PLACEHOLDER =
  "[Add the references you consulted during your SIWES placement — e.g. your institution's SIWES handbook, ITF guidelines, or course materials.]";
export const APPENDICES_PLACEHOLDER =
  "[Attach any supporting materials here, such as your SIWES logbook or letters.]";

export type SectionRowInsert = {
  report_id: string;
  section_key: string;
  chapter_number: number | null;
  title: string;
  content: string;
  table_data: GeneratedTable | null;
  order_index: number;
};

/**
 * Flattens a generated report into `report_sections` insert rows: preliminary
 * pages, then References/Appendices (editable, never just baked-in docx
 * text — see README "Admin dashboard" / generation notes), then every
 * chapter's sections with any AI-attached table carried through as
 * `table_data`. Pure and side-effect-free so the fallback/ordering logic is
 * directly testable without a database.
 */
export function buildSectionRows(reportId: string, result: GeneratedReport): SectionRowInsert[] {
  const rows: SectionRowInsert[] = [];

  let order = 0;
  const preliminaryEntries: [string, string, string][] = [
    ["cover_title", "Cover Title", result.preliminary.coverTitle],
    ["certification", "Certification", result.preliminary.certification],
    ["dedication", "Dedication", result.preliminary.dedication],
    ["acknowledgement", "Acknowledgement", result.preliminary.acknowledgement],
    ["abstract", "Abstract", result.preliminary.abstract],
  ];

  for (const [key, title, content] of preliminaryEntries) {
    rows.push({
      report_id: reportId,
      section_key: key,
      chapter_number: null,
      title,
      content,
      table_data: null,
      order_index: order++,
    });
  }

  // References are editable like any other section, pre-filled with the
  // AI's technology-bounded citations when available (see pipeline.ts), or
  // the honest manual placeholder when they weren't generated. Appendices
  // has no equivalent source data to draft from, so it's always the
  // placeholder — but still a real, editable section rather than text baked
  // into the docx export.
  const referencesContent =
    result.references.length > 0
      ? result.references.map((r) => `${r.technology} — ${r.citation}`).join("\n\n")
      : REFERENCES_PLACEHOLDER;

  rows.push({
    report_id: reportId,
    section_key: "references",
    chapter_number: null,
    title: "References",
    content: referencesContent,
    table_data: null,
    order_index: order++,
  });
  rows.push({
    report_id: reportId,
    section_key: "appendices",
    chapter_number: null,
    title: "Appendices",
    content: APPENDICES_PLACEHOLDER,
    table_data: null,
    order_index: order++,
  });

  for (const chapter of result.chapters) {
    chapter.sections.forEach((section, i) => {
      rows.push({
        report_id: reportId,
        section_key: `ch${chapter.number}_${i}`,
        chapter_number: chapter.number,
        title: section.heading,
        content: section.content,
        table_data: section.table ?? null,
        order_index: order++,
      });
    });
  }

  return rows;
}
