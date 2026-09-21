import { supabaseAdmin } from "@/supabase/admin-client"
import { REFERRAL_FRIEND_DISCOUNT } from "@/lib/referrals"

export interface CouponItem {
  productId: string
  variantId?: string | null
  quantity: number
}

export type CouponResult =
  | { ok: true; code: string; source: "coupon" | "referral"; discount: number }
  | { ok: false; error: string }

export const normalizeCouponCode = (code: string) => code.trim().toUpperCase()

/** Cart subtotal from database prices (the browser's prices are never trusted). */
export async function dbSubtotal(items: CouponItem[]): Promise<number> {
  const productIds = [...new Set(items.map((i) => i.productId))]
  const variantIds = [...new Set(items.flatMap((i) => (i.variantId ? [i.variantId] : [])))]
  const [products, variants] = await Promise.all([
    supabaseAdmin.from("products").select("id, price").in("id", productIds),
    variantIds.length ? supabaseAdmin.from("product_variants").select("id, price").in("id", variantIds) : Promise.resolve({ data: [] as { id: string; price: number }[] }),
  ])
  const productPrice = new Map((products.data ?? []).map((p) => [p.id, Number(p.price)]))
  const variantPrice = new Map((variants.data ?? []).map((v) => [v.id, Number(v.price)]))
  return items.reduce((sum, i) => sum + i.quantity * ((i.variantId ? variantPrice.get(i.variantId) : productPrice.get(i.productId)) ?? 0), 0)
}

/** True when this e-mail already has a real (not cancelled) order: welcome and friend codes are first-order only. */
async function hasPriorOrder(email: string): Promise<boolean> {
  const { data: customer } = await supabaseAdmin.from("customers").select("id").eq("email", email).maybeSingle()
  if (!customer) return false
  const { count } = await supabaseAdmin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customer.id)
    .neq("status", "cancelled")
  return (count ?? 0) > 0
}

const capDiscount = (amount: number, subtotal: number) => Math.max(0, Math.min(Math.round(amount), subtotal))

/**
 * Validates a code and works out the discount on the items' subtotal (delivery is never discounted).
 * Accepts admin coupons, customer-owned coupons (welcome / referral rewards) and a customer's personal referral code.
 * `email` is the checkout e-mail: needed for owner-locked coupons and first-order rules.
 */
export async function resolveCoupon(rawCode: string, items: CouponItem[], rawEmail?: string | null): Promise<CouponResult> {
  const code = normalizeCouponCode(rawCode)
  if (!code) return { ok: false, error: "Enter a coupon code." }
  const email = (rawEmail ?? "").trim().toLowerCase() || null
  const needEmail = { ok: false, error: "Enter your email address first, then apply this code." } as const

  const { data: coupon, error } = await supabaseAdmin
    .from("coupons")
    .select("code, discount_percent, fixed_amount, max_discount, max_uses, times_used, expires_at, is_active, owner_email, kind")
    .eq("code", code) // codes are always stored upper-case
    .maybeSingle()
  if (error) {
    console.error("Coupon lookup failed:", error)
    return { ok: false, error: "Couldn't check the coupon right now. Please try again." }
  }

  if (coupon) {
    if (!coupon.is_active) return { ok: false, error: "This coupon code isn't valid." }
    if (coupon.expires_at && new Date(coupon.expires_at).getTime() <= Date.now()) return { ok: false, error: "This coupon has expired." }
    if (coupon.max_uses != null && coupon.times_used >= coupon.max_uses) return { ok: false, error: "This coupon has been fully redeemed." }
    if (coupon.owner_email) {
      if (!email) return needEmail
      if (coupon.owner_email.toLowerCase() !== email) return { ok: false, error: "This coupon belongs to a different email address." }
    }
    if (coupon.kind === "welcome") {
      if (!email) return needEmail
      if (await hasPriorOrder(email)) return { ok: false, error: "The welcome coupon is for first orders only." }
    }

    const subtotal = await dbSubtotal(items)
    let discount = coupon.fixed_amount != null ? Number(coupon.fixed_amount) : Math.round((subtotal * Number(coupon.discount_percent)) / 100)
    if (coupon.max_discount != null) discount = Math.min(discount, Number(coupon.max_discount))
    return { ok: true, code: coupon.code, source: "coupon", discount: capDiscount(discount, subtotal) }
  }

  // Not a coupon: maybe a customer's personal referral code (a friend's first order).
  const { data: referrer } = await supabaseAdmin.from("customers").select("id, email").eq("referral_code", code).maybeSingle()
  if (!referrer) return { ok: false, error: "This coupon code isn't valid." }
  if (!email) return needEmail
  if (referrer.email.toLowerCase() === email) return { ok: false, error: "You can't use your own referral code." }
  if (await hasPriorOrder(email)) return { ok: false, error: "Referral codes are for a friend's first order only." }

  const subtotal = await dbSubtotal(items)
  return { ok: true, code, source: "referral", discount: capDiscount(REFERRAL_FRIEND_DISCOUNT, subtotal) }
}
