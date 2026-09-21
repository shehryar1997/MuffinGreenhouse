import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { checkRateLimit } from "@/lib/rate-limit"
import { supabaseAdmin } from "@/supabase/admin-client"
import { WELCOME_COUPON_AMOUNT, createOwnedCoupon } from "@/lib/referrals"
import { sendWelcomeCouponEmail } from "@/lib/email/send-growth-emails"

const schema = z.object({ email: z.string().trim().toLowerCase().email().max(254) })

// Newsletter sign-up. The first time an address signs up it gets a single-use welcome coupon for its first order.
export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request)
  if (limited) return limited

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })
  const { email } = parsed.data

  const { data: row, error } = await supabaseAdmin.from("newsletter_subscribers").insert({ email }).select("id").single()
  if (error) {
    // Unique violation: this address signed up before, so no second coupon.
    if (error.code === "23505") return NextResponse.json({ already: true })
    console.error("Newsletter sign-up failed:", error)
    return NextResponse.json({ error: "Couldn't sign you up right now. Please try again." }, { status: 500 })
  }

  const code = await createOwnedCoupon(email, WELCOME_COUPON_AMOUNT, "welcome")
  if (code) {
    await supabaseAdmin.from("newsletter_subscribers").update({ welcome_coupon_code: code }).eq("id", row.id)
    try {
      await sendWelcomeCouponEmail({ toEmail: email, code, amount: WELCOME_COUPON_AMOUNT })
    } catch (err) {
      console.error("Failed to send welcome coupon e-mail:", err)
    }
  }
  return NextResponse.json({ code, amount: WELCOME_COUPON_AMOUNT })
}
