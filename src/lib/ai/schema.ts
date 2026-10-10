import { z } from "zod";

export const generatedTableSchema = z.object({
  caption: z.string().min(1),
  headers: z.array(z.string().min(1)).min(1),
  rows: z.array(z.array(z.string())).min(1),
});
export type GeneratedTable = z.infer<typeof generatedTableSchema>;

export const generatedSectionSchema = z.object({
  heading: z.string().min(1),
  content: z.string().min(1),
  table: generatedTableSchema.nullable().optional(),
});
export type GeneratedSection = z.infer<typeof generatedSectionSchema>;

export const generatedReferenceSchema = z.object({
  technology: z.string().min(1),
  citation: z.string().min(1),
});
export type GeneratedReference = z.infer<typeof generatedReferenceSchema>;

export const generatedReferencesSchema = z.object({
  references: z.array(generatedReferenceSchema),
});

export const generatedChapterSchema = z.object({
  number: z.number().int().min(1).max(5),
  title: z.string().min(1),
  sections: z.array(generatedSectionSchema).min(1),
});
export type GeneratedChapter = z.infer<typeof generatedChapterSchema>;

export const generatedPreliminarySchema = z.object({
  coverTitle: z.string().min(1),
  certification: z.string().min(1),
  dedication: z.string().min(1),
  acknowledgement: z.string().min(1),
  abstract: z.string().min(1),
});
export type GeneratedPreliminary = z.infer<typeof generatedPreliminarySchema>;

export const qualityControlIssueSchema = z.object({
  chapterNumber: z.number().int().min(1).max(5),
  problem: z.string().min(1),
});

export const qualityControlResultSchema = z.object({
  passed: z.boolean(),
  issues: z.array(qualityControlIssueSchema),
});
export type QualityControlResult = z.infer<typeof qualityControlResultSchema>;

export const sectionContentSchema = z.object({
  content: z.string().min(1),
});

export const CHAPTER_TITLES: Record<number, string> = {
  1: "Introduction",
  2: "Company Profile and Organisational Overview",
  3: "Industrial Experience and Work Undertaken",
  4: "Challenges Encountered and Solutions",
  5: "Summary, Conclusion and Recommendations",
};
