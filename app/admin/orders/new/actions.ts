"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { supabaseAdmin } from "@/supabase/admin-client"
import { isAdminRequest } from "@/lib/admin-auth"
import { pakistanCities } from "@/data/pakistan-cities"
import { calculateDeliveryFee, mergeParcel, type DeliveryFeeDimensions } from "@/lib/delivery-fee"
import { dbSubtotal } from "@/lib/coupons"
import { MANUAL_ORDER_NOTE, normalizePkPhone, placeholderEmailForPhone } from "@/lib/manual-order"

export type CreateManualOrderState = { error: string } | undefined

const PAYMENT_METHODS = ["bank_transfer", "jazzcash", "easypaisa", "nayapay", "zindigi", "raast", "card"] as const

const uuid = z.string().uuid()

const schema = z.object({
  name: z.string().trim().min(1, "Enter the customer's name.").max(120),
  phone: z
    .string()
    .trim()
    .min(7, "Enter the customer's WhatsApp number.")
    .max(32)
    .refine((v) => normalizePkPhone(v).length >= 10, "That phone number looks too short."),
  email: z.string().trim().toLowerCase().max(254).email("That e-mail address isn't valid.").or(z.literal("")),
  items: z
    .array(z.object({ productId: uuid, variantId: uuid.nullish(), quantity: z.number().int().min(1).max(99) }))
    .min(1, "Add at least one item.")
    .max(50),
  deliveryType: z.enum(["delivery", "pickup"]),
  street: z.string().trim().max(500),
  city: z.string().trim().max(100),
  paymentMethod: z.enum(PAYMENT_METHODS),
  paid: z.boolean(),
  deliveryFee: z.number().min(0).max(1_000_000).nullable(),
  discount: z.number().min(0).max(10_000_000),
  orderDate: z.string().trim(),
  notes: z.string().trim().max(1000),
})

function field(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === "string" ? value : ""
}

function optionalNumber(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : NaN
}

/**
 * Records an order the customer placed personally on WhatsApp. It goes through the same create_order()
 * database function as a website order (so prices come from the catalogue and the plants are taken out
 * of stock atomically), then is marked confirmed straight away: the deal is already agreed, so the
 * 24-hour unpaid-hold sweep must not cancel it. No e-mail is sent to the customer.
 */
