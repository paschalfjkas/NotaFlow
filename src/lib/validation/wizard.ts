import { z } from "zod";

export const WIZARD_STEPS = [
  "personal",
  "siwes",
  "company",
  "experience",
  "technologies",
  "challenges",
  "preferences",
] as const;

export type WizardStep = (typeof WIZARD_STEPS)[number];

export const STEP_LABELS: Record<WizardStep, string> = {
  personal: "Personal Information",
  siwes: "SIWES Information",
  company: "Company Information",
  experience: "Work Experience",
  technologies: "Tools & Technologies",
  challenges: "Challenges & Learning",
  preferences: "Report Preferences",
};

// Plain (non-optional) string: every field below always has a concrete
// default supplied by its page component, so the schema's input and output
// types stay identical — avoids the z.input/z.output divergence that
// `.optional().default()` would introduce against react-hook-form's single
// type parameter (see zodResolver's Resolver<TFieldValues> signature).
const text = z.string().trim();

// ---------------------------------------------------------------------------
// Step 1 — Personal Information
// ---------------------------------------------------------------------------
export const personalInfoSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name"),
  matricNumber: text,
  university: z.string().trim().min(2, "Enter your university"),
  facultySchool: text,
  department: z.string().trim().min(2, "Enter your department"),
  programme: text,
  academicSession: text,
  graduationYear: text,
});
export type PersonalInfo = z.infer<typeof personalInfoSchema>;

// ---------------------------------------------------------------------------
// Step 2 — SIWES Information
// ---------------------------------------------------------------------------
export const siwesInfoSchema = z.object({
  companyName: z.string().trim().min(2, "Enter the company/organisation name"),
  companyAddress: text,
  startDate: text,
  endDate: text,
  duration: text,
  departmentTeam: text,
  industrialSupervisor: text,
  institutionalSupervisor: text,
  headOfDepartment: text,
});
export type SiwesInfo = z.infer<typeof siwesInfoSchema>;

// ---------------------------------------------------------------------------
// Step 3 — Company Information
// ---------------------------------------------------------------------------
export const companyInfoSchema = z.object({
  dontKnow: z.boolean(),
  whatCompanyDoes: text,
  industry: text,
  productsServices: text,
  mission: text,
  vision: text,
  coreValues: text,
  departments: text,
  teamWorkedWith: text,
  companySize: text,
});
export type CompanyInfo = z.infer<typeof companyInfoSchema>;

// ---------------------------------------------------------------------------
// Step 4 — Work Experience
// ---------------------------------------------------------------------------
export const projectSchema = z.object({
  id: z.string(),
  projectName: z.string().trim().min(1, "Give the project a name"),
  description: text,
  technologies: text,
  role: text,
  learnings: text,
});
export type WizardProject = z.infer<typeof projectSchema>;

export const experienceSchema = z.object({
  projects: z.array(projectSchema),
  tasks: z.array(z.string()),
});
export type ExperienceInfo = z.infer<typeof experienceSchema>;

export const TASK_OPTIONS = [
  "Software development",
  "Software testing",
  "Quality assurance",
  "Database work",
  "Documentation",
  "Research",
  "Requirement gathering",
  "Data entry",
  "Data cleaning",
  "Data manipulation",
  "Technical support",
  "System integration",
  "API development/integration",
  "UI development",
  "Presentations",
  "Meetings",
  "Training",
  "Deployment",
  "Debugging",
];

// ---------------------------------------------------------------------------
// Step 5 — Tools and Technologies
// ---------------------------------------------------------------------------
export const technologiesSchema = z.object({
  technologies: z.array(z.string()),
});
export type TechnologiesInfo = z.infer<typeof technologiesSchema>;

export const TECHNOLOGY_CATEGORIES: { label: string; options: string[] }[] = [
  {
    label: "Programming",
    options: ["JavaScript", "TypeScript", "Python", "Java", "C#", "PHP", "C++", "Kotlin"],
  },
  { label: "Frontend", options: ["React", "Next.js", "Vue", "Angular", "HTML/CSS"] },
  { label: "Backend", options: ["Node.js", "Django", "Flask", "Laravel", "Spring Boot"] },
  {
    label: "Tools",
    options: ["VS Code", "Git", "GitHub", "Microsoft Teams", "Microsoft Office", "SharePoint"],
  },
  { label: "Enterprise", options: ["SAP", "S/4HANA", "Business One", "BYD"] },
  { label: "AI", options: ["ChatGPT", "Gemini", "Claude", "Other LLMs"] },
];

