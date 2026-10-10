import { describe, expect, it } from "vitest";
import { buildReportContext } from "@/lib/ai/context";
import type { ReportData } from "@/lib/validation/wizard";

describe("buildReportContext (anti-fabrication context assembly)", () => {
  it("marks every missing field as 'Not provided' rather than leaving it blank", () => {
    const context = buildReportContext({});
    expect(context).toContain("Not provided — do not invent this");
    expect(context).not.toMatch(/Full name:\s*$/m);
  });

  it("passes provided facts through verbatim instead of paraphrasing them", () => {
    const data: ReportData = {
      personal: { fullName: "Chidinma Okafor", university: "University of Lagos" },
    };
    const context = buildReportContext(data);
    expect(context).toContain("Chidinma Okafor");
    expect(context).toContain("University of Lagos");
  });

  it("tells the model never to invent company facts when the student marked it unknown", () => {
    const data: ReportData = { company: { dontKnow: true } };
    const context = buildReportContext(data);
    expect(context).toContain("do not invent any company facts");
    // The unknown-company branch should not also print the (unset) detail fields.
    expect(context).not.toContain("What the company does:");
  });

  it("prints company details when they are known", () => {
    const data: ReportData = {
      company: { dontKnow: false, whatCompanyDoes: "Builds payment infrastructure" },
    };
    const context = buildReportContext(data);
    expect(context).toContain("Builds payment infrastructure");
  });

  it("joins tools and technologies into a comma-separated list", () => {
    const data: ReportData = { technologies: { technologies: ["React", "Node.js", "PostgreSQL"] } };
    const context = buildReportContext(data);
    expect(context).toContain("React, Node.js, PostgreSQL");
  });

  it("reports no technologies as 'Not provided', not an empty list", () => {
    const data: ReportData = { technologies: { technologies: [] } };
    const context = buildReportContext(data);
    expect(context).toMatch(/TOOLS AND TECHNOLOGIES USED\s*\n\s*Not provided/);
  });

  it("falls back to 'None provided.' when there are no projects", () => {
    const data: ReportData = { experience: { projects: [], tasks: [] } };
    const context = buildReportContext(data);
    expect(context).toContain("None provided.");
  });

  it("defaults report length and writing style labels when preferences are unset", () => {
    const context = buildReportContext({});
    expect(context).toContain("Length: Standard");
    expect(context).toContain("Writing style: Professional and natural");
  });

  it("uses the chosen report length and writing style labels when set", () => {
    const data: ReportData = {
      preferences: { reportLength: "detailed", writingStyle: "formal_academic" },
    };
    const context = buildReportContext(data);
    expect(context).toContain("Length: Detailed (60–80 pages)");
    expect(context).toContain("Writing style: Formal academic");
  });
});
