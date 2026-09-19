"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/supabase/admin-client"
import { createServerClient } from "@/lib/supabase/server-client"
import { sendOtpEmail } from "@/lib/email/send-otp-email"
import { allowHit, callerIp } from "@/lib/db-rate-limit"
import { issueOtp } from "@/lib/otp"

export interface LoginResult {
  success: boolean
  error?: string
  /** Correct password, but the e-mail was never verified: the UI shows the code entry step. */
  needsVerification?: boolean
  customerId?: string
  email?: string
  canResendAt?: string
}

// Only ever redirect to a path within this site. `returnTo` comes from a URL
// query param, which is attacker-controllable - without this check someone
// could craft a login link (e.g. ?returnTo=https://evil.example) that sends
// a signed-in user's session off-site.
function safeReturnTo(returnTo: string | null | undefined): string {
  if (!returnTo) return "/account"
  if (!returnTo.startsWith("/") || returnTo.startsWith("//")) return "/account"
  return returnTo
}

const GENERIC_ERROR = "Incorrect email/phone or password"

export async function loginWithPassword(
  emailOrPhone: string,
  password: string,
  returnTo?: string | null
): Promise<LoginResult> {
  if (!emailOrPhone.trim() || !password) {
    return { success: false, error: GENERIC_ERROR }
  }

  const ip = await callerIp()
  if (!(await allowHit(`login-ip:${ip}`, 30, 10 * 60))) {
    return { success: false, error: "Too many sign-in attempts. Please wait a few minutes and try again." }
  }

  let email: string

  // Detect if input is email (@ present) or phone number
  if (emailOrPhone.includes("@")) {
    email = emailOrPhone.trim().toLowerCase()
  } else {
    // It's a phone number - look up the matching customer to get their email
    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select("email")
      .eq("phone", emailOrPhone.trim())
      .not("auth_id", "is", null)
      .limit(1)
      .maybeSingle()

    if (!customer) {
      // Same generic error whether phone not found or password wrong
      return { success: false, error: GENERIC_ERROR }
    }
    email = customer.email
  }

  // Sign in with Supabase Auth using the resolved email
  const cookieStore = await cookies()
  const supabase = createServerClient(cookieStore)

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Supabase only reports "not confirmed" AFTER the password checked out, so this reveals nothing
    // to someone guessing. It means sign-up was never finished: send a fresh code and continue there.
    if (error.code === "email_not_confirmed") {
      const { data: customer } = await supabaseAdmin.from("customers").select("id").eq("email", email).maybeSingle()
      if (customer) {
        const issued = await issueOtp(customer.id, "verify")
        if (issued.ok) {
          try {
            await sendOtpEmail(email, issued.code, "verify")
          } catch (mailError) {
            console.error("Failed to send verification code at login:", mailError)
          }
          return { success: false, needsVerification: true, customerId: customer.id, email, canResendAt: issued.canResendAt }
        }
        // A code was sent moments ago: let them use it.
        return { success: false, needsVerification: true, customerId: customer.id, email }
      }
    }
    return { success: false, error: GENERIC_ERROR }
  }

  // Success - redirect back to where the user started (e.g. /checkout), or
  // the account page by default.
  redirect(safeReturnTo(returnTo))
}
