"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validation/profile";

export type ActionResult = { error: string } | { success: true };

export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    university: formData.get("university"),
    faculty: formData.get("faculty"),
    department: formData.get("department"),
    programme: formData.get("programme"),
    matricNumber: formData.get("matricNumber"),
    academicSession: formData.get("academicSession"),
    graduationYear: formData.get("graduationYear"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session has expired." };

  const {
    fullName,
    university,
    faculty,
    department,
    programme,
    matricNumber,
    academicSession,
    graduationYear,
  } = parsed.data;

  let graduationYearValue: number | null = null;
  if (graduationYear) {
    const parsedYear = Number.parseInt(graduationYear, 10);
    graduationYearValue = Number.isNaN(parsedYear) ? null : parsedYear;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      university: university || null,
      faculty: faculty || null,
      department: department || null,
      programme: programme || null,
      matric_number: matricNumber || null,
      academic_session: academicSession || null,
      graduation_year: graduationYearValue,
    })
    .eq("id", user.id);

  if (error) return { error: "Could not save your profile. Please try again." };

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { success: true };
}
