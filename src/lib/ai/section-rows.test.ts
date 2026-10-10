import { describe, expect, it } from "vitest";
import { APPENDICES_PLACEHOLDER, buildSectionRows, REFERENCES_PLACEHOLDER } from "@/lib/ai/section-rows";
import type { GeneratedReport } from "@/lib/ai/pipeline";

function baseReport(overrides: Partial<GeneratedReport> = {}): GeneratedReport {
  return {
    preliminary: {
      coverTitle: "A Report",
      certification: "Certified.",
      dedication: "Dedicated.",
      acknowledgement: "Thanks.",
      abstract: "Abstract.",
    },
    chapters: [],
    references: [],
    ...overrides,
  };
}

describe("buildSectionRows", () => {
  it("emits the five preliminary pages first, in order, with no table", () => {
    const rows = buildSectionRows("report_1", baseReport());
    const preliminaryKeys = rows.slice(0, 5).map((r) => r.section_key);
    expect(preliminaryKeys).toEqual([
      "cover_title",
      "certification",
      "dedication",
      "acknowledgement",
      "abstract",
    ]);
    expect(rows.slice(0, 5).every((r) => r.chapter_number === null && r.table_data === null)).toBe(true);
  });

  it("falls back to the honest placeholder when no references were generated", () => {
    const rows = buildSectionRows("report_1", baseReport({ references: [] }));
    const references = rows.find((r) => r.section_key === "references");
    expect(references?.content).toBe(REFERENCES_PLACEHOLDER);
  });

  it("uses the AI's technology-bounded citations when references were generated", () => {
    const rows = buildSectionRows(
      "report_1",
      baseReport({
        references: [
          { technology: "React", citation: "React. Official documentation. https://react.dev" },
          { technology: "Node.js", citation: "Node.js. Official documentation." },
        ],
      })
    );
    const references = rows.find((r) => r.section_key === "references");
    expect(references?.content).toContain("React — React. Official documentation. https://react.dev");
    expect(references?.content).toContain("Node.js — Node.js. Official documentation.");
  });

  it("always includes an editable appendices placeholder (no source data to draft from)", () => {
    const rows = buildSectionRows("report_1", baseReport());
    const appendices = rows.find((r) => r.section_key === "appendices");
    expect(appendices?.content).toBe(APPENDICES_PLACEHOLDER);
    expect(appendices?.chapter_number).toBeNull();
  });

  it("maps each chapter's sections with the correct chapter_number and section_key", () => {
    const rows = buildSectionRows(
      "report_1",
      baseReport({
        chapters: [
          {
            number: 1,
            title: "Introduction",
            sections: [
              { heading: "Background", content: "Some prose." },
              { heading: "Scope", content: "More prose." },
            ],
          },
        ],
      })
    );
    const chapterRows = rows.filter((r) => r.chapter_number === 1);
    expect(chapterRows).toHaveLength(2);
    expect(chapterRows[0]).toMatchObject({ section_key: "ch1_0", title: "Background", content: "Some prose." });
    expect(chapterRows[1]).toMatchObject({ section_key: "ch1_1", title: "Scope", content: "More prose." });
  });

  it("carries a section's AI-attached table through as table_data", () => {
    const table = { caption: "Tools used", headers: ["Tool"], rows: [["Git"]] };
    const rows = buildSectionRows(
      "report_1",
      baseReport({
        chapters: [
          {
            number: 3,
            title: "Industrial Experience",
            sections: [{ heading: "Tools and Technologies Used", content: "Prose.", table }],
          },
        ],
      })
    );
    const section = rows.find((r) => r.section_key === "ch3_0");
    expect(section?.table_data).toEqual(table);
  });

  it("defaults a section's table_data to null when the AI didn't attach one", () => {
    const rows = buildSectionRows(
      "report_1",
      baseReport({
        chapters: [{ number: 1, title: "Introduction", sections: [{ heading: "Background", content: "Prose." }] }],
      })
    );
    expect(rows.find((r) => r.section_key === "ch1_0")?.table_data).toBeNull();
  });

  it("assigns strictly increasing order_index across preliminary, references/appendices, and chapters", () => {
    const rows = buildSectionRows(
      "report_1",
      baseReport({
        chapters: [{ number: 1, title: "Introduction", sections: [{ heading: "Background", content: "Prose." }] }],
      })
    );
    const indices = rows.map((r) => r.order_index);
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
    expect(new Set(indices).size).toBe(indices.length);
  });

  it("stamps every row with the given report_id", () => {
    const rows = buildSectionRows("report_42", baseReport());
    expect(rows.every((r) => r.report_id === "report_42")).toBe(true);
  });
});
