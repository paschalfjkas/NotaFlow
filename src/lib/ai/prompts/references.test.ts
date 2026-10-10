import { describe, expect, it } from "vitest";
import { buildReferencesPrompt } from "@/lib/ai/prompts/references";

describe("buildReferencesPrompt", () => {
  it("lists every named technology for the model to cite", () => {
    const prompt = buildReferencesPrompt(["React", "Node.js", "PostgreSQL"]);
    expect(prompt).toContain("React, Node.js, PostgreSQL");
  });

  it("tells the model to cite ONLY the named technologies and nothing else", () => {
    const prompt = buildReferencesPrompt(["React"]);
    expect(prompt).toContain("citing ONLY these");
    expect(prompt).toContain("do not add any other entry");
  });

  it("tells the model to omit a URL it isn't certain of rather than guess", () => {
    const prompt = buildReferencesPrompt(["React"]);
    expect(prompt).toContain("never guess or fabricate a URL");
  });

  it("asks for exactly one entry per technology, in order", () => {
    const prompt = buildReferencesPrompt(["React", "Node.js"]);
    expect(prompt).toContain("exactly one entry per technology listed above, in the same order");
  });
});
