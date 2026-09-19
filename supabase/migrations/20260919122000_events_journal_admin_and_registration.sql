-- ============================================================================
-- Events + Journal become real, admin-managed content
-- ============================================================================
-- Both were hard-coded mock data. This adds what the admin panel needs:
--   events:  draft/published/cancelled status, "what to expect" bullets, per-booking cap
--   event_registrations: reference code, amount due, payment tracking, attendance, notes
--   register_for_event(): the ONLY way a registration is created (atomic capacity check)
--   journal_posts: featured flag
-- Registration policy (decided with the owner's UX goals in mind):
--   * free events confirm instantly; paid events hold the spot for 24h until payment is
--     marked received (same 24h hold as shop orders), then the spot is released
--   * max spots per booking is set per event, one live booking per phone number per event
--   * registration closes when the event starts

-- ------------------------------------------------------------------ events
alter table public.events
  add column if not exists status text not null default 'draft'
    check (status in ('draft', 'published', 'cancelled')),
  add column if not exists what_to_expect text[] not null default '{}',
  add column if not exists max_spots_per_booking integer not null default 4
    check (max_spots_per_booking between 1 and 20);

alter table public.events alter column price set not null;
alter table public.events add constraint events_price_nonneg check (price >= 0) not valid;

drop policy if exists events_read on public.events;
create policy events_read on public.events
  for select to anon, authenticated
  using (status in ('published', 'cancelled'));

-- ----------------------------------------------------- event_registrations
alter table public.event_registrations
  add column if not exists reference text,
  add column if not exists amount_due numeric(10,2) not null default 0,
  add column if not exists payment_method text,
  add column if not exists payment_reference text,
  add column if not exists paid_at timestamptz,
  add column if not exists attended boolean not null default false,
  add column if not exists admin_notes text,
  add column if not exists cancel_reason text;

alter table public.event_registrations
  alter column guest_name set not null,
  alter column guest_phone set not null,
  alter column spots_reserved set not null,
  alter column payment_status set not null;

create unique index if not exists event_registrations_reference_key
  on public.event_registrations (reference);
create index if not exists event_registrations_event_idx
  on public.event_registrations (event_id, created_at desc);
alter table public.event_registrations
  add constraint event_registrations_spots_range check (spots_reserved between 1 and 20) not valid;

-- Anyone-can-insert was an open door (amount_paid / payment_status could be set to anything).
drop policy if exists "Public can register for events" on public.event_registrations;
revoke all on public.event_registrations from anon, authenticated;
grant select (id, event_id, customer_id, guest_name, guest_email, guest_phone, spots_reserved,
              amount_due, amount_paid, payment_status, payment_method, paid_at, attended,
              reference, created_at, cancelled_at)
  on public.event_registrations to authenticated;

revoke all on public.events from anon, authenticated;
grant select on public.events to anon, authenticated;

-- ---- spots_remaining is always derived from live registrations (replaces the two old triggers)
drop trigger if exists event_reg_insert on public.event_registrations;
drop trigger if exists event_reg_cancel on public.event_registrations;
drop function if exists public.decrement_event_spots();
drop function if exists public.increment_event_spots();

create or replace function public.sync_event_spots()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event uuid := coalesce(new.event_id, old.event_id);
begin
  update public.events e
     set spots_remaining = greatest(0, e.spots_total - coalesce((
           select sum(r.spots_reserved) from public.event_registrations r
           where r.event_id = v_event and r.cancelled_at is null), 0))
   where e.id = v_event;
  return null;
end;
$$;

create trigger event_reg_sync_spots
  after insert or update or delete on public.event_registrations
  for each row execute function public.sync_event_spots();

-- Changing an event's total capacity re-derives what is left.
create or replace function public.events_set_spots()
returns trigger
language plpgsql
as $$
begin
  new.spots_remaining := greatest(0, new.spots_total - coalesce((
    select sum(r.spots_reserved) from public.event_registrations r
    where r.event_id = new.id and r.cancelled_at is null), 0));
  return new;
end;
$$;

create trigger events_set_spots_trg
  before insert or update of spots_total on public.events
  for each row execute function public.events_set_spots();

-- ------------------------------------------------------------ registration
create or replace function public.register_for_event(
  p_event_id    uuid,
  p_name        text,
  p_phone       text,
  p_email       text,
  p_spots       integer,
  p_customer_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event   public.events%rowtype;
  v_phone   text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_amount  numeric(10,2);
  v_ref     text;
  v_id      uuid;
  v_tries   integer := 0;
begin
  select * into v_event from public.events where id = p_event_id for update;
  if not found or v_event.status <> 'published' then
    raise exception 'EVENT_NOT_FOUND';
  end if;
  if v_event.datetime <= now() then
    raise exception 'REGISTRATION_CLOSED';
  end if;
  if p_spots is null or p_spots < 1 or p_spots > v_event.max_spots_per_booking then
    raise exception 'INVALID_SPOTS';
  end if;
  if length(trim(coalesce(p_name, ''))) < 2 or length(v_phone) < 10 then
    raise exception 'INVALID_CONTACT';
  end if;

  if exists (
    select 1 from public.event_registrations r
    where r.event_id = p_event_id and r.cancelled_at is null
      and regexp_replace(r.guest_phone, '\D', '', 'g') = v_phone
  ) then
    raise exception 'ALREADY_REGISTERED';
  end if;

  if v_event.spots_remaining < p_spots then
    raise exception 'NOT_ENOUGH_SPOTS';
  end if;

  v_amount := v_event.price * p_spots;

  loop
    v_ref := 'EV-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    begin
      insert into public.event_registrations
        (event_id, customer_id, guest_name, guest_email, guest_phone, spots_reserved,
         amount_due, amount_paid, payment_status, reference)
      values
        (p_event_id, p_customer_id, trim(p_name), nullif(lower(trim(coalesce(p_email, ''))), ''), trim(p_phone), p_spots,
         v_amount, 0, case when v_amount = 0 then 'paid'::payment_status else 'pending'::payment_status end, v_ref)
      returning id into v_id;
      exit;
    exception when unique_violation then
      v_tries := v_tries + 1;
      if v_tries > 5 then raise; end if;
    end;
  end loop;

  return jsonb_build_object('id', v_id, 'reference', v_ref, 'amount_due', v_amount,
                            'spots', p_spots, 'free', v_amount = 0);
end;
$$;

-- Paid-event bookings that stay unpaid for p_hours release their spots.
create or replace function public.expire_pending_event_registrations(p_hours integer default 24)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.event_registrations
     set cancelled_at = now(), cancel_reason = 'payment_expired'
   where cancelled_at is null
     and payment_status = 'pending'
     and amount_due > 0
     and created_at < now() - make_interval(hours => p_hours);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.register_for_event(uuid, text, text, text, integer, uuid) from public, anon, authenticated;
revoke all on function public.expire_pending_event_registrations(integer) from public, anon, authenticated;
revoke all on function public.sync_event_spots() from public, anon, authenticated;
grant execute on function public.register_for_event(uuid, text, text, text, integer, uuid) to service_role;
grant execute on function public.expire_pending_event_registrations(integer) to service_role;

-- ------------------------------------------------------------------ journal
alter table public.journal_posts
  add column if not exists is_featured boolean not null default false;

revoke all on public.journal_posts from anon, authenticated;
grant select on public.journal_posts to anon, authenticated;

-- ------------------------------------------------------------ hourly sweep
select cron.schedule(
  'release-unpaid-holds',
  '0 * * * *',
  $cron$
    select public.expire_pending_orders(24);
    select public.expire_pending_event_registrations(24);
  $cron$
);
