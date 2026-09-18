-- ============================================================================
-- MUFFIN NURSERY - ORDER SHIPMENT TRACKING
-- Adds columns to record courier tracking info when an order is marked
-- shipped from the admin panel.
-- ============================================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS courier text;
