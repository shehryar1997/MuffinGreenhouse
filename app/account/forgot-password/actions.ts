"use server"

import { supabaseAdmin } from "@/supabase/admin-client"
import { sendOtpEmail } from "@/lib/email/send-otp-email"
import { allowHit, callerIp } from "@/lib/db-rate-limit"
import { checkOtp, issueOtp } from "@/lib/otp"

export interface ResetResult {
  success: boolean
  error?: string
  canResendAt?: string
}

const normalise = (email: string) => email.trim().toLowerCase()
const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

/**
 * Step 1: e-mail a 6-digit reset code. Always answers "success" for a well-formed address whether or
 * not an account exists, so this form can't be used to find out who has an account.
 */
export async function requestPasswordReset(rawEmail: string): Promise<ResetResult> {
  const email = normalise(rawEmail)
  if (!validEmail(email)) return { success: false, error: "Please enter a valid email address" }

  const ip = await callerIp()
  if (!(await allowHit(`reset-ip:${ip}`, 8, 60 * 60)) || !(await allowHit(`reset-email:${email}`, 4, 60 * 60))) {
    return { success: false, error: "Too many requests. Please try again in a little while." }
  }

  const canResendAt = new Date(Date.now() + 30_000).toISOString()

  try {
    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select("id, auth_id")
      .eq("email", email)
      .maybeSingle()

    // Guest-only customers (no login yet) have nothing to reset; stay silent.
    if (customer?.auth_id) {
      const issued = await issueOtp(customer.id, "reset")
      if (issued.ok) {
        await sendOtpEmail(email, issued.code, "reset")
        return { success: true, canResendAt: issued.canResendAt }
      }
      // Cooldown/hourly cap: say the same thing, the earlier code is still valid.
    }
  } catch (error) {
    console.error("Password reset request failed:", error)
    return { success: false, error: "We couldn't send the code right now. Please try again." }
  }

  return { success: true, canResendAt }
}

/** Step 2: check the code and set the new password. Proves e-mail ownership, so it also verifies the account. */
export async function resetPassword(rawEmail: string, code: string, newPassword: string): Promise<ResetResult> {
  const email = normalise(rawEmail)
  if (!validEmail(email)) return { success: false, error: "Please enter a valid email address" }
  if (!/^\d{6}$/.test(code)) return { success: false, error: "Please enter the 6-digit code from your e-mail" }
  if (newPassword.length < 8) return { success: false, error: "Password must be at least 8 characters" }
  if (newPassword.length > 72) return { success: false, error: "Password must be at most 72 characters" }

  const ip = await callerIp()
  if (!(await allowHit(`reset-verify-ip:${ip}`, 30, 60 * 60))) {
    return { success: false, error: "Too many attempts. Please try again in a little while." }
  }

  const WRONG = "That code isn't right or has expired. Check it, or request a new one."

  try {
    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select("id, auth_id")
      .eq("email", email)
      .maybeSingle()
    if (!customer?.auth_id) return { success: false, error: WRONG }

    const result = await checkOtp(customer.id, "reset", code)
    if (!result.ok) {
      if (result.reason === "locked") return { success: false, error: "Too many wrong codes. Please request a new one." }
      if (result.reason === "wrong") {
        return { success: false, error: `That code doesn't match. ${result.remaining} attempt${result.remaining === 1 ? "" : "s"} remaining.` }
      }
      return { success: false, error: WRONG }
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(customer.auth_id, {
      password: newPassword,
      email_confirm: true,
    })
    if (error) {
      console.error("Password reset failed:", error)
      return { success: false, error: "We couldn't update your password. Please try again." }
    }
    await supabaseAdmin.from("customers").update({ email_verified: true }).eq("id", customer.id)

    return { success: true }
  } catch (error) {
    console.error("Password reset failed:", error)
    return { success: false, error: "We couldn't update your password. Please try again." }
  }
}
