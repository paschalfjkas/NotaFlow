import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { GeneratedTable } from "@/lib/ai/schema";

export type SectionRow = {
  id: string;
  report_id: string;
  section_key: string;
  chapter_number: number | null;
  title: string;
  content: string;
  table_data: GeneratedTable | null;
  order_index: number;
  version: number;
  updated_at: string;
};

export async function getSections(reportId: string): Promise<SectionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("report_sections")
    .select("*")
    .eq("report_id", reportId)
    .order("order_index");

  if (error) throw error;
  return data as SectionRow[];
}

export async function getSection(sectionId: string): Promise<SectionRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("report_sections")
    .select("*")
    .eq("id", sectionId)
    .maybeSingle();

  return data as SectionRow | null;
}

/**
 * Overwrites a section's content, first snapshotting the previous content
 * into `report_section_versions` (product spec section 46, "Report
 * Versioning") so an edit or AI rewrite can always be reverted.
 */
export async function updateSectionContent(
  sectionId: string,
  newContent: string
): Promise<SectionRow> {
  const supabase = await createClient();

  const { data: current, error: fetchError } = await supabase
    .from("report_sections")
    .select("content, version")
    .eq("id", sectionId)
    .single();

  if (fetchError || !current) throw fetchError ?? new Error("Section not found");

  await supabase.from("report_section_versions").insert({
    section_id: sectionId,
    content: current.content,
    version: current.version,
  });

  const { data: updated, error: updateError } = await supabase
    .from("report_sections")
    .update({ content: newContent, version: current.version + 1 })
    .eq("id", sectionId)
    .select("*")
    .single();

  if (updateError) throw updateError;
  return updated as SectionRow;
}

export async function clearSectionTable(sectionId: string): Promise<SectionRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("report_sections")
    .update({ table_data: null })
    .eq("id", sectionId)
    .select("*")
    .single();

  if (error) throw error;
  return data as SectionRow;
}

export async function getSectionVersions(sectionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("report_section_versions")
    .select("id, content, version, created_at")
    .eq("section_id", sectionId)
    .order("version", { ascending: false });

  if (error) throw error;
  return data;
}
