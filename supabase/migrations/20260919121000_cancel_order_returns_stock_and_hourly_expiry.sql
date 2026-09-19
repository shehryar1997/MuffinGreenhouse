-- ============================================================================
-- Cancelling / expiring an order puts its stock back, and expiry runs hourly
-- ============================================================================
-- create_order() decrements stock when an order is placed, but nothing ever gave it
-- back: a cancelled or expired (unpaid for 24h) order kept its plants "sold" forever.
-- cancel_order() is now the one place that cancels an order AND returns its stock,
-- atomically. Both the admin "Cancel Order" button and the expiry job call it.

alter table public.orders
  add column if not exists cancel_reason text,
  add column if not exists cancellation_email_sent_at timestamptz;

-- The customer never sees why an order was cancelled internally, but the staff do.
grant select (cancel_reason) on public.orders to authenticated;

create or replace function public.cancel_order(p_order_id uuid, p_reason text default 'admin')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order   public.orders%rowtype;
  v_item    record;
  v_prev    integer;
  v_new     integer;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if v_order.status = 'cancelled' then
    return jsonb_build_object('order_number', v_order.order_number, 'already_cancelled', true,
                              'payment_status', v_order.payment_status);
  end if;

  -- Shipped/delivered plants have left the greenhouse: returning their stock would be wrong.
  if v_order.status in ('shipped', 'delivered') then
    raise exception 'ORDER_ALREADY_SHIPPED';
  end if;

  for v_item in
    select product_id, variant_id, quantity from public.order_items where order_id = p_order_id
  loop
    if v_item.variant_id is not null then
      select stock_count into v_prev from public.product_variants where id = v_item.variant_id for update;
      if found then
        v_new := coalesce(v_prev, 0) + v_item.quantity;
        update public.product_variants
           set stock_count = v_new,
               stock_status = case when stock_status = 'out_of_stock' and v_new > 0 then 'in_stock' else stock_status end
         where id = v_item.variant_id;
        insert into public.inventory_log (product_id, variant_id, change_type, quantity_change,
                                          previous_count, new_count, reference_type, reference_id, notes)
        values (v_item.product_id, v_item.variant_id, 'order_cancelled', v_item.quantity,
                coalesce(v_prev, 0), v_new, 'order', p_order_id, 'Stock returned: order ' || v_order.order_number || ' ' || p_reason);
      end if;
    else
      select stock_count into v_prev from public.products where id = v_item.product_id for update;
      if found then
        v_new := coalesce(v_prev, 0) + v_item.quantity;
        -- products_auto_stock_status trigger keeps stock_status in step.
        update public.products set stock_count = v_new where id = v_item.product_id;
        insert into public.inventory_log (product_id, variant_id, change_type, quantity_change,
                                          previous_count, new_count, reference_type, reference_id, notes)
        values (v_item.product_id, null, 'order_cancelled', v_item.quantity,
                coalesce(v_prev, 0), v_new, 'order', p_order_id, 'Stock returned: order ' || v_order.order_number || ' ' || p_reason);
      end if;
    end if;
  end loop;

  update public.orders
     set status = 'cancelled', cancelled_at = now(), cancel_reason = p_reason
   where id = p_order_id;

  return jsonb_build_object('order_number', v_order.order_number, 'already_cancelled', false,
                            'payment_status', v_order.payment_status);
end;
$$;

-- Unpaid orders older than p_hours are cancelled (stock returned). Returns how many.
create or replace function public.expire_pending_orders(p_hours integer default 24)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id    uuid;
  v_count integer := 0;
begin
  for v_id in
    select id from public.orders
    where status = 'pending' and payment_status = 'pending'
      and created_at < now() - make_interval(hours => p_hours)
    order by created_at
  loop
    perform public.cancel_order(v_id, 'expired');
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.cancel_order(uuid, text) from public, anon, authenticated;
revoke all on function public.expire_pending_orders(integer) from public, anon, authenticated;
grant execute on function public.cancel_order(uuid, text) to service_role;
grant execute on function public.expire_pending_orders(integer) to service_role;

-- Vercel's cron on the current plan is daily at best, so the hourly sweep runs inside
-- the database. (The daily Vercel job now only sends the "order cancelled" e-mails for
-- orders this sweep cancelled -- see /api/cron/expire-pending-orders.)
create extension if not exists pg_cron;
