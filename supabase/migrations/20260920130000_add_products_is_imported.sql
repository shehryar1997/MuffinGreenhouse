-- Marks a plant as imported; shown as an "Imported" tag on the product page.
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_imported BOOLEAN NOT NULL DEFAULT false;
