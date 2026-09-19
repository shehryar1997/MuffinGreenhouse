"use server"

import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/supabase/admin-client"
import { isAdminRequest, requireAdmin } from "@/lib/admin-auth"
import { sendOrderConfirmedEmail } from "@/lib/email/send-order-confirmed"
import { sendOrderShippedEmail } from "@/lib/email/send-order-shipped"

const DEFAULT_COURIER = "Leopards Courier"

interface OrderForEmail {
  order_number: string
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
    .select("order_number, total, delivery_type, customer:customers(email, name), order_items(product_name, quantity, unit_price)")
    .eq("id", orderId)
    .single()

  if (error || !data) {
    console.error("Failed to load order for email:", error)
    return null
  }

  return {
    ...data,
    customer: data.customer as unknown as { email: string; name: string | null } | null,
    order_items: (data.order_items as unknown as OrderForEmail["order_items"]) || [],
  }
}

export async function markPaid(orderId: string) {
  await requireAdmin()
  const { error } = await supabaseAdmin
    .from("orders")
    .update({ payment_status: "paid", status: "confirmed", confirmed_at: new Date().toISOString() })
    .eq("id", orderId)
  if (error) throw new Error(error.message)

  try {
    const order = await getOrderForEmail(orderId)
    if (order?.customer?.email) {
      await sendOrderConfirmedEmail({
        toEmail: order.customer.email,
        customerName: order.customer.name || undefined,
        orderNumber: order.order_number,
        total: order.total,
        items: order.order_items.map((item) => ({
          productName: item.product_name,
          quantity: item.quantity,
          price: item.unit_price,
        })),
        deliveryType: order.delivery_type,
      })
    }
  } catch (emailError) {
    // Log error but don't fail the mark-as-paid action
    console.error("Failed to send order confirmed email:", emailError)
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

export async function cancelOrder(orderId: string) {
  await requireAdmin()
  const { error } = await supabaseAdmin
    .from("orders")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", orderId)
  if (error) throw new Error(error.message)
  redirect(`/admin/orders/${orderId}`)
}
