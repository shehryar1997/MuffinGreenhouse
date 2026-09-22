-- search_products: the thumbnail is the card variant's photo (else the cheapest active variant that has one), the
-- same rule the storefront uses. Every photo now belongs to a variant and each is flagged primary, so the old
-- "is_primary = true LIMIT 1" would have picked an arbitrary variant. A legacy product with no variant photo
-- still falls back to its old general photo. Same signature as before, so callers are unchanged.
create or replace function public.search_products(
  p_search_query text default null,
  p_category_slug text default null,
  p_use_case_slugs text[] default null,
  p_light_levels light_requirement[] default null,
  p_difficulties difficulty_level[] default null,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_is_pet_safe boolean default null,
  p_is_new_arrival boolean default null,
  p_sort_by text default 'name',
  p_page_size integer default 24,
  p_page_offset integer default 0
)
returns table(
  id uuid, sku text, name text, slug text, price numeric, stock_status stock_status,
  stock_count integer, primary_image text, category_name text, total_count bigint
)
language plpgsql
set search_path = public, pg_temp
as $function$
DECLARE
    v_use_case_names text[];
BEGIN
    IF p_use_case_slugs IS NOT NULL THEN
        SELECT array_agg(uct.name) INTO v_use_case_names FROM use_case_tags uct WHERE uct.slug = ANY(p_use_case_slugs);
    END IF;

    RETURN QUERY
    WITH filtered_products AS (
        SELECT
            p.id, p.sku, p.name, p.slug, p.price, p.stock_status, p.stock_count,
            COALESCE(
                (SELECT pi.url
                   FROM product_images pi
                   JOIN product_variants pv ON pv.id = pi.variant_id
                  WHERE pi.product_id = p.id AND pv.is_active IS NOT FALSE
                  ORDER BY (pi.variant_id = p.card_variant_id) DESC NULLS LAST, pv.price ASC, pi.sort_order ASC
                  LIMIT 1),
                (SELECT pi.url FROM product_images pi
                  WHERE pi.product_id = p.id AND pi.variant_id IS NULL
                  ORDER BY pi.is_primary DESC, pi.sort_order ASC
                  LIMIT 1)
            ) as img,
            p.category_name as cat_name,
            CASE
                WHEN p_search_query IS NOT NULL AND p_search_query != '' THEN
                    ts_rank(p.search_vector, plainto_tsquery('english', p_search_query))
                ELSE 0
            END as relevance
        FROM products p
        WHERE
            p.published_at IS NOT NULL
            AND (p_search_query IS NULL OR p_search_query = '' OR p.search_vector @@ plainto_tsquery('english', p_search_query))
            AND (p_category_slug IS NULL OR p.category_slug = p_category_slug)
            AND (v_use_case_names IS NULL OR p.use_case_tags && v_use_case_names)
            AND (p_light_levels IS NULL OR p.light_requirement = ANY(p_light_levels))
            AND (p_difficulties IS NULL OR p.difficulty = ANY(p_difficulties))
            AND (p_min_price IS NULL OR p.price >= p_min_price)
            AND (p_max_price IS NULL OR p.price <= p_max_price)
            AND (p_is_pet_safe IS NULL OR p.is_pet_safe = p_is_pet_safe)
            AND (p_is_new_arrival IS NULL OR p.is_new_arrival = p_is_new_arrival)
    )
    SELECT
        fp.id, fp.sku, fp.name, fp.slug, fp.price, fp.stock_status, fp.stock_count, fp.img, fp.cat_name,
        COUNT(*) OVER() as total_count
    FROM filtered_products fp
    ORDER BY
        CASE p_sort_by WHEN 'relevance' THEN fp.relevance END DESC NULLS LAST,
        CASE p_sort_by WHEN 'price_asc' THEN fp.price END ASC NULLS LAST,
        CASE p_sort_by WHEN 'price_desc' THEN fp.price END DESC NULLS LAST,
        CASE p_sort_by WHEN 'name' THEN fp.name END ASC NULLS LAST,
        fp.name ASC
    LIMIT p_page_size OFFSET p_page_offset;
END;
$function$;
