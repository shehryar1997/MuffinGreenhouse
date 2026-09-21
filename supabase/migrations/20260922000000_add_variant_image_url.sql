-- Optional photo per product variant. When a shopper picks the variant on the product page,
-- this image replaces the main photo.
ALTER TABLE product_variants
ADD COLUMN IF NOT EXISTS image_url TEXT;
