-- ============================================================================
-- MUFFIN NURSERY - CUSTOMER AUTHENTICATION & RLS POLICIES
-- Part 10: Phone verification fields and customer RLS policies
-- ============================================================================

-- ============================================================================
-- ALTER CUSTOMERS TABLE: Add phone verification fields
-- ============================================================================
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS otp_code TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS otp_attempts INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS otp_last_sent_at TIMESTAMPTZ;

-- Add comment for developers
COMMENT ON COLUMN customers.email_verified IS 'Whether email address has been verified via OTP';
COMMENT ON COLUMN customers.otp_code IS 'Current OTP code for email verification';
COMMENT ON COLUMN customers.otp_expires_at IS 'Timestamp when current OTP expires';
COMMENT ON COLUMN customers.otp_attempts IS 'Number of consecutive failed OTP attempts';
COMMENT ON COLUMN customers.otp_last_sent_at IS 'Timestamp of last OTP sent (rate limiting)';

-- ============================================================================
-- RLS POLICIES: CUSTOMERS
-- Customers can SELECT/UPDATE their own row where auth.uid() = auth_id
-- ============================================================================

-- Policy: Users can view their own customer record
DROP POLICY IF EXISTS "Users can view own customer record" ON customers;
CREATE POLICY "Users can view own customer record"
  ON customers
  FOR SELECT
  TO authenticated
  USING (auth_id = auth.uid());

-- Policy: Users can update their own customer record
DROP POLICY IF EXISTS "Users can update own customer record" ON customers;
CREATE POLICY "Users can update own customer record"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- ============================================================================
-- RLS POLICIES: ADDRESSES
-- Customers can SELECT/INSERT/UPDATE/DELETE rows where customer_id is in
-- (SELECT id FROM customers WHERE auth_id = auth.uid())
-- ============================================================================

-- Policy: Users can view their own addresses
DROP POLICY IF EXISTS "Users can view own addresses" ON addresses;
CREATE POLICY "Users can view own addresses"
  ON addresses
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_id = auth.uid()
    )
  );

-- Policy: Users can insert addresses for themselves
DROP POLICY IF EXISTS "Users can insert own addresses" ON addresses;
CREATE POLICY "Users can insert own addresses"
  ON addresses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id IN (
      SELECT id FROM customers WHERE auth_id = auth.uid()
    )
  );

-- Policy: Users can update their own addresses
DROP POLICY IF EXISTS "Users can update own addresses" ON addresses;
CREATE POLICY "Users can update own addresses"
  ON addresses
  FOR UPDATE
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_id = auth.uid()
    )
  )
  WITH CHECK (
    customer_id IN (
      SELECT id FROM customers WHERE auth_id = auth.uid()
    )
  );

-- Policy: Users can delete their own addresses
DROP POLICY IF EXISTS "Users can delete own addresses" ON addresses;
CREATE POLICY "Users can delete own addresses"
  ON addresses
  FOR DELETE
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: ORDERS (read-only for customer)
-- Customers can SELECT their own orders via customer_id ownership pattern
-- ============================================================================

-- Policy: Users can view their own orders
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: ORDER_ITEMS (read-only for customer)
-- Customers can SELECT order items belonging to their orders
-- ============================================================================

-- Policy: Users can view order items for their own orders
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT o.id FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE c.auth_id = auth.uid()
    )
  );
