import { describe, expect, it } from "vitest";
import {
  generatedChapterSchema,
  generatedPreliminarySchema,
  generatedReferencesSchema,
  generatedTableSchema,
  qualityControlResultSchema,
} from "@/lib/ai/schema";

describe("generatedTableSchema", () => {
  it("accepts a well-formed table", () => {
    const result = generatedTableSchema.safeParse({
      caption: "Tools and technologies used",
      headers: ["Tool", "Purpose"],
      rows: [["React", "Frontend UI"], ["Node.js", "Backend API"]],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a table with no headers", () => {
    const result = generatedTableSchema.safeParse({ caption: "x", headers: [], rows: [["a"]] });
    expect(result.success).toBe(false);
  });

  it("rejects a table with no rows", () => {
    const result = generatedTableSchema.safeParse({ caption: "x", headers: ["a"], rows: [] });
    expect(result.success).toBe(false);
  });
});

describe("generatedChapterSchema", () => {
  it("accepts a chapter whose sections omit the optional table field", () => {
    const result = generatedChapterSchema.safeParse({
      number: 1,
      title: "Introduction",
      sections: [{ heading: "Background", content: "Some prose." }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts a chapter whose section explicitly sets table to null", () => {
    const result = generatedChapterSchema.safeParse({
      number: 1,
      title: "Introduction",
      sections: [{ heading: "Background", content: "Some prose.", table: null }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts a chapter whose section carries a real table", () => {
    const result = generatedChapterSchema.safeParse({
      number: 3,
      title: "Industrial Experience",
      sections: [
        {
          heading: "Tools and Technologies Used",
          content: "Some prose.",
          table: { caption: "Tools used", headers: ["Tool"], rows: [["Git"]] },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a chapter number outside 1-5", () => {
    const result = generatedChapterSchema.safeParse({
      number: 6,
      title: "Invalid",
      sections: [{ heading: "x", content: "y" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a chapter with zero sections", () => {
    const result = generatedChapterSchema.safeParse({ number: 1, title: "x", sections: [] });
    expect(result.success).toBe(false);
  });
});

describe("generatedPreliminarySchema", () => {
  it("requires every preliminary field to be non-empty", () => {
    const result = generatedPreliminarySchema.safeParse({
      coverTitle: "A Report",
      certification: "",
      dedication: "x",
      acknowledgement: "x",
      abstract: "x",
    });
    expect(result.success).toBe(false);
  });
});

describe("generatedReferencesSchema", () => {
  it("accepts an empty references list (no technologies were named)", () => {
    expect(generatedReferencesSchema.safeParse({ references: [] }).success).toBe(true);
  });

  it("accepts one entry per technology with a technology name and citation", () => {
    const result = generatedReferencesSchema.safeParse({
      references: [{ technology: "React", citation: "React. Official documentation." }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an entry missing the citation", () => {
    const result = generatedReferencesSchema.safeParse({
      references: [{ technology: "React" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("qualityControlResultSchema", () => {
  it("accepts a passed result with no issues", () => {
    expect(qualityControlResultSchema.safeParse({ passed: true, issues: [] }).success).toBe(true);
  });

  it("accepts a failed result with chapter-numbered issues", () => {
    const result = qualityControlResultSchema.safeParse({
      passed: false,
      issues: [{ chapterNumber: 2, problem: "Invented a company statistic." }],
    });
    expect(result.success).toBe(true);
  });
});
