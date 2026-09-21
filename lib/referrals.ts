// SERVER-ONLY. Referral and reward-coupon rules in one place.
//
//  A) Code sharing: every customer has a personal code. A friend who types it at checkout on their first order
//     gets REFERRAL_FRIEND_DISCOUNT off; when that order is paid, the code's owner gets a REFERRER_CODE_REWARD coupon.
//  B) Refer by e-mail: a customer names a friend's e-mail. When an order from that e-mail is paid and its items come
//     to more than REFERRAL_MIN_ORDER, the referrer gets a REFERRER_EMAIL_REWARD coupon.
// Rewards are single-use coupons locked to the referrer's e-mail. At most one reward is paid per order.
import { randomInt } from "node:crypto"
import { supabaseAdmin } from "@/supabase/admin-client"
import { isPlaceholderEmail } from "@/lib/manual-order"
import { sendReferralRewardEmail } from "@/lib/email/send-growth-emails"

export const REFERRAL_FRIEND_DISCOUNT = 300
export const REFERRER_CODE_REWARD = 500
export const REFERRER_EMAIL_REWARD = 700
export const REFERRAL_MIN_ORDER = 2000
export const WELCOME_COUPON_AMOUNT = 300

// No 0/O/1/I: codes get read out and typed by hand.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
export const randomToken = (length: number) => Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join("")

const isUniqueViolation = (error: { code?: string } | null) => error?.code === "23505"

/** The customer's personal referral code, created on first use. */
export async function getOrCreateReferralCode(customerId: string): Promise<string | null> {
  const { data: existing } = await supabaseAdmin.from("customers").select("referral_code").eq("id", customerId).maybeSingle()
  if (existing?.referral_code) return existing.referral_code

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = `MG-${randomToken(6)}`
    const { error } = await supabaseAdmin.from("customers").update({ referral_code: code }).eq("id", customerId).is("referral_code", null)
    if (!error) {
      const { data } = await supabaseAdmin.from("customers").select("referral_code").eq("id", customerId).maybeSingle()
      return data?.referral_code ?? null
    }
    if (!isUniqueViolation(error)) {
      console.error("Could not save referral code:", error)
      return null
    }
  }
  return null
}

/** Inserts a single-use fixed-amount coupon that only `ownerEmail` can redeem. Returns its code. */
export async function createOwnedCoupon(
  ownerEmail: string,
  amount: number,
  kind: "welcome" | "referral_reward",
  presetCode?: string
): Promise<string | null> {
  const prefix = kind === "welcome" ? "WELCOME" : "THANKS"
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = presetCode ?? `${prefix}-${randomToken(6)}`
    const { error } = await supabaseAdmin
      .from("coupons")
      .insert({ code, fixed_amount: amount, owner_email: ownerEmail.toLowerCase(), kind, max_uses: 1, is_active: true })
    if (!error) return code
    if (!isUniqueViolation(error) || presetCode) {
      console.error("Could not create coupon:", error)
      return null
    }
  }
  return null
}

interface OrderForReward {
  id: string
  subtotal: number
  discount_amount: number | null
  coupon_code: string | null
  customer: { id: string; email: string; name: string | null } | null
}

/** Called when an order is marked paid. Safe to call twice: the unique order_id blocks a second reward. */
export async function grantReferralRewards(orderId: string): Promise<void> {
  const { data } = await supabaseAdmin
    .from("orders")
    .select("id, subtotal, discount_amount, coupon_code, customer:customers(id, email, name)")
    .eq("id", orderId)
    .maybeSingle()
  const order = data as unknown as OrderForReward | null
  const buyer = order?.customer
  if (!order || !buyer) return

  const { data: already } = await supabaseAdmin.from("referral_rewards").select("id").eq("order_id", orderId).maybeSingle()
  if (already) return

  let referrer: { id: string; email: string; name: string | null } | null = null
  let kind: "code" | "email" = "code"
  let referralRowId: string | null = null

  if (order.coupon_code) {
    const { data: owner } = await supabaseAdmin.from("customers").select("id, email, name").eq("referral_code", order.coupon_code).maybeSingle()
    if (owner && owner.id !== buyer.id && owner.email.toLowerCase() !== buyer.email.toLowerCase()) referrer = owner
  }

  if (!referrer) {
    const itemsPaidFor = Number(order.subtotal) - Number(order.discount_amount ?? 0)
    if (itemsPaidFor > REFERRAL_MIN_ORDER) {
      const { data: rows } = await supabaseAdmin
        .from("referrals")
        .select("id, referrer:customers!referrals_referrer_id_fkey(id, email, name)")
        .eq("referred_email", buyer.email.toLowerCase())
        .is("rewarded_at", null)
        .neq("referrer_id", buyer.id)
        .limit(1)
      const row = (rows ?? [])[0] as unknown as { id: string; referrer: { id: string; email: string; name: string | null } | null } | undefined
      if (row?.referrer) {
        referrer = row.referrer
        kind = "email"
        referralRowId = row.id
      }
    }
  }
  if (!referrer) return

  const amount = kind === "code" ? REFERRER_CODE_REWARD : REFERRER_EMAIL_REWARD
  const code = `THANKS-${randomToken(6)}`

  // Claim the order first (unique order_id), then create the coupon.
  const { error: claimError } = await supabaseAdmin
    .from("referral_rewards")
    .insert({ order_id: orderId, referrer_id: referrer.id, kind, coupon_code: code })
  if (claimError) {
    if (!isUniqueViolation(claimError)) console.error("Could not record referral reward:", claimError)
    return
  }
  const created = await createOwnedCoupon(referrer.email, amount, "referral_reward", code)
  if (!created) {
    await supabaseAdmin.from("referral_rewards").delete().eq("order_id", orderId)
    return
  }
  if (referralRowId) await supabaseAdmin.from("referrals").update({ rewarded_at: new Date().toISOString() }).eq("id", referralRowId)

  if (!isPlaceholderEmail(referrer.email)) {
    try {
      await sendReferralRewardEmail({ toEmail: referrer.email, name: referrer.name, code, amount })
    } catch (err) {
      console.error("Failed to send referral reward e-mail:", err)
    }
  }
}
