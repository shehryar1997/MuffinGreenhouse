"use server"

import { canDeleteOrder, ORDER_KEPT_MESSAGE } from "../delete-order-description"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/supabase/admin-client"
import { isAdminRequest, requireAdmin } from "@/lib/admin-auth"
import { sendOrderConfirmedEmail } from "@/lib/email/send-order-confirmed"
import { grantReferralRewards } from "@/lib/referrals"
import { sendOrderShippedEmail } from "@/lib/email/send-order-shipped"
import { sendOrderCancelledEmail } from "@/lib/email/send-order-cancelled"
import { isPlaceholderEmail } from "@/lib/manual-order"
import { OVERSEAS_LEAD_DAYS, addDays, formatEta, toDateColumn } from "@/lib/fulfillment"
import { BAD_BULK_REQUEST, cleanBulkIds, type BulkDeleteResult } from "@/lib/admin-bulk"

const DEFAULT_COURIER = "Leopards Courier"

interface OrderForEmail {
  order_number: string
  public_token: string
  total: number
  delivery_type: "delivery" | "pickup"
  customer: { email: string; name: string | null } | null
  order_items: Array<{ product_name: string; quantity: number; unit_price: number }>
}

// `orders` has no customer_email/customer_name columns - that info lives on
// the linked `customers` row, so it must be joined explicitly.
async function getOrderForEmail(orderId: string): Promise<OrderForEmail | null> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("order_number, public_token, total, delivery_type, customer:customers(email, name), order_items(product_name, quantity, unit_price)")
    .eq("id", orderId)
    .single()

  if (error || !data) {
    console.error("Failed to load order for email:", error)
    return null
  }

  // Orders recorded by hand for a WhatsApp customer have a stand-in address that can't receive mail.
  const customer = data.customer as unknown as { email: string; name: string | null } | null
  if (isPlaceholderEmail(customer?.email)) return null

  return {
    ...data,
    customer,
    order_items: (data.order_items as unknown as OrderForEmail["order_items"]) || [],
  }
}

export async function markPaid(orderId: string) {
  await requireAdmin()

  const { data: current, error: readError } = await supabaseAdmin
    .from("orders")
    .select("status, payment_status, ships_overseas")
    .eq("id", orderId)
    .maybeSingle()
  if (readError) throw new Error(readError.message)
  if (!current) throw new Error("Order not found")

  // Already paid (double click / stale page): nothing to change and nothing to re-send.
  if (current.payment_status === "paid") redirect(`/admin/orders/${orderId}`)

  // A cancelled order has already given its stock back, so reviving it as "confirmed" would oversell.
  if (current.status === "cancelled") {
    throw new Error("This order was cancelled and its stock was released. Ask the customer to place a new order instead.")
  }

  // Payment is what moves an order from "pending" to "confirmed". An order that is already confirmed,
  // processing, shipped or delivered keeps its status: marking it paid must never send it backwards.
  const confirming = current.status === "pending"

  // Overseas orders are ordered from the supplier now that they are paid, so the delivery estimate restarts from
  // today (create_order only set a provisional one). The slowest overseas line sets the date for the whole order.
  let estimatedDelivery: string | null = null
  if (current.ships_overseas) {
    const { data: lines } = await supabaseAdmin
      .from("order_items")
      .select("product_id, fulfillment_type")
      .eq("order_id", orderId)
    const overseasIds = (lines ?? []).filter((l) => l.fulfillment_type === "overseas" && l.product_id).map((l) => l.product_id as string)
    const { data: products } = overseasIds.length
      ? await supabaseAdmin.from("products").select("id, lead_time_days").in("id", overseasIds)
      : { data: [] as { id: string; lead_time_days: number | null }[] }
    const leadDays = overseasIds.reduce(
      (max, id) => Math.max(max, products?.find((p) => p.id === id)?.lead_time_days ?? OVERSEAS_LEAD_DAYS),
      0
    )
    estimatedDelivery = toDateColumn(addDays(new Date(), leadDays))
  }

  const { data: updated, error } = await supabaseAdmin
    .from("orders")
    .update({
      payment_status: "paid",
      ...(confirming ? { status: "confirmed", confirmed_at: new Date().toISOString() } : {}),
      ...(estimatedDelivery ? { estimated_delivery_date: estimatedDelivery } : {}),
    })
    .eq("id", orderId)
    .eq("status", current.status) // lost a race with a cancel/ship? then update nothing
    .neq("payment_status", "paid")
    .select("id")
  if (error) throw new Error(error.message)
  if (!updated || updated.length === 0) {
    throw new Error("The order changed while you were working on it. Refresh the page and try again.")
  }

  // Referral rewards are paid once the order is really paid (never for unpaid or expired bookings).
  try {
    await grantReferralRewards(orderId)
  } catch (rewardError) {
    console.error("Failed to grant referral reward:", rewardError)
  }

  // The "order confirmed" e-mail only makes sense at the moment the order is confirmed.
  if (confirming) {
    try {
      const order = await getOrderForEmail(orderId)
      if (order?.customer?.email) {
        await sendOrderConfirmedEmail({
          toEmail: order.customer.email,
          customerName: order.customer.name || undefined,
          orderNumber: order.order_number,
          publicToken: order.public_token,
          total: order.total,
          items: order.order_items.map((item) => ({
            productName: item.product_name,
            quantity: item.quantity,
            price: item.unit_price,
          })),
          deliveryType: order.delivery_type,
          estimatedDelivery: estimatedDelivery ? formatEta(estimatedDelivery) : undefined,
        })
      }
    } catch (emailError) {
      // Log error but don't fail the mark-as-paid action
      console.error("Failed to send order confirmed email:", emailError)
    }
  }

  redirect(`/admin/orders/${orderId}`)
}

