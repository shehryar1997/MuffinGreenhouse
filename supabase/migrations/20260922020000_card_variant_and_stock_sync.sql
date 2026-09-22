-- 1. Which variant's photo the shop card shows. NULL = the storefront picks the cheapest variant that has a photo.
--    Deliberately NOT a foreign key: a second products <-> product_variants relationship makes PostgREST refuse the
--    shop's `variants:product_variants(...)` embed (PGRST201, "more than one relationship"). The admin save rewrites
--    this column every time, and the storefront ignores an id that is no longer one of the product's variants.
alter table products add column card_variant_id uuid;

-- 2. Every product now has at least one variant, and orders only decrement the variant's stock, so the
--    product-level stock_count (which drives the Out of stock badge and Add to Cart) must follow the variants.
--    It is the sum over active variants; the existing products_auto_stock_status trigger then refreshes stock_status.
create or replace function public.sync_product_stock_from_variants()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_product_id uuid := coalesce(new.product_id, old.product_id);
  v_count integer;
  v_total integer;
begin
  select count(*), coalesce(sum(stock_count), 0)
    into v_count, v_total
    from product_variants
   where product_id = v_product_id and is_active is not false;

  if v_count > 0 then
    update products set stock_count = v_total
     where id = v_product_id and stock_count is distinct from v_total;
  end if;

  return coalesce(new, old);
end;
$function$;

create trigger trg_sync_product_stock_from_variants
  after insert or delete or update of stock_count, is_active on product_variants
  for each row execute function public.sync_product_stock_from_variants();

-- One-time catch-up for products that already have variants.
update products p
   set stock_count = s.total
  from (
    select product_id, coalesce(sum(stock_count), 0) as total
      from product_variants
     where is_active is not false
     group by product_id
  ) s
 where s.product_id = p.id and p.stock_count is distinct from s.total;
