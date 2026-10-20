-- Manual bank-transfer payments: students pay into a disclosed account and
-- upload a receipt; an admin reviews it and grants credits. Paystack stays
-- fully intact (see transactions.provider) — this just adds a second,
-- parallel provider value and the one new column/table it needs.

alter table public.transactions
  add column receipt_storage_path text;

-- ---------------------------------------------------------------------------
-- payment_settings — single-row table holding the bank account students pay
-- into. Admin-editable without a redeploy (unlike env vars).
-- ---------------------------------------------------------------------------
create table public.payment_settings (
  id text primary key default 'default',
  bank_name text not null default '',
  account_number text not null default '',
  account_name text not null default '',
  instructions text not null default '',
  updated_at timestamptz not null default now(),
  constraint payment_settings_singleton check (id = 'default')
);

create trigger payment_settings_set_updated_at
  before update on public.payment_settings
  for each row execute function public.set_updated_at();

insert into public.payment_settings (id) values ('default');

alter table public.payment_settings enable row level security;

-- Every signed-in student needs to read the bank details to pay; writes only
-- ever happen via the service role from the admin settings form.
create policy "payment_settings_select_authenticated" on public.payment_settings
  for select using (auth.uid() is not null);
