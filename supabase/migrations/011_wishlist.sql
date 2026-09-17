-- ============================================================================
-- MUFFIN NURSERY - WISHLIST
-- Part 11: wishlist_items table + RLS
-- ============================================================================

CREATE TABLE IF NOT EXISTS wishlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (customer_id, product_id)
);

ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wishlist" ON wishlist_items;
CREATE POLICY "Users can view own wishlist"
  ON wishlist_items FOR SELECT TO authenticated
  USING (customer_id IN (SELECT id FROM customers WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "Users can add to own wishlist" ON wishlist_items;
CREATE POLICY "Users can add to own wishlist"
  ON wishlist_items FOR INSERT TO authenticated
  WITH CHECK (customer_id IN (SELECT id FROM customers WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "Users can remove from own wishlist" ON wishlist_items;
CREATE POLICY "Users can remove from own wishlist"
  ON wishlist_items FOR DELETE TO authenticated
  USING (customer_id IN (SELECT id FROM customers WHERE auth_id = auth.uid()));