export interface MarkShippedResult {
  success: boolean
  error?: string
}

// Called directly from a client component (the tracking-number dialog),
// unlike the other actions below which run via <form action>. Next's
// redirect() is a thrown control-flow signal - wrapping this call in the
// caller's try/catch to report errors would also catch and mishandle that
// signal, so this returns a plain result object instead and only redirects
// on success, same as the account login action does.
export async function markShipped(orderId: string, trackingNumber: string): Promise<MarkShippedResult> {
  if (!(await isAdminRequest())) {
    return { success: false, error: "Your admin session has expired. Log in again." }
  }
  const trimmedTrackingNumber = trackingNumber.trim()
  if (!trimmedTrackingNumber) {
    return { success: false, error: "Tracking number is required" }
  }

  const { error } = await supabaseAdmin
    .from("orders")
    .update({
      status: "shipped",
      shipped_at: new Date().toISOString(),
      tracking_number: trimmedTrackingNumber,
      courier: DEFAULT_COURIER,
    })
    .eq("id", orderId)
  if (error) return { success: false, error: error.message }

  try {
    const order = await getOrderForEmail(orderId)
    if (order?.customer?.email) {
      await sendOrderShippedEmail({
        toEmail: order.customer.email,
        customerName: order.customer.name,
        orderNumber: order.order_number,
        publicToken: order.public_token,
        total: order.total,
        items: order.order_items.map((item) => ({
          productName: item.product_name,
          quantity: item.quantity,
          price: item.unit_price,
        })),
        deliveryType: order.delivery_type,
        trackingNumber: trimmedTrackingNumber,
        courier: DEFAULT_COURIER,
      })
    }
  } catch (emailError) {
    // Log error but don't fail the mark-as-shipped action - the order status
    // update above already succeeded.
    console.error("Failed to send order shipped email:", emailError)
  }

  redirect(`/admin/orders/${orderId}`)
}

export async function markDelivered(orderId: string) {
  await requireAdmin()
  const { error } = await supabaseAdmin
    .from("orders")
    .update({ status: "delivered", delivered_at: new Date().toISOString() })
    .eq("id", orderId)
  if (error) throw new Error(error.message)
  redirect(`/admin/orders/${orderId}`)
}

/**
 * Permanently deletes an order and its line items (order_items cascade). It disappears from the order list,
 * the customer's history and revenue totals. The customer is not e-mailed.
 *
 * Stock: an order that hasn't shipped is still holding plants, so it is cancelled first and they go back on
 * the shelf. Shipped/delivered orders have left the greenhouse, and cancelled ones already gave theirs back.
 */
