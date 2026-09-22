-- Pre-inventory hardening (audit of 2026-09-22). One migration, safe to re-run.
--
--  1. One stock rule for products AND variants (low when 0 < stock <= threshold), default threshold 3.
--     A variant's stock_status is now recomputed by the database on every write, so a size that sells
--     out through orders, or comes back through a cancellation, always shows the right status.
--  2. Per-variant compare-at price, weight and box size; product price kept at the lowest variant price.
--  3. Stock history: every variant stock change is written to inventory_log with a reason.
--  4. Order timeline: order_events records status / payment / tracking changes.
--  5. create_order: refuses unpublished products and retired sizes, merges duplicate lines before the
--     stock check, rejects negative fees, caps the discount at the subtotal, returns public_token.
--  6. Storefront cache webhook reads its URL and secret from Supabase Vault (never from this file),
--     and fires once per statement for variants instead of once per row.
--  7. Search tolerates misspellings (pg_trgm) and also matches category and use-case tags;
--     sold-out products sort last. products.is_sold_out + products.sort_position for shop ordering.
--  8. Categories get editable copy (tagline, buying-guide intro, SEO title/description); renaming a
--     category updates its products.
--  9. Advisor fixes: RLS auth.uid() init-plan, foreign-key indexes, duplicate indexes, a primary key on
--     rate_limit_hits, EXECUTE revoked on trigger functions. Leftover columns dropped.

-- ---------------------------------------------------------------------------
-- 1. Stock rule
-- ---------------------------------------------------------------------------
create or replace function public.stock_status_for(p_count integer, p_threshold integer)
returns public.stock_status
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when coalesce(p_count, 0) <= 0 then 'out_of_stock'::public.stock_status
    when coalesce(p_count, 0) <= greatest(coalesce(p_threshold, 0), 0) then 'low_stock'::public.stock_status
    else 'in_stock'::public.stock_status
  end
$$;

create or replace function public.auto_stock_status()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.stock_status := public.stock_status_for(new.stock_count, new.low_stock_threshold);
  return new;
end;
$$;

alter table public.products alter column low_stock_threshold set default 3;

create or replace function public.variant_stock_status()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_threshold integer;
begin
  if new.is_active is false then
    new.stock_status := 'out_of_stock';
    return new;
  end if;
  select low_stock_threshold into v_threshold from public.products where id = new.product_id;
  new.stock_status := public.stock_status_for(new.stock_count, coalesce(v_threshold, 3));
  return new;
end;
$$;

drop trigger if exists trg_variant_stock_status on public.product_variants;
create trigger trg_variant_stock_status
  before insert or update on public.product_variants
  for each row execute function public.variant_stock_status();

-- Changing a product's low-stock level re-grades its sizes.
create or replace function public.product_threshold_changed()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  update public.product_variants
     set stock_status = public.stock_status_for(stock_count, new.low_stock_threshold)
   where product_id = new.id and is_active is not false;
  return null;
end;
$$;

drop trigger if exists trg_product_threshold_changed on public.products;
create trigger trg_product_threshold_changed
  after update of low_stock_threshold on public.products
  for each row when (old.low_stock_threshold is distinct from new.low_stock_threshold)
  execute function public.product_threshold_changed();

-- ---------------------------------------------------------------------------
-- 2. Per-variant pricing and parcel size; product mirrors its variants
-- ---------------------------------------------------------------------------
alter table public.product_variants
  add column if not exists compare_at_price numeric,
  add column if not exists weight_kg numeric,
  add column if not exists box_height_cm numeric,
  add column if not exists box_width_cm numeric,
  add column if not exists box_breadth_cm numeric;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'product_variants_parcel_check') then
    alter table public.product_variants add constraint product_variants_parcel_check check (
      (compare_at_price is null or compare_at_price >= 0)
      and (weight_kg is null or weight_kg >= 0)
      and (box_height_cm is null or box_height_cm > 0)
      and (box_width_cm is null or box_width_cm > 0)
      and (box_breadth_cm is null or box_breadth_cm > 0)
    );
  end if;
end $$;

-- Stock = total of active sizes, price = cheapest active size. A product whose sizes are all retired has 0 stock.
create or replace function public.sync_product_stock_from_variants()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_product_id uuid := coalesce(new.product_id, old.product_id);
  v_all integer;
  v_total integer;
  v_min_price numeric;
