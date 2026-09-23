-- Sizes are variants now (product_variants.name); the product-level small/medium/large was never shown or filtered on.
ALTER TABLE products DROP COLUMN IF EXISTS size;
DROP TYPE IF EXISTS plant_size;
