-- ============================================================================
-- Customer lock-down, hashed OTP storage and a DB-backed rate limiter
-- ============================================================================
-- 1. OTP / reset codes used to live in plain-text columns on `customers`, which a
--    signed-in customer could read (own-row SELECT policy) -- and the own-row UPDATE
--    policy let them set email_verified = true themselves. Codes now live in
--    `customer_otps` (hashed, service-role only) and customers only get column-level
--    access to the profile fields they legitimately need.
-- 2. `orders.internal_notes` / receipt columns were readable by the order's customer.
-- 3. A cross-instance rate limiter (in-memory limiters don't work on serverless).

-- ---------------------------------------------------------------- OTP table
create table if not exists public.customer_otps (
  customer_id        uuid not null references public.customers(id) on delete cascade,
  purpose            text not null check (purpose in ('verify', 'reset')),
  code_hash          text not null,
  expires_at         timestamptz not null,
  attempts           integer not null default 0,
  last_sent_at       timestamptz not null default now(),
  sends_in_window    integer not null default 1,
  window_started_at  timestamptz not null default now(),
  -- Sign-up for an e-mail that already has a guest-order customer row: the new auth user is
  -- only attached to that row once the e-mail is proven, so nobody can claim someone else's order history.
  pending_auth_id    uuid,
  primary key (customer_id, purpose)
);
alter table public.customer_otps enable row level security;
revoke all on public.customer_otps from anon, authenticated;

alter table public.customers
  drop column if exists otp_code,
  drop column if exists otp_expires_at,
  drop column if exists otp_attempts,
  drop column if exists otp_last_sent_at;

-- ------------------------------------------------- customers: column-level access
revoke all on public.customers from anon, authenticated;
grant select (id, auth_id, email, phone, name, avatar_url, preferred_contact, newsletter_opt_in,
              email_verified, created_at, updated_at, last_login_at)
  on public.customers to authenticated;
grant update (name, phone, avatar_url, preferred_contact, newsletter_opt_in)
  on public.customers to authenticated;

-- ---------------------------------------------------- orders: hide staff-only columns
revoke all on public.orders from anon, authenticated;
grant select (id, order_number, customer_id, status, payment_status, payment_method, delivery_type,
              address_id, subtotal, delivery_fee, discount_amount, total, customer_notes,
              created_at, updated_at, confirmed_at, shipped_at, delivered_at, cancelled_at,
              tracking_number, courier)
  on public.orders to authenticated;

-- ----------------------------------------------------------- rate limiter
create table if not exists public.rate_limit_hits (
  key     text not null,
  hit_at  timestamptz not null default now()
);
create index if not exists rate_limit_hits_key_hit_at_idx on public.rate_limit_hits (key, hit_at);
alter table public.rate_limit_hits enable row level security;
revoke all on public.rate_limit_hits from anon, authenticated;

-- Returns true when the hit is allowed (and records it), false when the key is over its limit.
create or replace function public.rate_limit_hit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  -- Housekeeping: drop old rows now and then (cheap because of the index).
  if random() < 0.02 then
    delete from public.rate_limit_hits where hit_at < now() - interval '1 day';
  end if;

  select count(*) into v_count
  from public.rate_limit_hits
  where key = p_key and hit_at > now() - make_interval(secs => p_window_seconds);

  if v_count >= p_max then
    return false;
  end if;

  insert into public.rate_limit_hits (key) values (p_key);
  return true;
end;
$$;
revoke all on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, integer, integer) to service_role;