export async function createManualOrder(_prev: CreateManualOrderState, formData: FormData): Promise<CreateManualOrderState> {
  if (!(await isAdminRequest())) return { error: "Your admin session has expired. Log in again." }

  let items: unknown
  try {
    items = JSON.parse(field(formData, "items") || "[]")
  } catch {
    return { error: "The item list couldn't be read. Refresh the page and try again." }
  }

  const parsed = schema.safeParse({
    name: field(formData, "name"),
    phone: field(formData, "phone"),
    email: field(formData, "email"),
    items,
    deliveryType: field(formData, "delivery_type"),
    street: field(formData, "street"),
    city: field(formData, "city"),
    paymentMethod: field(formData, "payment_method"),
    paid: formData.get("paid") === "on",
    deliveryFee: optionalNumber(field(formData, "delivery_fee")),
    discount: optionalNumber(field(formData, "discount")) ?? 0,
    orderDate: field(formData, "order_date"),
    notes: field(formData, "notes"),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." }
  const body = parsed.data

  if (body.deliveryType === "delivery" && (body.street.length < 5 || !body.city)) {
    return { error: "Enter the delivery address and city." }
  }

  let createdAt: string | null = null
  if (body.orderDate) {
    const date = new Date(`${body.orderDate}T12:00:00+05:00`)
    if (Number.isNaN(date.getTime())) return { error: "That order date isn't valid." }
    if (date.getTime() > Date.now() + 24 * 60 * 60 * 1000) return { error: "The order date can't be in the future." }
    createdAt = date.toISOString()
  }

  // --- Customer: match on e-mail if given, else on the WhatsApp number (via its stand-in address). ---
  const phone = body.phone
  const email = body.email || placeholderEmailForPhone(phone)

  const { data: existing, error: lookupError } = await supabaseAdmin.from("customers").select("id").eq("email", email).maybeSingle()
  if (lookupError) return { error: "Couldn't look up the customer. Try again." }

  let customerId = existing?.id as string | undefined
  if (!customerId) {
    const { data: created, error: createError } = await supabaseAdmin
      .from("customers")
      .insert({ email, name: body.name, phone })
      .select("id")
      .single()
    if (createError || !created) {
      console.error("Manual order: failed to create customer:", createError)
      return { error: "Couldn't save the customer. Try again." }
    }
    customerId = created.id
  }

  // --- Delivery address (the orders table only stores an address_id). ---
  let addressId: string | null = null
  let deliveryCity: string | null = null
  if (body.deliveryType === "delivery") {
    const province = pakistanCities.find((c) => c.name === body.city)?.province || body.city
    const { data: address, error: addressError } = await supabaseAdmin
      .from("addresses")
      .insert({ customer_id: customerId, label: "WhatsApp order", street: body.street, city: body.city, province, phone })
      .select("id")
      .single()
    if (addressError || !address) {
      console.error("Manual order: failed to save address:", addressError)
      return { error: "Couldn't save the delivery address. Try again." }
    }
    addressId = address.id
    deliveryCity = body.city
  }

  // --- Delivery fee: the standard rate unless the admin typed one (including 0 for free delivery). ---
  let deliveryFee = body.deliveryFee
  if (deliveryFee === null) {
    deliveryFee = 0
    if (body.deliveryType === "delivery") {
      const variantIds = [...new Set(body.items.flatMap((i) => (i.variantId ? [i.variantId] : [])))]
      const [{ data: rows }, { data: variantRows }] = await Promise.all([
        supabaseAdmin
          .from("products")
          .select("id, box_height_cm, box_width_cm, box_breadth_cm, category_slug, weight_kg")
          .in("id", [...new Set(body.items.map((i) => i.productId))]),
        variantIds.length
          ? supabaseAdmin.from("product_variants").select("id, weight_kg, box_height_cm, box_width_cm, box_breadth_cm").in("id", variantIds)
          : Promise.resolve({ data: [] as Array<{ id: string; weight_kg: number | null; box_height_cm: number | null; box_width_cm: number | null; box_breadth_cm: number | null }> }),
      ])
      const dims = new Map<string, DeliveryFeeDimensions>(
        (rows ?? []).map((r) => [
          r.id,
          { categorySlug: r.category_slug, boxHeightCm: r.box_height_cm, boxWidthCm: r.box_width_cm, boxBreadthCm: r.box_breadth_cm, weightKg: r.weight_kg },
        ])
      )
      const sizeParcel = new Map(
        (variantRows ?? []).map((v) => [v.id, { weightKg: v.weight_kg, boxHeightCm: v.box_height_cm, boxWidthCm: v.box_width_cm, boxBreadthCm: v.box_breadth_cm }])
      )
      deliveryFee = calculateDeliveryFee({
        deliveryType: "delivery",
        city: deliveryCity,
        items: body.items.map((i) => {
          const dim = dims.get(i.productId)
          return { dim: dim ? mergeParcel(dim, i.variantId ? sizeParcel.get(i.variantId) : null) : undefined, quantity: i.quantity }
        }),
      })
    }
  }

  // The database caps a discount at the order's subtotal; say so here instead of silently recording less.
  if (body.discount > 0 && body.discount > (await dbSubtotal(body.items))) {
    return { error: "The discount is bigger than the order total." }
  }

  const { data, error } = await supabaseAdmin.rpc("create_order", {
    p_customer_id: customerId,
    p_customer_email: email,
    p_customer_name: body.name,
    p_customer_phone: phone,
    p_items: body.items.map((i) => ({ product_id: i.productId, variant_id: i.variantId ?? null, quantity: i.quantity })),
    p_delivery_type: body.deliveryType,
    p_address_id: addressId,
    p_payment_method: body.paymentMethod,
    p_delivery_fee: deliveryFee,
    p_discount_amount: body.discount,
    p_customer_notes: null,
    // Staff can record a WhatsApp sale of a product that isn't published on the website (yet).
    p_allow_unpublished: true,
  })
  if (error) {
    console.error("Manual order: create_order failed:", error)
    if (/insufficient stock/i.test(error.message)) return { error: "One of those plants doesn't have enough stock for that quantity. Lower the quantity or update the stock first." }
    if (/not found/i.test(error.message)) return { error: "One of the selected products no longer exists. Refresh the page and try again." }
    if (/no longer available/i.test(error.message)) return { error: "One of the selected sizes was removed from its product. Refresh the page and pick another size." }
    if (/A size must be chosen/i.test(error.message)) return { error: "Pick a size for every product." }
    return { error: "Couldn't create the order. Nothing was saved. Try again." }
  }

  const orderId: string = data.order_id
  if (Number(data.total) < 0) {
    // A discount bigger than the order would leave a negative total: undo it instead of recording nonsense.
    await supabaseAdmin.rpc("cancel_order", { p_order_id: orderId, p_reason: "admin" })
    return { error: "The discount is bigger than the order total." }
  }

  const now = new Date().toISOString()
  const { error: updateError } = await supabaseAdmin
    .from("orders")
    .update({
      status: "confirmed",
      confirmed_at: createdAt ?? now,
      payment_status: body.paid ? "paid" : "pending",
      internal_notes: [MANUAL_ORDER_NOTE, body.notes].filter(Boolean).join("\n"),
      ...(createdAt ? { created_at: createdAt } : {}),
    })
    .eq("id", orderId)
  if (updateError) {
    // The order and its stock deduction exist; only the status flags failed. Say so rather than hide it.
    console.error("Manual order: created but could not finalise:", updateError)
    redirect(`/admin/orders/${orderId}`)
  }

  revalidatePath("/admin/orders")
  redirect(`/admin/orders/${orderId}`)
}
