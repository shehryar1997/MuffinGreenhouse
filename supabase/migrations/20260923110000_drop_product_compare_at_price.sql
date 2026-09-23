-- The "was" price now lives only on variants (product_variants.compare_at_price). products.price and
-- products.stock_count stay as values derived from the variants (lowest price / total stock).
ALTER TABLE products DROP COLUMN IF EXISTS compare_at_price;
