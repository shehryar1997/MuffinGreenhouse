-- E-mail sending stats for the admin panel (/admin/email).
--
-- lib/email/mailer.ts sends every e-mail through Resend or, when Resend's limit is used up, Mailtrap. After each
-- attempt it calls record_email_attempt(), which keeps one row per provider per UTC day. That is about two rows a
-- day, so there is no clean-up job. No e-mail addresses or message text are stored: only counts and the last
-- error message (with any address in it removed by the app before it is sent here).
--
-- Same pattern as rate_limit_hits: row level security on, no access for the public roles, and one function that only
-- the server (service_role) may run.

create table if not exists public.email_usage (
  provider      text        not null check (provider in ('resend', 'mailtrap')),
  day           date        not null,           -- the UTC day (Resend's daily limit is a UTC day; Mailtrap doesn't document its reset time)
  sent          integer     not null default 0, -- e-mails this provider accepted
  failed        integer     not null default 0, -- attempts this provider refused or couldn't complete
  took_over     integer     not null default 0, -- of `sent`: e-mails that went here because the preferred provider couldn't take them
  last_error    text,
  last_error_at timestamptz,
  primary key (provider, day)
);

alter table public.email_usage enable row level security;
revoke all on public.email_usage from anon, authenticated;

create or replace function public.record_email_attempt(
  p_provider  text,
  p_ok        boolean,
  p_took_over boolean default false,
  p_error     text    default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_provider not in ('resend', 'mailtrap') then
    raise exception 'Unknown e-mail provider: %', p_provider;
  end if;

  insert into public.email_usage (provider, day, sent, failed, took_over, last_error, last_error_at)
  values (
    p_provider,
    (now() at time zone 'utc')::date,
    case when p_ok then 1 else 0 end,
    case when p_ok then 0 else 1 end,
    case when p_ok and p_took_over then 1 else 0 end,
    case when p_ok then null else left(p_error, 300) end,
    case when p_ok then null else now() end
  )
  on conflict (provider, day) do update set
    sent          = public.email_usage.sent + excluded.sent,
    failed        = public.email_usage.failed + excluded.failed,
    took_over     = public.email_usage.took_over + excluded.took_over,
    last_error    = coalesce(excluded.last_error, public.email_usage.last_error),
    last_error_at = coalesce(excluded.last_error_at, public.email_usage.last_error_at);
end;
$$;

revoke all on function public.record_email_attempt(text, boolean, boolean, text) from public, anon, authenticated;
grant execute on function public.record_email_attempt(text, boolean, boolean, text) to service_role;
