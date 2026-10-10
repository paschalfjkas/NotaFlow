import { describe, expect, it } from "vitest";
import {
  DRAFT_STEP_SCHEMAS,
  STEP_SCHEMAS,
  personalInfoSchema,
  preferencesSchema,
} from "@/lib/validation/wizard";

describe("STEP_SCHEMAS (strict, used by the Continue button)", () => {
  it("rejects a personal info step missing required fields", () => {
    const result = STEP_SCHEMAS.personal.safeParse({
      fullName: "",
      matricNumber: "",
      university: "",
      facultySchool: "",
      department: "",
      programme: "",
      academicSession: "",
      graduationYear: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a fully filled-in personal info step", () => {
    const result = personalInfoSchema.safeParse({
      fullName: "Chidinma Okafor",
      matricNumber: "190401234",
      university: "University of Lagos",
      facultySchool: "Faculty of Science",
      department: "Computer Science",
      programme: "B.Sc. Computer Science",
      academicSession: "2025/2026",
      graduationYear: "2027",
    });
    expect(result.success).toBe(true);
  });
});

describe("DRAFT_STEP_SCHEMAS (lenient, used by autosave)", () => {
  it("accepts a personal info step that is still mid-typing (required fields blank)", () => {
    // This is the real bug this split schema fixed: autosave firing while a
    // required field is still legitimately empty must not error.
    const result = DRAFT_STEP_SCHEMAS.personal.safeParse({
      fullName: "",
      matricNumber: "",
      university: "",
      facultySchool: "",
      department: "",
      programme: "",
      academicSession: "",
      graduationYear: "",
    });
    expect(result.success).toBe(true);
  });

  it("still accepts a complete personal info step", () => {
    const result = DRAFT_STEP_SCHEMAS.personal.safeParse({
      fullName: "Chidinma Okafor",
      matricNumber: "",
      university: "University of Lagos",
      facultySchool: "",
      department: "Computer Science",
      programme: "",
      academicSession: "",
      graduationYear: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an experience draft with an empty project name", () => {
    const result = DRAFT_STEP_SCHEMAS.experience.safeParse({
      projects: [{ id: "1", projectName: "", description: "", technologies: "", role: "", learnings: "" }],
      tasks: [],
    });
    expect(result.success).toBe(true);
  });
});

describe("preferencesSchema", () => {
  it("rejects an invalid reportLength enum value", () => {
    const result = preferencesSchema.safeParse({
      reportLength: "extra_long",
      writingStyle: "professional_natural",
      includeScreenshots: true,
      includeTables: true,
      includeFigures: true,
      includeReferences: true,
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid preferences object", () => {
    const result = preferencesSchema.safeParse({
      reportLength: "standard",
      writingStyle: "professional_natural",
      includeScreenshots: true,
      includeTables: false,
      includeFigures: true,
      includeReferences: true,
    });
    expect(result.success).toBe(true);
  });
});
