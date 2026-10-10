-- Lets a section carry one structured table alongside its prose, so the
-- "include tables" report preference can actually do something: the AI
-- builds a table only from data the student already gave (see
-- src/lib/ai/prompts/chapters.ts), rendered as a real Word table on export.
alter table public.report_sections
  add column table_data jsonb;
