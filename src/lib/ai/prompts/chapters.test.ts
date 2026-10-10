import { describe, expect, it } from "vitest";
import { buildChapterPrompt } from "@/lib/ai/prompts/chapters";

describe("buildChapterPrompt", () => {
  it("includes the student context verbatim", () => {
    const prompt = buildChapterPrompt(1, "STUDENT CONTEXT HERE", true);
    expect(prompt).toContain("STUDENT CONTEXT HERE");
  });

  it("instructs the model it may use tables when includeTables is true", () => {
    const prompt = buildChapterPrompt(3, "context", true);
    expect(prompt).toContain('you may set that section\'s "table" field');
  });

  it("instructs the model to always leave table null when includeTables is false", () => {
    const prompt = buildChapterPrompt(3, "context", false);
    expect(prompt).toContain('Always leave each section\'s "table" field as null');
    expect(prompt).not.toContain('you may set that section\'s "table" field');
  });

  it("never invents facts not present in the student's information", () => {
    const prompt = buildChapterPrompt(1, "context", false);
    expect(prompt).toContain("never invent facts not present in the student's information above");
  });

  it("uses the correct chapter title and guidance per chapter number", () => {
    const chapter2 = buildChapterPrompt(2, "context", false);
    expect(chapter2).toContain("Company Profile and Organisational Overview");
    expect(chapter2).toContain("rather than inventing facts");

    const chapter4 = buildChapterPrompt(4, "context", false);
    expect(chapter4).toContain("Challenges Encountered and Solutions");
  });
});