// ---------------------------------------------------------------------------
// Step 6 — Challenges and Learning
// ---------------------------------------------------------------------------
export const challengesSchema = z.object({
  biggestChallenge: z.string().trim().min(1, "Tell us about a challenge you faced"),
  howSolved: text,
  technicalSkills: z.array(z.string()),
  professionalSkills: z.array(z.string()),
  mostImportantLearning: text,
});
export type ChallengesInfo = z.infer<typeof challengesSchema>;

export const PROFESSIONAL_SKILL_OPTIONS = [
  "Communication",
  "Presentation",
  "Time management",
  "Teamwork",
  "Problem solving",
  "Leadership",
  "Adaptability",
  "Research",
  "Confidence",
];

// ---------------------------------------------------------------------------
// Step 7 — Report Preferences
// ---------------------------------------------------------------------------
export const preferencesSchema = z.object({
  reportLength: z.enum(["short", "standard", "detailed"]),
  writingStyle: z.enum(["formal_academic", "professional_natural", "simple_academic"]),
  includeScreenshots: z.boolean(),
  includeTables: z.boolean(),
  includeFigures: z.boolean(),
  includeReferences: z.boolean(),
});
export type PreferencesInfo = z.infer<typeof preferencesSchema>;

export const REPORT_LENGTH_LABELS: Record<PreferencesInfo["reportLength"], string> = {
  short: "Short (30–40 pages)",
  standard: "Standard (45–60 pages)",
  detailed: "Detailed (60–80 pages)",
};

export const WRITING_STYLE_LABELS: Record<PreferencesInfo["writingStyle"], string> = {
  formal_academic: "Formal academic",
  professional_natural: "Professional and natural",
  simple_academic: "Simple academic English",
};

// ---------------------------------------------------------------------------
// Combined report_data shape
// ---------------------------------------------------------------------------
export const reportDataSchema = z.object({
  personal: personalInfoSchema.partial().optional(),
  siwes: siwesInfoSchema.partial().optional(),
  company: companyInfoSchema.partial().optional(),
  experience: experienceSchema.partial().optional(),
  technologies: technologiesSchema.partial().optional(),
  challenges: challengesSchema.partial().optional(),
  preferences: preferencesSchema.partial().optional(),
});
export type ReportData = z.infer<typeof reportDataSchema>;

// ---------------------------------------------------------------------------
// Draft (autosave) schemas — same shape as the schemas above, minus the
// `.min()`/non-empty refinements. Autosave fires on a debounce while the
// user is mid-sentence in some OTHER field, so a required field being
// legitimately still-empty must not make the whole step fail to save; only
// the explicit "Continue" submit (validated client-side against the strict
// schemas above before this is ever called) should enforce completeness.
// ---------------------------------------------------------------------------
const draftProjectSchema = projectSchema.extend({ projectName: text });
const draftPersonalInfoSchema = personalInfoSchema.extend({
  fullName: text,
  university: text,
  department: text,
});
const draftSiwesInfoSchema = siwesInfoSchema.extend({ companyName: text });
const draftExperienceSchema = experienceSchema.extend({ projects: z.array(draftProjectSchema) });
const draftChallengesSchema = challengesSchema.extend({ biggestChallenge: text });

export const DRAFT_STEP_SCHEMAS = {
  personal: draftPersonalInfoSchema,
  siwes: draftSiwesInfoSchema,
  company: companyInfoSchema,
  experience: draftExperienceSchema,
  technologies: technologiesSchema,
  challenges: draftChallengesSchema,
  preferences: preferencesSchema,
} as const;

export const STEP_SCHEMAS = {
  personal: personalInfoSchema,
  siwes: siwesInfoSchema,
  company: companyInfoSchema,
  experience: experienceSchema,
  technologies: technologiesSchema,
  challenges: challengesSchema,
  preferences: preferencesSchema,
} as const;

export function nextStep(step: WizardStep): WizardStep | "review" {
  const i = WIZARD_STEPS.indexOf(step);
  return i === WIZARD_STEPS.length - 1 ? "review" : WIZARD_STEPS[i + 1];
}

export function previousStep(step: WizardStep): WizardStep | null {
  const i = WIZARD_STEPS.indexOf(step);
  return i === 0 ? null : WIZARD_STEPS[i - 1];
}
