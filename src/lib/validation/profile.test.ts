import { describe, expect, it } from "vitest";
import { profileSchema } from "@/lib/validation/profile";

describe("profileSchema", () => {
  it("requires a full name of at least 2 characters", () => {
    const result = profileSchema.safeParse({
      fullName: "A",
      university: "",
      faculty: "",
      department: "",
      programme: "",
      matricNumber: "",
      academicSession: "",
      graduationYear: "",
    });
    expect(result.success).toBe(false);
  });

  it("allows every other field to be blank", () => {
    const result = profileSchema.safeParse({
      fullName: "Chidinma Okafor",
      university: "",
      faculty: "",
      department: "",
      programme: "",
      matricNumber: "",
      academicSession: "",
      graduationYear: "",
    });
    expect(result.success).toBe(true);
  });

  it("trims surrounding whitespace", () => {
    const result = profileSchema.safeParse({
      fullName: "  Chidinma Okafor  ",
      university: "  University of Lagos  ",
      faculty: "",
      department: "",
      programme: "",
      matricNumber: "",
      academicSession: "",
      graduationYear: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fullName).toBe("Chidinma Okafor");
      expect(result.data.university).toBe("University of Lagos");
    }
  });
});
