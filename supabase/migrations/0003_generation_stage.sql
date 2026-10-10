-- Tracks real backend progress during AI generation so the client can show
-- honest stage labels instead of a fake timed progress bar (product spec
-- section 18: "Do not fake progress... display actual stages").
alter table public.reports
  add column generation_stage text;
