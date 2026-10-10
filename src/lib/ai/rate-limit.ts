import "server-only";
import { createClient } from "@/lib/supabase/server";

export class AiEditRateLimitError extends Error {
  constructor() {
    super("You've made a lot of AI edits in the last hour — please wait a bit and try again.");
  }
}

const MAX_AI_EDITS_PER_HOUR = 20;

/**
 * Throttles AI-powered section rewrites/regenerations. Unlike report
 * generation, these aren't gated by the credit system (editing text you
 * already paid to generate is a free part of the editor, not a new report),
 * so without this a scripted loop could call the AI provider unlimited
 * times for free. Counts the caller's own `report_section_versions` rows
 * from the last hour — every rewrite/regenerate already creates one (see
 * `updateSectionContent`), so no new table or in-memory state is needed,
 * and RLS already scopes the query to rows the caller owns.
 */
export async function assertUnderAiEditRateLimit(): Promise<void> {
  const supabase = await createClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count } = await supabase
    .from("report_section_versions")
    .select("id", { count: "exact", head: true })
    .gte("created_at", oneHourAgo);

  if ((count ?? 0) >= MAX_AI_EDITS_PER_HOUR) {
    throw new AiEditRateLimitError();
  }
}
