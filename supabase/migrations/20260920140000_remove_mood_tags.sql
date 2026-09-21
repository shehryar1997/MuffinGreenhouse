-- Removes the Soft / Bright / Moody "mood" tags everywhere: the mood_tags lookup table,
-- products.mood_tags, and the mood parts of validate_product_tags() and search_products().
--
-- Apply AFTER the matching site code is deployed. The previous code still passes
-- p_mood_slugs to search_products() and writes products.mood_tags, and would fail
-- against this schema.

-- 0. The tag trigger is declared "UPDATE OF use_case_tags, mood_tags", so the mood_tags column
--    can't be dropped while it exists. Recreate it on use_case_tags only.
drop trigger if exists trg_validate_product_tags on public.products;

-- 1. Tag validation: keep the use-case check only.
create or replace function public.validate_product_tags()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
declare
  bad_use_case text;
begin
  select t into bad_use_case
  from unnest(NEW.use_case_tags) t
  where t not in (select name from use_case_tags)
  limit 1;

  if bad_use_case is not null then
    raise exception 'Unknown use case tag "%". Valid tags: %',
      bad_use_case,
      (select string_agg(name, ', ' order by name) from use_case_tags);
  end if;

  return NEW;
end;
$function$;

-- 2. Search: drop the p_mood_slugs parameter (signature changes, so drop and recreate).
drop function if exists public.search_products(
  text, text, text[], text[], light_requirement[], difficulty_level[],
  numeric, numeric, boolean, boolean, text, integer, integer
);

create function public.search_products(
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
            (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as img,
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

-- 3. The data and structure themselves.
alter table public.products drop column if exists mood_tags;
drop table if exists public.mood_tags;

-- 4. Re-attach the validation trigger, now watching use_case_tags only.
create trigger trg_validate_product_tags
  before insert or update of use_case_tags on public.products
  for each row execute function public.validate_product_tags();
