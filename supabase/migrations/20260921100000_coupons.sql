-- Discount coupons managed from the admin panel and applied at checkout.
-- Only the service role reads/writes this table (RLS on, no policies).
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  discount_percent numeric(5,2) NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  max_discount numeric(10,2) CHECK (max_discount IS NULL OR max_discount > 0),
  max_uses integer CHECK (max_uses IS NULL OR max_uses > 0),
  times_used integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Re-runnable: bring an older copy of the table up to date.
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS max_uses integer CHECK (max_uses IS NULL OR max_uses > 0);
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS times_used integer NOT NULL DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS expires_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS coupons_code_key ON public.coupons (upper(code));

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code text;

-- Atomically claims one use of a coupon. Returns false when it is inactive, expired or used up.
CREATE OR REPLACE FUNCTION public.redeem_coupon(p_code text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH claimed AS (
    UPDATE public.coupons
    SET times_used = times_used + 1
    WHERE code = upper(p_code)
      AND is_active
      AND (expires_at IS NULL OR expires_at > now())
      AND (max_uses IS NULL OR times_used < max_uses)
    RETURNING 1
  )
  SELECT EXISTS (SELECT 1 FROM claimed);
$$;

-- Gives a use back when the order that claimed it could not be created.
CREATE OR REPLACE FUNCTION public.release_coupon(p_code text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.coupons SET times_used = greatest(times_used - 1, 0) WHERE code = upper(p_code);
$$;

REVOKE ALL ON FUNCTION public.redeem_coupon(text), public.release_coupon(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_coupon(text), public.release_coupon(text) TO service_role;
