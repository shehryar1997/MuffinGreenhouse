-- Ties a product photo to one variant.
-- variant_id NULL means a general photo that applies to every variant. A set variant_id means the
-- photo only applies while that variant is selected on the product page. Existing photos stay general.
alter table product_images add column variant_id uuid references product_variants(id) on delete set null;
create index idx_product_images_variant_id on product_images(variant_id) where variant_id is not null;
