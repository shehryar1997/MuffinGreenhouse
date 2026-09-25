-- Overseas (Temu-sourced) products. They are ordered from the supplier only after a customer pays, so they take
-- ~14 days to reach the customer instead of shipping in 1-2 business days. See lib/fulfillment.ts.
--
--   products.fulfillment_type   'in_stock' (default) | 'overseas'
--   products.lead_time_days     days from payment to delivery for an overseas product (NULL = default of 14)
--   order_items.fulfillment_type  snapshot at order time, so later product edits don't rewrite history
--   orders.ships_overseas       true when any line is overseas: the whole order ships together, once the item arrives
--   orders.estimated_delivery_date  provisional at order creation; recomputed from the payment date by markPaid

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS fulfillment_type text NOT NULL DEFAULT 'in_stock'
    CHECK (fulfillment_type IN ('in_stock', 'overseas')),
  ADD COLUMN IF NOT EXISTS lead_time_days integer
    CHECK (lead_time_days IS NULL OR (lead_time_days BETWEEN 1 AND 90));

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS fulfillment_type text NOT NULL DEFAULT 'in_stock'
    CHECK (fulfillment_type IN ('in_stock', 'overseas'));

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS ships_overseas boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS estimated_delivery_date date;

-- create_order: identical to 20260922100000_inventory_orders_hardening.sql except that each line snapshots the
-- product's fulfillment_type and the order gets ships_overseas + a provisional estimated_delivery_date.
create or replace function public.create_order(
  p_customer_id uuid default null,
  p_customer_email text default null,
  p_customer_name text default null,
  p_customer_phone text default null,
  p_items jsonb default '[]'::jsonb,
  p_delivery_type delivery_type default 'delivery'::delivery_type,
  p_address_id uuid default null,
  p_payment_method payment_method default 'bank_transfer'::payment_method,
  p_delivery_fee numeric default 0,
  p_discount_amount numeric default 0,
  p_customer_notes text default null,
  p_allow_unpublished boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_customer_id uuid;
  v_item jsonb;
  v_line record;
  v_product_id uuid;
  v_variant_id uuid;
  v_quantity integer;
  v_unit_price numeric;
  v_product_name text;
  v_variant_name text;
  v_product_sku text;
  v_fulfillment text;
  v_lead integer;
  v_max_lead integer := 0;
  v_stock integer;
  v_active boolean;
  v_published_at timestamptz;
  v_has_variants boolean;
  v_subtotal numeric := 0;
  v_discount numeric;
  v_order_id uuid;
  v_public_token uuid;
  v_order_number text;
  v_total numeric;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item';
  end if;
  if coalesce(p_delivery_fee, 0) < 0 then
    raise exception 'Invalid delivery fee';
  end if;
  if coalesce(p_discount_amount, 0) < 0 then
    raise exception 'Invalid discount';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity is null or v_quantity < 1 or v_quantity > 99 then
      raise exception 'Invalid quantity for product %', v_item->>'product_id';
    end if;
  end loop;

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

  -- Pass 1: lock every row involved and validate BEFORE writing anything. Lines for the same size are merged
  -- first, so two lines of 3 against a stock of 5 fail cleanly instead of breaking the stock >= 0 constraint.
  for v_line in
    select (e->>'product_id')::uuid as product_id,
           nullif(e->>'variant_id', '')::uuid as variant_id,
           sum((e->>'quantity')::integer)::integer as quantity
      from jsonb_array_elements(p_items) e
     group by 1, 2
     order by 1, 2
  loop
    select published_at into v_published_at from public.products where id = v_line.product_id;
    if not found then
      raise exception 'Product % not found', v_line.product_id;
    end if;
    if not p_allow_unpublished and (v_published_at is null or v_published_at > now()) then
      raise exception 'Product % is no longer available', v_line.product_id;
    end if;

    if v_line.variant_id is not null then
      select stock_count, is_active into v_stock, v_active
        from public.product_variants
       where id = v_line.variant_id and product_id = v_line.product_id
         for update;
      if not found then
        raise exception 'Variant % not found for product %', v_line.variant_id, v_line.product_id;
      end if;
      if v_active is false then
        raise exception 'Variant % is no longer available', v_line.variant_id;
      end if;
    else
      select exists (select 1 from public.product_variants where product_id = v_line.product_id and is_active is not false)
        into v_has_variants;
      if v_has_variants then
        raise exception 'A size must be chosen for product % (not available without a size)', v_line.product_id;
      end if;
      select stock_count into v_stock from public.products where id = v_line.product_id for update;
    end if;

    if v_stock is null or v_stock < v_line.quantity then
      raise exception 'Insufficient stock for product % (variant %)', v_line.product_id, v_line.variant_id;
    end if;
  end loop;

  select coalesce(sum((i->>'quantity')::integer * (
    case when nullif(i->>'variant_id', '') is not null
      then (select price from public.product_variants where id = (i->>'variant_id')::uuid)
      else (select price from public.products where id = (i->>'product_id')::uuid)
    end)), 0)
    into v_subtotal
    from jsonb_array_elements(p_items) i;

  v_discount := least(coalesce(p_discount_amount, 0), v_subtotal);
  v_total := v_subtotal + coalesce(p_delivery_fee, 0) - v_discount;
  v_order_number := 'MG' || to_char(now(), 'YYMMDD') || '-' || lpad(nextval('public.order_number_seq')::text, 4, '0');

  insert into public.orders (
    order_number, customer_id, status, payment_status, payment_method,
    delivery_type, address_id, subtotal, delivery_fee, discount_amount, total, customer_notes
  ) values (
    v_order_number, v_customer_id, 'pending', 'pending', p_payment_method,
    p_delivery_type, p_address_id, v_subtotal, coalesce(p_delivery_fee, 0), v_discount, v_total, p_customer_notes
  ) returning id, public_token into v_order_id, v_public_token;

  insert into public.order_events (order_id, event_type, to_value, note, actor)
  values (v_order_id, 'created', 'pending',
          case when p_allow_unpublished then 'Recorded by staff' else 'Placed on the website' end,
          case when p_allow_unpublished then 'staff' else 'customer' end);

  -- Pass 2: write items and decrement stock (locks already held). The stock trigger logs each change as a sale.
  perform set_config('app.stock_reason', 'sale', true);
  perform set_config('app.stock_ref', v_order_id::text, true);
  perform set_config('app.stock_note', 'Order ' || v_order_number, true);

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_variant_id := nullif(v_item->>'variant_id', '')::uuid;
    v_quantity := (v_item->>'quantity')::integer;

    if v_variant_id is not null then
      select price, name into v_unit_price, v_variant_name from public.product_variants where id = v_variant_id;
      select name, sku, fulfillment_type, lead_time_days into v_product_name, v_product_sku, v_fulfillment, v_lead
        from public.products where id = v_product_id;
      update public.product_variants set stock_count = stock_count - v_quantity where id = v_variant_id;
    else
      select price, name, sku, fulfillment_type, lead_time_days
        into v_unit_price, v_product_name, v_product_sku, v_fulfillment, v_lead
        from public.products where id = v_product_id;
      v_variant_name := null;
      update public.products set stock_count = stock_count - v_quantity where id = v_product_id;
    end if;

    if v_fulfillment = 'overseas' then
      v_max_lead := greatest(v_max_lead, coalesce(v_lead, 14));
    end if;

    insert into public.order_items (
      order_id, product_id, variant_id, quantity, unit_price, total_price,
      product_name, variant_name, product_sku, fulfillment_type
    ) values (
      v_order_id, v_product_id, v_variant_id, v_quantity, v_unit_price, v_unit_price * v_quantity,
      v_product_name, v_variant_name, v_product_sku, coalesce(v_fulfillment, 'in_stock')
    );
  end loop;

  perform set_config('app.stock_reason', '', true);
  perform set_config('app.stock_ref', '', true);
  perform set_config('app.stock_note', '', true);

  -- Whole order ships together, so the slowest overseas line sets the date. Provisional: markPaid recomputes it
  -- from the payment date, because the supplier order is only placed once the customer has paid.
  if v_max_lead > 0 then
    update public.orders
       set ships_overseas = true,
           estimated_delivery_date = (now() at time zone 'Asia/Karachi')::date + v_max_lead
     where id = v_order_id;
  end if;

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'public_token', v_public_token,
    'customer_id', v_customer_id,
    'total', v_total
  );
end;
$$;

-- create_order is service_role only; re-assert the grants since CREATE OR REPLACE keeps them but be explicit.
revoke all on function public.create_order(uuid, text, text, text, jsonb, delivery_type, uuid, payment_method, numeric, numeric, text, boolean) from public, anon, authenticated;
grant execute on function public.create_order(uuid, text, text, text, jsonb, delivery_type, uuid, payment_method, numeric, numeric, text, boolean) to service_role;
