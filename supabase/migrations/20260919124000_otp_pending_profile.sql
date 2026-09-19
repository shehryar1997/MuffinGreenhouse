-- Sign-up details held until the e-mail is proven (used when the e-mail already belongs to a guest-order customer row).
alter table public.customer_otps add column if not exists pending_profile jsonb;
