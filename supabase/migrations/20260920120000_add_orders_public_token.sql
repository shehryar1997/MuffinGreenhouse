-- ============================================================================
-- Add public_token to orders table for unguessable order status URLs
-- ============================================================================

-- Add public_token column with default random UUID
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS public_token UUID DEFAULT gen_random_uuid();

-- Create unique index for public token lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_public_token ON orders(public_token);

-- Grant select on public_token to authenticated customers (for their own orders)
-- This is automatically covered by the existing RLS policies that filter by customer_id

-- Backfill existing orders with public tokens
UPDATE orders 
SET public_token = gen_random_uuid()
WHERE public_token IS NULL;

-- Add NOT NULL constraint after backfill
ALTER TABLE orders
ALTER COLUMN public_token SET NOT NULL;

-- Create index for faster order lookups by public_token in API routes
CREATE INDEX IF NOT EXISTS idx_orders_public_token_status ON orders(public_token, status);
