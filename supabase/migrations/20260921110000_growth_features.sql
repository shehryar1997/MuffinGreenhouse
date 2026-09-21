-- Growth features: fixed-amount / customer-owned coupons, referrals, newsletter welcome coupon,
-- back-in-stock requests, product reviews and payment reminders.
-- Every new table is service-role only (RLS on, no policies): all access goes through server code.
-- Run AFTER 20260921100000_coupons.sql.

-- ---------------------------------------------------------------- coupons: fixed amounts + owners
ALTER TABLE public.coupons ALTER COLUMN discount_percent DROP NOT NULL;
ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_discount_percent_check;
ALTER TABLE public.coupons ADD CONSTRAINT coupons_discount_percent_check
  CHECK (discount_percent IS NULL OR (discount_percent > 0 AND discount_percent <= 100));
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS fixed_amount numeric(10,2) CHECK (fixed_amount IS NULL OR fixed_amount > 0);
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS owner_email text;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'standard'
  CHECK (kind IN ('standard', 'welcome', 'referral_reward'));
ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_one_discount_type;
ALTER TABLE public.coupons ADD CONSTRAINT coupons_one_discount_type CHECK ((discount_percent IS NULL) <> (fixed_amount IS NULL));

-- ---------------------------------------------------------------- referrals
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS referral_code text;
CREATE UNIQUE INDEX IF NOT EXISTS customers_referral_code_key ON public.customers (referral_code) WHERE referral_code IS NOT NULL;

-- "Refer by e-mail": the referrer names a friend; when that friend's first qualifying order is paid, the referrer is rewarded.
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  referred_email text NOT NULL,
  rewarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS referrals_referrer_email_key ON public.referrals (referrer_id, lower(referred_email));
CREATE INDEX IF NOT EXISTS referrals_email_idx ON public.referrals (lower(referred_email));
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- One reward per order at most (the unique order_id is what makes re-marking an order paid harmless).
CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  referrer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('code', 'email')),
  coupon_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------- newsletter + welcome coupon
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  welcome_coupon_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_key ON public.newsletter_subscribers (lower(email));
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------- back-in-stock requests
CREATE TABLE IF NOT EXISTS public.stock_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  email text NOT NULL,
  whatsapp text NOT NULL,
  notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- No duplicates: one request per person per plant.
CREATE UNIQUE INDEX IF NOT EXISTS stock_notifications_product_email_key ON public.stock_notifications (product_id, lower(email));
CREATE INDEX IF NOT EXISTS stock_notifications_email_idx ON public.stock_notifications (lower(email));
ALTER TABLE public.stock_notifications ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------- reviews
-- A `reviews` table already exists (from 003_orders_tables.sql, never used by the app), so extend it
-- instead of creating a new one. The old columns (title, text, is_approved, ...) are left alone.
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS order_item_id uuid REFERENCES public.order_items(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS body text;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS display_name text;   -- NULL = the customer chose to stay anonymous
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;
-- One review per order line (NULLs, i.e. any old rows, are not affected).
CREATE UNIQUE INDEX IF NOT EXISTS reviews_order_item_key ON public.reviews (order_item_id);
CREATE INDEX IF NOT EXISTS reviews_product_idx ON public.reviews (product_id) WHERE NOT is_hidden;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------- payment reminders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_reminder_sent_at timestamptz;