begin
  select count(*),
         coalesce(sum(stock_count) filter (where is_active is not false), 0),
         min(price) filter (where is_active is not false)
    into v_all, v_total, v_min_price
    from public.product_variants
   where product_id = v_product_id;

  if v_all > 0 then
    update public.products
       set stock_count = v_total,
           price = coalesce(v_min_price, price)
     where id = v_product_id
       and (stock_count is distinct from v_total or (v_min_price is not null and price is distinct from v_min_price));
  end if;

  return coalesce(new, old);
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Stock history
-- ---------------------------------------------------------------------------
-- History belongs to the product: it goes when the product is deleted (products in orders can't be deleted),
-- and it must not stop a never-ordered draft from being deleted.
alter table public.inventory_log drop constraint if exists inventory_log_product_id_fkey;
alter table public.inventory_log
  add constraint inventory_log_product_id_fkey foreign key (product_id) references public.products(id) on delete cascade;
alter table public.inventory_log drop constraint if exists inventory_log_variant_id_fkey;
alter table public.inventory_log
  add constraint inventory_log_variant_id_fkey foreign key (variant_id) references public.product_variants(id) on delete set null;

create index if not exists inventory_log_product_created_idx on public.inventory_log (product_id, created_at desc);
create index if not exists inventory_log_variant_idx on public.inventory_log (variant_id);

-- Callers describe a change with transaction-local settings: app.stock_reason, app.stock_ref (order id), app.stock_note.
create or replace function public.log_variant_stock_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_prev integer := case when tg_op = 'INSERT' then 0 else coalesce(old.stock_count, 0) end;
  v_new integer := coalesce(new.stock_count, 0);
  v_reason text := nullif(current_setting('app.stock_reason', true), '');
  v_ref text := nullif(current_setting('app.stock_ref', true), '');
begin
  if v_prev = v_new then
    return null;
  end if;
  insert into public.inventory_log (product_id, variant_id, change_type, quantity_change, previous_count, new_count,
                                    reference_type, reference_id, notes)
  values (new.product_id, new.id,
          coalesce(v_reason, case when tg_op = 'INSERT' then 'initial_stock' else 'adjustment' end),
          v_new - v_prev, v_prev, v_new,
          case when v_ref is not null then 'order' end,
          case when v_ref is not null then v_ref::uuid end,
          nullif(current_setting('app.stock_note', true), ''));
  return null;
end;
$$;

drop trigger if exists trg_log_variant_stock on public.product_variants;
create trigger trg_log_variant_stock
  after insert or update of stock_count on public.product_variants
  for each row execute function public.log_variant_stock_change();

-- Quick restock / price change from the admin products list, recorded with its reason.
create or replace function public.admin_adjust_variant(
  p_variant_id uuid,
  p_stock integer,
  p_price numeric default null,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.product_variants%rowtype;
begin
  if p_stock is null or p_stock < 0 or p_stock > 1000000 then
    raise exception 'INVALID_STOCK';
  end if;
  if p_price is not null and (p_price <= 0 or p_price > 10000000) then
    raise exception 'INVALID_PRICE';
  end if;

  select * into v_row from public.product_variants where id = p_variant_id for update;
  if not found or v_row.is_active is false then
    raise exception 'VARIANT_NOT_FOUND';
  end if;

  perform set_config('app.stock_reason', case when p_stock > coalesce(v_row.stock_count, 0) then 'restock' else 'adjustment' end, true);
  perform set_config('app.stock_note', coalesce(nullif(trim(p_note), ''), ''), true);

  update public.product_variants
     set stock_count = p_stock,
         price = coalesce(p_price, price)
   where id = p_variant_id
  returning * into v_row;

  return jsonb_build_object('id', v_row.id, 'stock_count', v_row.stock_count, 'price', v_row.price,
                            'stock_status', v_row.stock_status, 'product_id', v_row.product_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Order timeline
-- ---------------------------------------------------------------------------
create table if not exists public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  event_type text not null check (event_type in ('created', 'status', 'payment', 'tracking', 'receipt', 'note')),
  from_value text,
  to_value text,
  note text,
  actor text not null default 'system' check (actor in ('customer', 'staff', 'system')),
  created_at timestamptz not null default now()
);
create index if not exists order_events_order_idx on public.order_events (order_id, created_at);
alter table public.order_events enable row level security;
revoke all on public.order_events from anon, authenticated;

-- SECURITY INVOKER on purpose: current_user tells the website/admin (service_role) apart from pg_cron (postgres).
-- Functions that run as their owner set app.actor themselves.
create or replace function public.log_order_changes()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_actor text := coalesce(nullif(current_setting('app.actor', true), ''),
                           case when current_user in ('postgres', 'supabase_admin') then 'system' else 'staff' end);
  v_note text := nullif(current_setting('app.order_note', true), '');
begin
  if new.status is distinct from old.status then
    insert into public.order_events (order_id, event_type, from_value, to_value, note, actor)
    values (new.id, 'status', old.status::text, new.status::text,
            coalesce(v_note, case when new.status = 'cancelled' then new.cancel_reason end), v_actor);
  end if;
  if new.payment_status is distinct from old.payment_status then
    insert into public.order_events (order_id, event_type, from_value, to_value, actor)
    values (new.id, 'payment', old.payment_status::text, new.payment_status::text, v_actor);
  end if;
  if new.tracking_number is distinct from old.tracking_number or new.courier is distinct from old.courier then
    insert into public.order_events (order_id, event_type, from_value, to_value, actor)
    values (new.id, 'tracking',
            nullif(trim(concat_ws(' ', old.courier, old.tracking_number)), ''),
            nullif(trim(concat_ws(' ', new.courier, new.tracking_number)), ''), v_actor);
  end if;
  if new.receipt_url is distinct from old.receipt_url and new.receipt_url is not null then
    insert into public.order_events (order_id, event_type, note, actor)
    values (new.id, 'receipt', 'Payment receipt uploaded', v_actor);
  end if;
  return null;
end;
$$;

drop trigger if exists trg_log_order_changes on public.orders;
create trigger trg_log_order_changes
  after update on public.orders
  for each row execute function public.log_order_changes();

-- ---------------------------------------------------------------------------
-- 5. create_order / cancel_order
-- ---------------------------------------------------------------------------
drop function if exists public.create_order(uuid, text, text, text, jsonb, delivery_type, uuid, payment_method, numeric, numeric, text);

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

  perform set_config('app.stock_reason', '', true);
  perform set_config('app.stock_ref', '', true);
  perform set_config('app.stock_note', '', true);

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'public_token', v_public_token,
    'customer_id', v_customer_id,
    'total', v_total
  );
end;
$$;

revoke all on function public.create_order(uuid, text, text, text, jsonb, delivery_type, uuid, payment_method, numeric, numeric, text, boolean) from public, anon, authenticated;
grant execute on function public.create_order(uuid, text, text, text, jsonb, delivery_type, uuid, payment_method, numeric, numeric, text, boolean) to service_role;

create or replace function public.cancel_order(p_order_id uuid, p_reason text default 'admin')
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
  v_prev integer;
  v_new integer;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if v_order.status = 'cancelled' then
    return jsonb_build_object('order_number', v_order.order_number, 'already_cancelled', true,
                              'payment_status', v_order.payment_status);
  end if;

  if v_order.status in ('shipped', 'delivered') then
    raise exception 'ORDER_ALREADY_SHIPPED';
  end if;

  perform set_config('app.actor', case when p_reason = 'expired' then 'system' else 'staff' end, true);
  perform set_config('app.stock_reason', case when p_reason = 'expired' then 'order_expired' else 'order_cancelled' end, true);
  perform set_config('app.stock_ref', p_order_id::text, true);
  perform set_config('app.stock_note', 'Stock returned: order ' || v_order.order_number, true);

  for v_item in
    select product_id, variant_id, quantity from public.order_items where order_id = p_order_id
  loop
    if v_item.variant_id is not null then
      -- The variant trigger recomputes its status and logs the change.
      update public.product_variants
         set stock_count = coalesce(stock_count, 0) + v_item.quantity
       where id = v_item.variant_id and is_active is not false;
    else
      select stock_count into v_prev from public.products where id = v_item.product_id for update;
      if found then
        v_new := coalesce(v_prev, 0) + v_item.quantity;
        update public.products set stock_count = v_new where id = v_item.product_id;
        insert into public.inventory_log (product_id, variant_id, change_type, quantity_change,
                                          previous_count, new_count, reference_type, reference_id, notes)
        values (v_item.product_id, null, 'order_cancelled', v_item.quantity,
                coalesce(v_prev, 0), v_new, 'order', p_order_id, 'Stock returned: order ' || v_order.order_number);
      end if;
    end if;
  end loop;

  update public.orders
     set status = 'cancelled', cancelled_at = now(), cancel_reason = p_reason
   where id = p_order_id;

  perform set_config('app.stock_reason', '', true);
  perform set_config('app.stock_ref', '', true);
  perform set_config('app.stock_note', '', true);
  perform set_config('app.actor', '', true);

  return jsonb_build_object('order_number', v_order.order_number, 'already_cancelled', false,
                            'payment_status', v_order.payment_status);
end;
$$;

revoke all on function public.cancel_order(uuid, text) from public, anon, authenticated;
grant execute on function public.cancel_order(uuid, text) to service_role;

-- ---------------------------------------------------------------------------
-- 6. Storefront cache webhook (URL + secret live in Supabase Vault: revalidate_url, revalidate_secret)
-- ---------------------------------------------------------------------------
create or replace function public.post_revalidate(p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_url text;
  v_secret text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'revalidate_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'revalidate_secret';
  if v_url is null or v_secret is null then
    return;
  end if;
  perform net.http_post(
    url := v_url,
    body := p_payload,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-revalidate-secret', v_secret),
    timeout_milliseconds := 5000
  );
exception when others then
  -- A cache refresh must never block a sale or an admin save.
  raise warning 'storefront revalidate webhook failed: %', sqlerrm;
end;
$$;

create or replace function public.notify_revalidate()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.post_revalidate(jsonb_build_object(
    'table', tg_table_name,
    'type', tg_op,
    'record', jsonb_build_object(
      'slug', coalesce(new.slug, old.slug),
      'category_id', coalesce(new.category_id, old.category_id),
      'category_slug', coalesce(new.category_slug, old.category_slug),
      'use_case_tags', to_jsonb(coalesce(new.use_case_tags, old.use_case_tags))
    )
  ));
  return coalesce(new, old);
end;
$$;

create or replace function public.notify_revalidate_variants()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r record;
begin
  if tg_op = 'DELETE' then
    for r in select distinct p.slug, p.category_id, p.category_slug
               from old_rows x join public.products p on p.id = x.product_id
    loop
      perform public.post_revalidate(jsonb_build_object('table', 'products', 'type', tg_op,
        'record', jsonb_build_object('slug', r.slug, 'category_id', r.category_id, 'category_slug', r.category_slug)));
    end loop;
  else
    for r in select distinct p.slug, p.category_id, p.category_slug
               from new_rows x join public.products p on p.id = x.product_id
    loop
      perform public.post_revalidate(jsonb_build_object('table', 'products', 'type', tg_op,
        'record', jsonb_build_object('slug', r.slug, 'category_id', r.category_id, 'category_slug', r.category_slug)));
    end loop;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_product_variants_revalidate on public.product_variants;
drop trigger if exists trg_variants_revalidate_ins on public.product_variants;
drop trigger if exists trg_variants_revalidate_upd on public.product_variants;
drop trigger if exists trg_variants_revalidate_del on public.product_variants;
create trigger trg_variants_revalidate_ins after insert on public.product_variants
  referencing new table as new_rows for each statement execute function public.notify_revalidate_variants();
create trigger trg_variants_revalidate_upd after update on public.product_variants
  referencing new table as new_rows for each statement execute function public.notify_revalidate_variants();
create trigger trg_variants_revalidate_del after delete on public.product_variants
  referencing old table as old_rows for each statement execute function public.notify_revalidate_variants();
drop function if exists public.notify_revalidate_variant();

-- ---------------------------------------------------------------------------
-- 7. Search and shop ordering
-- ---------------------------------------------------------------------------
alter table public.products add column if not exists is_sold_out boolean
  generated always as (stock_status = 'out_of_stock'::public.stock_status) stored;
alter table public.products add column if not exists sort_position integer;

create or replace function public.update_product_search_vector()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.sku, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.category_name, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(coalesce(new.use_case_tags, '{}'), ' ')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.short_description, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'D');
  return new;
end;
$$;

create index if not exists idx_products_name_trgm on public.products using gin (lower(name) extensions.gin_trgm_ops);

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
returns table(id uuid, sku text, name text, slug text, price numeric, stock_status stock_status, stock_count integer,
              primary_image text, category_name text, total_count bigint)
language plpgsql
stable
set search_path = public, extensions, pg_temp
as $$
declare
  v_use_case_names text[];
  v_q text := nullif(trim(p_search_query), '');
  v_tsq tsquery;
  v_fuzzy boolean;
begin
  if p_use_case_slugs is not null then
    select array_agg(uct.name) into v_use_case_names from public.use_case_tags uct where uct.slug = any(p_use_case_slugs);
  end if;
  if v_q is not null then
    v_tsq := plainto_tsquery('english', v_q);
  end if;
  -- Misspellings ("monstra", "sansiveria") only for queries long enough for trigrams to mean something.
  v_fuzzy := v_q is not null and length(v_q) >= 3;

  return query
  with filtered_products as (
    select
      p.id, p.sku, p.name, p.slug, p.price, p.stock_status, p.stock_count,
      coalesce(
        (select pi.url
           from public.product_images pi
           join public.product_variants pv on pv.id = pi.variant_id
          where pi.product_id = p.id and pv.is_active is not false
          order by (pi.variant_id = p.card_variant_id) desc nulls last, pv.price asc, pi.sort_order asc
          limit 1),
        (select pi.url from public.product_images pi
          where pi.product_id = p.id and pi.variant_id is null
          order by pi.is_primary desc, pi.sort_order asc
          limit 1)
      ) as img,
      p.category_name as cat_name,
      case
        when v_q is null then 0::real
        else coalesce(ts_rank(p.search_vector, v_tsq), 0) + word_similarity(lower(v_q), lower(p.name))
      end as relevance
    from public.products p
    where p.published_at is not null
      and p.published_at <= now()
      and (
        v_q is null
        or p.search_vector @@ v_tsq
        or (v_fuzzy and word_similarity(lower(v_q), lower(p.name || ' ' || coalesce(p.category_name, ''))) >= 0.4)
      )
      and (p_category_slug is null or p.category_slug = p_category_slug)
      and (v_use_case_names is null or p.use_case_tags && v_use_case_names)
      and (p_light_levels is null or p.light_requirement = any(p_light_levels))
      and (p_difficulties is null or p.difficulty = any(p_difficulties))
      and (p_min_price is null or p.price >= p_min_price)
      and (p_max_price is null or p.price <= p_max_price)
      and (p_is_pet_safe is null or p.is_pet_safe = p_is_pet_safe)
      and (p_is_new_arrival is null or p.is_new_arrival = p_is_new_arrival)
  )
  select
    fp.id, fp.sku, fp.name, fp.slug, fp.price, fp.stock_status, fp.stock_count, fp.img, fp.cat_name,
    count(*) over() as total_count
  from filtered_products fp
  order by
    (fp.stock_status = 'out_of_stock') asc,
    case p_sort_by when 'relevance' then fp.relevance end desc nulls last,
    case p_sort_by when 'price_asc' then fp.price end asc nulls last,
    case p_sort_by when 'price_desc' then fp.price end desc nulls last,
    case p_sort_by when 'name' then fp.name end asc nulls last,
    fp.relevance desc,
    fp.name asc
  limit greatest(least(coalesce(p_page_size, 24), 100), 1) offset greatest(coalesce(p_page_offset, 0), 0);
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. Categories: editable copy, renames flow to products
-- ---------------------------------------------------------------------------
alter table public.categories
  add column if not exists tagline text,
  add column if not exists intro text,
  add column if not exists meta_title text,
  add column if not exists meta_description text;

create or replace function public.cascade_category_rename()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  update public.products
     set category_name = new.name, category_slug = new.slug
   where category_id = new.id
     and (category_name is distinct from new.name or category_slug is distinct from new.slug);
  return null;
end;
$$;

drop trigger if exists trg_cascade_category_rename on public.categories;
create trigger trg_cascade_category_rename
  after update of name, slug on public.categories
  for each row when (old.name is distinct from new.name or old.slug is distinct from new.slug)
  execute function public.cascade_category_rename();

-- ---------------------------------------------------------------------------
-- 9. Advisor fixes and cleanup
-- ---------------------------------------------------------------------------
-- RLS: evaluate auth.uid() once per statement, not once per row.
alter policy "Users can view own customer record" on public.customers
  using (auth_id = (select auth.uid()));
alter policy "Users can update own customer record" on public.customers
  using (auth_id = (select auth.uid())) with check (auth_id = (select auth.uid()));
alter policy "Users can view own addresses" on public.addresses
  using (customer_id in (select c.id from public.customers c where c.auth_id = (select auth.uid())));
alter policy "Users can insert own addresses" on public.addresses
  with check (customer_id in (select c.id from public.customers c where c.auth_id = (select auth.uid())));
alter policy "Users can update own addresses" on public.addresses
  using (customer_id in (select c.id from public.customers c where c.auth_id = (select auth.uid())))
  with check (customer_id in (select c.id from public.customers c where c.auth_id = (select auth.uid())));
alter policy "Users can delete own addresses" on public.addresses
  using (customer_id in (select c.id from public.customers c where c.auth_id = (select auth.uid())));
alter policy "Users can view own orders" on public.orders
  using (customer_id in (select c.id from public.customers c where c.auth_id = (select auth.uid())));
alter policy "Users can view own order items" on public.order_items
  using (order_id in (select o.id from public.orders o join public.customers c on o.customer_id = c.id
                      where c.auth_id = (select auth.uid())));
alter policy "Users can view own wishlist" on public.wishlist_items
  using (customer_id in (select c.id from public.customers c where c.auth_id = (select auth.uid())));
alter policy "Users can add to own wishlist" on public.wishlist_items
  with check (customer_id in (select c.id from public.customers c where c.auth_id = (select auth.uid())));
alter policy "Users can remove from own wishlist" on public.wishlist_items
  using (customer_id in (select c.id from public.customers c where c.auth_id = (select auth.uid())));
alter policy "Users can view own event registrations" on public.event_registrations
  using (customer_id in (select c.id from public.customers c where c.auth_id = (select auth.uid())));

-- Foreign keys without a covering index.
create index if not exists event_registrations_customer_idx on public.event_registrations (customer_id);
create index if not exists order_items_variant_idx on public.order_items (variant_id);
create index if not exists orders_address_idx on public.orders (address_id);
create index if not exists referral_rewards_referrer_idx on public.referral_rewards (referrer_id);
create index if not exists reviews_customer_idx on public.reviews (customer_id);
create index if not exists wishlist_items_product_idx on public.wishlist_items (product_id);
create index if not exists orders_payment_status_idx on public.orders (payment_status, created_at desc);

-- Duplicates of unique indexes.
drop index if exists public.idx_categories_slug;
drop index if exists public.idx_orders_public_token_status;

-- rate_limit_hits had no primary key.
alter table public.rate_limit_hits add column if not exists id bigint generated always as identity;
do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.rate_limit_hits'::regclass and contype = 'p') then
    alter table public.rate_limit_hits add primary key (id);
  end if;
end $$;

-- Leftovers from earlier designs (nothing reads them).
alter table public.product_variants drop column if exists image_url;
alter table public.reviews drop column if exists text;

-- Trigger and helper functions are not an API: nobody calls them over /rest/v1/rpc.
revoke all on function public.stock_status_for(integer, integer) from public, anon, authenticated;
revoke all on function public.auto_stock_status() from public, anon, authenticated;
revoke all on function public.variant_stock_status() from public, anon, authenticated;
revoke all on function public.product_threshold_changed() from public, anon, authenticated;
revoke all on function public.sync_product_stock_from_variants() from public, anon, authenticated;
revoke all on function public.log_variant_stock_change() from public, anon, authenticated;
revoke all on function public.log_order_changes() from public, anon, authenticated;
revoke all on function public.post_revalidate(jsonb) from public, anon, authenticated;
revoke all on function public.notify_revalidate() from public, anon, authenticated;
revoke all on function public.notify_revalidate_variants() from public, anon, authenticated;
revoke all on function public.cascade_category_rename() from public, anon, authenticated;
revoke all on function public.sync_product_category() from public, anon, authenticated;
revoke all on function public.update_product_search_vector() from public, anon, authenticated;
revoke all on function public.update_updated_at_column() from public, anon, authenticated;
revoke all on function public.validate_product_tags() from public, anon, authenticated;
revoke all on function public.events_set_spots() from public, anon, authenticated;
revoke all on function public.admin_adjust_variant(uuid, integer, numeric, text) from public, anon, authenticated;
grant execute on function public.admin_adjust_variant(uuid, integer, numeric, text) to service_role;

-- ---------------------------------------------------------------------------
-- Data: re-grade every variant under the new rule, refresh search vectors.
-- ---------------------------------------------------------------------------
update public.product_variants set stock_status = stock_status;
update public.products set name = name;
