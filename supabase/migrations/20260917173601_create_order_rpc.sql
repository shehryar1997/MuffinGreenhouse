-- ============================================================================
-- MUFFIN NURSERY - ORDER CREATION RPC
-- Backfill of migration "create_order_rpc" (version 20260917173601), which
-- is already applied on the live database (see supabase_migrations.schema_migrations)
-- but was missing from this local migrations/ folder. File name/version match
-- the live history exactly; definitions below are copied verbatim from the
-- live database via pg_get_functiondef so `supabase db pull`/local resets
-- reproduce the same objects.
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS public.order_number_seq
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    NO MAXVALUE
    NO CYCLE;

CREATE OR REPLACE FUNCTION public.create_order(p_customer_id uuid DEFAULT NULL::uuid, p_customer_email text DEFAULT NULL::text, p_customer_name text DEFAULT NULL::text, p_customer_phone text DEFAULT NULL::text, p_items jsonb DEFAULT '[]'::jsonb, p_delivery_type delivery_type DEFAULT 'delivery'::delivery_type, p_address_id uuid DEFAULT NULL::uuid, p_payment_method payment_method DEFAULT 'bank_transfer'::payment_method, p_delivery_fee numeric DEFAULT 0, p_discount_amount numeric DEFAULT 0, p_customer_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_customer_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_variant_id uuid;
  v_quantity integer;
  v_unit_price numeric;
  v_product_name text;
  v_variant_name text;
  v_product_sku text;
  v_available_stock integer;
  v_subtotal numeric := 0;
  v_order_id uuid;
  v_order_number text;
  v_total numeric;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item';
  end if;

  if p_customer_id is not null then
    v_customer_id := p_customer_id;
  elsif p_customer_email is not null then
    select id into v_customer_id from public.customers where email = lower(p_customer_email);
    if v_customer_id is null then
      insert into public.customers (email, name, phone)
      values (lower(p_customer_email), p_customer_name, p_customer_phone)
      returning id into v_customer_id;
    end if;
  else
    raise exception 'Either p_customer_id or p_customer_email is required';
  end if;

  v_order_number := 'MG' || to_char(now(), 'YYMMDD') || '-' || lpad(nextval('public.order_number_seq')::text, 4, '0');

  -- Pass 1: lock every row involved and validate stock BEFORE writing anything,
  -- so a failure partway through never leaves a half-decremented order.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_variant_id := nullif(v_item->>'variant_id', '')::uuid;
    v_quantity := (v_item->>'quantity')::integer;

    if v_quantity is null or v_quantity < 1 then
      raise exception 'Invalid quantity for product %', v_product_id;
    end if;

    if v_variant_id is not null then
      select stock_count into v_available_stock
      from public.product_variants where id = v_variant_id and product_id = v_product_id
      for update;
      if not found then
        raise exception 'Variant % not found for product %', v_variant_id, v_product_id;
      end if;
    else
      select stock_count into v_available_stock
      from public.products where id = v_product_id
      for update;
      if not found then
        raise exception 'Product % not found', v_product_id;
      end if;
    end if;

    if v_available_stock is null or v_available_stock < v_quantity then
      raise exception 'Insufficient stock for product % (variant %)', v_product_id, v_variant_id;
    end if;
  end loop;

  select coalesce(sum((i->>'quantity')::integer * (
    case when nullif(i->>'variant_id','') is not null
      then (select price from public.product_variants where id = (i->>'variant_id')::uuid)
      else (select price from public.products where id = (i->>'product_id')::uuid)
    end)), 0)
  into v_subtotal
  from jsonb_array_elements(p_items) i;

  v_total := v_subtotal + coalesce(p_delivery_fee,0) - coalesce(p_discount_amount,0);

  insert into public.orders (
    order_number, customer_id, status, payment_status, payment_method,
    delivery_type, address_id, subtotal, delivery_fee, discount_amount, total, customer_notes
  ) values (
    v_order_number, v_customer_id, 'pending', 'pending', p_payment_method,
    p_delivery_type, p_address_id, v_subtotal, coalesce(p_delivery_fee,0), coalesce(p_discount_amount,0), v_total, p_customer_notes
  ) returning id into v_order_id;

  -- Pass 2: write items and decrement stock (locks already held from pass 1).
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_variant_id := nullif(v_item->>'variant_id', '')::uuid;
    v_quantity := (v_item->>'quantity')::integer;

    if v_variant_id is not null then
      select price, name into v_unit_price, v_variant_name from public.product_variants where id = v_variant_id;
      select name, sku into v_product_name, v_product_sku from public.products where id = v_product_id;
      update public.product_variants set stock_count = stock_count - v_quantity where id = v_variant_id;
    else
      select price, name, sku into v_unit_price, v_product_name, v_product_sku from public.products where id = v_product_id;
      v_variant_name := null;
      update public.products set stock_count = stock_count - v_quantity where id = v_product_id;
    end if;

    insert into public.order_items (
      order_id, product_id, variant_id, quantity, unit_price, total_price,
      product_name, variant_name, product_sku
    ) values (
      v_order_id, v_product_id, v_variant_id, v_quantity, v_unit_price, v_unit_price * v_quantity,
      v_product_name, v_variant_name, v_product_sku
    );
  end loop;

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'customer_id', v_customer_id,
    'total', v_total
  );
end;
$function$;
