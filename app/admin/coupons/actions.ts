"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/supabase/admin-client"
import { requireAdmin } from "@/lib/admin-auth"
import { normalizeCouponCode } from "@/lib/coupons"
import { fromKarachiInputValue } from "@/lib/event-format"
import { BAD_BULK_REQUEST, cleanBulkIds, type BulkDeleteResult } from "@/lib/admin-bulk"

/** `undefined` = success. */
export type CouponActionResult = { error: string } | undefined

export async function createCoupon(formData: FormData): Promise<CouponActionResult> {
  await requireAdmin()
  const code = normalizeCouponCode(String(formData.get("code") ?? ""))
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return { error: "The code must be 3-30 letters, numbers, dashes or underscores, with no spaces." }

  const percent = Number(formData.get("discount_percent"))
  if (!Number.isFinite(percent) || percent <= 0 || percent > 100) return { error: "The discount must be a percentage between 0 and 100." }

  const capRaw = String(formData.get("max_discount") ?? "").trim()
  const cap = capRaw === "" ? null : Number(capRaw)
  if (cap !== null && (!Number.isFinite(cap) || cap <= 0)) return { error: "The discount cap must be an amount above 0, or left empty for no cap." }

  const usesRaw = String(formData.get("max_uses") ?? "").trim()
  const maxUses = usesRaw === "" ? null : Number(usesRaw)
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) return { error: "The usage limit must be a whole number above 0, or left empty for unlimited." }

  // A date means "valid through the end of that day" in Karachi time.
  const expiryRaw = String(formData.get("expires_on") ?? "").trim()
  const expiresAt = expiryRaw === "" ? null : fromKarachiInputValue(`${expiryRaw}T23:59`)
  if (expiryRaw !== "" && !expiresAt) return { error: "The expiry date isn't valid." }
  if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) return { error: "The expiry date is in the past." }

  const { error } = await supabaseAdmin
    .from("coupons")
    .insert({ code, discount_percent: percent, max_discount: cap, max_uses: maxUses, expires_at: expiresAt, is_active: formData.get("is_active") === "on" })
  if (error) return { error: error.code === "23505" ? "That coupon code already exists." : error.message }

  revalidatePath("/admin/coupons")
}

export async function deleteCoupon(couponId: string): Promise<CouponActionResult> {
  await requireAdmin()
  const { error } = await supabaseAdmin.from("coupons").delete().eq("id", couponId)
  if (error) return { error: error.message }
  revalidatePath("/admin/coupons")
}

export async function deleteCoupons(ids: string[]): Promise<BulkDeleteResult> {
  await requireAdmin()
  const clean = cleanBulkIds(ids)
  if (!clean) return BAD_BULK_REQUEST

  const { data, error } = await supabaseAdmin.from("coupons").delete().in("id", clean).select("id")
  if (error) return { deleted: 0, failures: [], error: error.message }
  revalidatePath("/admin/coupons")
  return { deleted: data?.length ?? 0, failures: [] }
}

export async function setCouponActive(couponId: string, isActive: boolean): Promise<CouponActionResult> {
  await requireAdmin()
  const { error } = await supabaseAdmin.from("coupons").update({ is_active: isActive }).eq("id", couponId)
  if (error) return { error: error.message }
  revalidatePath("/admin/coupons")
}
