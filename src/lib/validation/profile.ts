import { z } from "zod";

const text = z.string().trim();

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name"),
  university: text,
  faculty: text,
  department: text,
  programme: text,
  matricNumber: text,
  academicSession: text,
  graduationYear: text,
});
export type ProfileInput = z.infer<typeof profileSchema>;
