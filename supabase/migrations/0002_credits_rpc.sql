-- Atomic credit consumption. `for update` locks the user's credits row so
-- two concurrent generation requests cannot both read "1 free credit left"
-- and both proceed — the second request blocks until the first commits,
-- then sees 0 and is rejected. Runs as security definer so it can write to
-- `credits` despite clients having no update policy on that table.

create or replace function public.consume_report_credit(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_free int;
  v_paid int;
  v_source text;
begin
  select free_credits, paid_credits into v_free, v_paid
  from public.credits
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'no_credits_row' using errcode = 'P0001';
  end if;

  if v_free > 0 then
    update public.credits set free_credits = free_credits - 1 where user_id = p_user_id;
    v_source := 'free';
  elsif v_paid > 0 then
    update public.credits set paid_credits = paid_credits - 1 where user_id = p_user_id;
    v_source := 'paid';
  else
    raise exception 'insufficient_credits' using errcode = 'P0002';
  end if;

  return v_source;
end;
$$;

revoke all on function public.consume_report_credit(uuid) from public;
grant execute on function public.consume_report_credit(uuid) to authenticated;

-- Refund path for when generation fails after the credit was already debited.
create or replace function public.refund_report_credit(p_user_id uuid, p_source text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_source = 'free' then
    update public.credits set free_credits = free_credits + 1 where user_id = p_user_id;
  elsif p_source = 'paid' then
    update public.credits set paid_credits = paid_credits + 1 where user_id = p_user_id;
  else
    raise exception 'invalid_credit_source' using errcode = 'P0003';
  end if;
end;
$$;

revoke all on function public.refund_report_credit(uuid, text) from public;
grant execute on function public.refund_report_credit(uuid, text) to authenticated;

-- Adds paid credits after a verified Paystack transaction. Called only from
-- the webhook handler using the service role, never directly by clients.
create or replace function public.add_paid_credits(p_user_id uuid, p_credits int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.credits
  set paid_credits = paid_credits + p_credits
  where user_id = p_user_id;

  if not found then
    insert into public.credits (user_id, free_credits, paid_credits)
    values (p_user_id, 0, p_credits);
  end if;
end;
$$;

revoke all on function public.add_paid_credits(uuid, int) from public;
grant execute on function public.add_paid_credits(uuid, int) to service_role;
