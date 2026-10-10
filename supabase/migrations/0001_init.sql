-- SIWES Report Generator — initial schema
-- Applies on top of Supabase's built-in `auth.users` table.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  university text,
  faculty text,
  department text,
  programme text,
  matric_number text,
  academic_session text,
  graduation_year int,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- credits
-- ---------------------------------------------------------------------------
create table public.credits (
  user_id uuid primary key references auth.users (id) on delete cascade,
  free_credits int not null default 1 check (free_credits >= 0),
  paid_credits int not null default 0 check (paid_credits >= 0),
  updated_at timestamptz not null default now()
);

create trigger credits_set_updated_at
  before update on public.credits
  for each row execute function public.set_updated_at();

alter table public.credits enable row level security;

create policy "credits_select_own" on public.credits
  for select using (auth.uid() = user_id);

-- Credits are only ever mutated server-side with the service role key
-- (see lib/credits.ts), so no insert/update policy is granted to clients.

-- ---------------------------------------------------------------------------
-- new-user bootstrap: create profile + credits row on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));

  insert into public.credits (user_id, free_credits, paid_credits)
  values (new.id, 1, 0);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- pricing_packages (admin-configurable, section 32)
-- ---------------------------------------------------------------------------
create table public.pricing_packages (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  credits int not null check (credits > 0),
  price_kobo bigint not null check (price_kobo > 0),
  currency text not null default 'NGN',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger pricing_packages_set_updated_at
  before update on public.pricing_packages
  for each row execute function public.set_updated_at();

alter table public.pricing_packages enable row level security;

create policy "pricing_packages_select_active" on public.pricing_packages
  for select using (active = true);

insert into public.pricing_packages (key, name, credits, price_kobo, sort_order) values
  ('single', 'Single Report', 1, 200000, 1),
  ('five_pack', '5 Reports', 5, 750000, 2);

-- ---------------------------------------------------------------------------
-- reports
-- ---------------------------------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Untitled SIWES Report',
  status text not null default 'draft'
    check (status in ('draft', 'generating', 'completed', 'failed')),
  current_step text not null default 'personal',
  report_data jsonb not null default '{}'::jsonb,
  generated_content jsonb,
  docx_storage_path text,
  generation_error text,
  credit_source text check (credit_source in ('free', 'paid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reports_user_id_idx on public.reports (user_id);

create trigger reports_set_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

alter table public.reports enable row level security;

create policy "reports_select_own" on public.reports
  for select using (auth.uid() = user_id);

create policy "reports_insert_own" on public.reports
  for insert with check (auth.uid() = user_id);

create policy "reports_update_own" on public.reports
  for update using (auth.uid() = user_id);

create policy "reports_delete_own" on public.reports
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- report_projects
-- ---------------------------------------------------------------------------
create table public.report_projects (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  project_name text not null,
  description text,
  role text,
  technologies text,
  learnings text,
  order_index int not null default 0
);

alter table public.report_projects enable row level security;

create policy "report_projects_owner" on public.report_projects
  for all using (
    exists (select 1 from public.reports r where r.id = report_id and r.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- report_tasks
-- ---------------------------------------------------------------------------
create table public.report_tasks (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  task text not null,
  description text
);

alter table public.report_tasks enable row level security;

create policy "report_tasks_owner" on public.report_tasks
  for all using (
    exists (select 1 from public.reports r where r.id = report_id and r.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- report_challenges
-- ---------------------------------------------------------------------------
create table public.report_challenges (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  challenge text not null,
  solution text,
  lesson text
);

alter table public.report_challenges enable row level security;

create policy "report_challenges_owner" on public.report_challenges
  for all using (
    exists (select 1 from public.reports r where r.id = report_id and r.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- report_sections (editable chapter content, with simple versioning)
-- ---------------------------------------------------------------------------
create table public.report_sections (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  section_key text not null,
  chapter_number int,
  title text not null,
  content text not null default '',
  order_index int not null default 0,
  version int not null default 1,
  updated_at timestamptz not null default now(),
  unique (report_id, section_key)
);

create trigger report_sections_set_updated_at
  before update on public.report_sections
  for each row execute function public.set_updated_at();

alter table public.report_sections enable row level security;

create policy "report_sections_owner" on public.report_sections
  for all using (
    exists (select 1 from public.reports r where r.id = report_id and r.user_id = auth.uid())
  );

create table public.report_section_versions (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.report_sections (id) on delete cascade,
  content text not null,
  version int not null,
  created_at timestamptz not null default now()
);

alter table public.report_section_versions enable row level security;

create policy "report_section_versions_owner" on public.report_section_versions
  for all using (
    exists (
      select 1 from public.report_sections s
      join public.reports r on r.id = s.report_id
      where s.id = section_id and r.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- report_screenshots
-- ---------------------------------------------------------------------------
create table public.report_screenshots (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  section_id uuid references public.report_sections (id) on delete set null,
  storage_path text,
  caption text not null default '',
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.report_screenshots enable row level security;

create policy "report_screenshots_owner" on public.report_screenshots
  for all using (
    exists (select 1 from public.reports r where r.id = report_id and r.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- transactions (Paystack)
-- ---------------------------------------------------------------------------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  reference text not null unique,
  package_key text not null references public.pricing_packages (key),
  amount_kobo bigint not null,
  currency text not null default 'NGN',
  status text not null default 'pending'
    check (status in ('pending', 'success', 'failed', 'cancelled')),
  credits int not null,
  provider text not null default 'paystack',
  provider_raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transactions_user_id_idx on public.transactions (user_id);

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

alter table public.transactions enable row level security;

create policy "transactions_select_own" on public.transactions
  for select using (auth.uid() = user_id);

-- Inserts/updates to transactions happen only via the service role
-- (checkout init + webhook handler), so no client write policy exists.

-- ---------------------------------------------------------------------------
-- analytics_events
-- ---------------------------------------------------------------------------
create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index analytics_events_name_idx on public.analytics_events (event_name);

-- No RLS policies: all analytics writes/reads go through the service role.
alter table public.analytics_events enable row level security;