async function removeOrder(orderId: string): Promise<{ error: string } | undefined> {
  const { data: order, error: readError } = await supabaseAdmin
    .from("orders")
    .select("id, status, payment_status")
    .eq("id", orderId)
    .maybeSingle()
  if (readError) return { error: readError.message }
  if (!order) return { error: "This order no longer exists." }
  if (!canDeleteOrder(order as { status: string; payment_status: string })) return { error: ORDER_KEPT_MESSAGE }

  if (order.status !== "cancelled" && order.status !== "shipped" && order.status !== "delivered") {
    const { error: releaseError } = await supabaseAdmin.rpc("cancel_order", { p_order_id: orderId, p_reason: "deleted" })
    if (releaseError && !releaseError.message.includes("ORDER_NOT_FOUND")) {
      return { error: `Couldn't return the order's stock, so nothing was deleted: ${releaseError.message}` }
    }
  }

  const { error: deleteError } = await supabaseAdmin.from("orders").delete().eq("id", orderId)
  if (deleteError) return { error: deleteError.message }
}

function refreshAfterOrderDelete() {
  revalidatePath("/admin/orders")
  revalidatePath("/admin/customers")
  revalidatePath("/admin")
}

export async function deleteOrder(orderId: string, redirectToList: boolean): Promise<{ error: string } | undefined> {
  await requireAdmin()
  const failed = await removeOrder(orderId)
  if (failed) return failed

  refreshAfterOrderDelete()
  if (redirectToList) redirect("/admin/orders")
}

// "Delete selected" on the orders list: each order is handled exactly like a single delete (stock returned for
// orders that haven't shipped). One that can't be deleted is kept and reported by number.
export async function deleteOrders(ids: string[]): Promise<BulkDeleteResult> {
  await requireAdmin()
  const clean = cleanBulkIds(ids)
  if (!clean) return BAD_BULK_REQUEST

  const { data: named } = await supabaseAdmin.from("orders").select("id, order_number").in("id", clean)
  const numberOf = new Map((named ?? []).map((o) => [o.id as string, o.order_number as string]))

  const result: BulkDeleteResult = { deleted: 0, failures: [] }
  for (const id of clean) {
    const failed = await removeOrder(id)
    if (!failed) result.deleted += 1
    else result.failures.push(`Order ${numberOf.get(id) ?? id}: ${failed.error}`)
  }

  if (result.deleted > 0) refreshAfterOrderDelete()
  return result
}

export async function cancelOrder(orderId: string) {
  await requireAdmin()

  // One database call cancels the order AND puts its plants back in stock, atomically
  // (see cancel_order() in the migrations). It refuses orders that have already shipped.
  const { data, error } = await supabaseAdmin.rpc("cancel_order", { p_order_id: orderId, p_reason: "admin" })
  if (error) {
    if (error.message.includes("ORDER_ALREADY_SHIPPED")) {
      throw new Error("This order has already shipped, so it can't be cancelled here. Handle it as a return instead.")
    }
    if (error.message.includes("ORDER_NOT_FOUND")) throw new Error("Order not found")
    throw new Error(error.message)
  }
  const result = data as { order_number: string; already_cancelled: boolean; payment_status: string }
  // Already cancelled (double click / stale page): don't e-mail twice.
  if (result.already_cancelled) redirect(`/admin/orders/${orderId}`)

  // Tell the customer: "cancelled because the invoice wasn't cleared -- book again any time".
  // Skipped for orders that were already PAID: that wording would be wrong for a customer who
  // paid, so a cancelled paid order needs a personal message from you instead.
  if (result.payment_status !== "paid") {
    try {
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("order_number, customer:customers(email, name)")
        .eq("id", orderId)
        .maybeSingle()
      const customer = order?.customer as unknown as { email: string; name: string | null } | null
      if (order && customer?.email && !isPlaceholderEmail(customer.email)) {
        await sendOrderCancelledEmail({
          toEmail: customer.email,
          customerName: customer.name,
          orderNumber: order.order_number,
        })
        await supabaseAdmin.from("orders").update({ cancellation_email_sent_at: new Date().toISOString() }).eq("id", orderId)
      }
    } catch (emailError) {
      // The order is already cancelled; don't fail the action because the e-mail didn't go out.
      console.error("Failed to send order cancelled email:", emailError)
    }
  }

  redirect(`/admin/orders/${orderId}`)
}

/** A staff note on the order's timeline (e.g. "Customer asked to deliver after 5 pm"). */
export async function addOrderNote(orderId: string, formData: FormData): Promise<void> {
  await requireAdmin()
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000)
  if (!note) return
  const { error } = await supabaseAdmin.from("order_events").insert({ order_id: orderId, event_type: "note", note, actor: "staff" })
  if (error) throw new Error(`Couldn't save the note: ${error.message}`)
  revalidatePath(`/admin/orders/${orderId}`)
}
