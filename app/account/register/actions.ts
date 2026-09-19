"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/supabase/admin-client"
import { sendOtpEmail } from "@/lib/email/send-otp-email"
import { createServerClient } from "@/lib/supabase/server-client"
import { pakistanCities } from "@/data/pakistan-cities"
import { allowHit, callerIp } from "@/lib/db-rate-limit"
import { checkOtp, issueOtp, OTP_MAX_ATTEMPTS } from "@/lib/otp"

export interface RegisterFormData {
  name: string
  email: string
  password: string
  phone: string
  street: string
  city: string
}

export interface ActionResult {
  success: boolean
  error?: string
  customerId?: string
  attempts?: number
  expiresAt?: string
  canResendAt?: string
  /** signInAfterVerification: the account exists but its e-mail hasn't been verified yet. */
  needsVerification?: boolean
}

interface PendingProfile {
  name: string
  phone: string
  street: string
  city: string
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validatePakistaniPhone(phone: string): boolean {
  return /^03\d{9}$/.test(phone)
}

function getProvince(cityName: string): string {
  return pakistanCities.find((c) => c.name === cityName)?.province || ""
}

async function insertDefaultAddress(customerId: string, profile: Pick<PendingProfile, "street" | "city">) {
  return supabaseAdmin.from("addresses").insert({
    customer_id: customerId,
    label: "Home",
    street: profile.street,
    city: profile.city,
    province: getProvince(profile.city) || "",
    is_default: true,
  })
}

export async function verifyOTP(customerId: string, code: string): Promise<ActionResult> {
  if (!customerId || !code) {
    return { success: false, error: "Invalid verification request" }
  }
  if (!/^\d{6}$/.test(code)) {
    return { success: false, error: "Please enter a valid 6-digit code" }
  }

  try {
    const result = await checkOtp(customerId, "verify", code)

    if (!result.ok) {
      switch (result.reason) {
        case "none":
          return { success: false, error: "No verification pending. Request a new code." }
        case "expired":
          return { success: false, error: "Code has expired. Please request a new code." }
        case "locked":
          return { success: false, error: "Too many failed attempts. Please request a new code.", attempts: OTP_MAX_ATTEMPTS }
        default:
          return {
            success: false,
            error: `That code doesn't match. Check it and try again. ${result.remaining} attempt${result.remaining === 1 ? "" : "s"} remaining.`,
            attempts: result.attempts,
          }
      }
    }

    const { data: customer, error: fetchError } = await supabaseAdmin
      .from("customers")
      .select("id, auth_id")
      .eq("id", customerId)
      .single()
    if (fetchError || !customer) return { success: false, error: "Customer not found" }

    let authId = customer.auth_id as string | null

    if (result.pendingAuthId) {
      // The e-mail already belonged to a guest-order customer. Now that the owner has proven it,
      // the new login is attached to that record so their order history follows them.
      const profile = result.pendingProfile as PendingProfile | null
      const { error: linkError } = await supabaseAdmin
        .from("customers")
        .update({
          auth_id: result.pendingAuthId,
          email_verified: true,
          ...(profile?.name ? { name: profile.name } : {}),
          ...(profile?.phone ? { phone: profile.phone } : {}),
        })
        .eq("id", customerId)
      if (linkError) {
        console.error("Linking auth user to existing customer failed:", linkError)
        return { success: false, error: "Verification failed. Please try again." }
      }
      authId = result.pendingAuthId
      if (profile?.street && profile?.city) {
        const { count } = await supabaseAdmin.from("addresses").select("id", { count: "exact", head: true }).eq("customer_id", customerId)
        if (!count) await insertDefaultAddress(customerId, profile)
      }
    } else {
      await supabaseAdmin.from("customers").update({ email_verified: true }).eq("id", customerId)
    }

    // Sign-in stays blocked by Supabase until this flips, so a password alone never gets an unverified account in.
    if (authId) {
      const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(authId, { email_confirm: true })
      if (confirmError) {
        console.error("Confirming auth user failed:", confirmError)
        return { success: false, error: "Verification failed. Please try again." }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Verification error:", error)
    return { success: false, error: "Verification failed" }
  }
}

export async function signInAfterVerification(email: string, password: string): Promise<ActionResult> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(cookieStore)

    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })

    if (error) {
      return { success: false, error: "Couldn't sign you in automatically. Please sign in with your new password." }
    }

    revalidatePath("/account")
    return { success: true }
  } catch (error) {
    console.error("Sign in error:", error)
    return { success: false, error: "Failed to sign in" }
  }
}

export async function resendOTP(customerId: string): Promise<ActionResult> {
  if (!customerId) {
    return { success: false, error: "Invalid request" }
  }

  try {
    const ip = await callerIp()
    if (!(await allowHit(`otp-resend-ip:${ip}`, 10, 60 * 60))) {
      return { success: false, error: "Too many requests. Please try again later." }
    }

    const { data: customer, error: fetchError } = await supabaseAdmin
      .from("customers")
      .select("email, email_verified")
      .eq("id", customerId)
      .single()

    if (fetchError || !customer) {
      return { success: false, error: "Customer not found" }
    }
    if (customer.email_verified) {
      return { success: false, error: "This e-mail is already verified. Please sign in." }
    }

    // issueOtp enforces the 30-second cooldown and the 5-per-hour cap.
    const issued = await issueOtp(customerId, "verify")
    if (!issued.ok) return { success: false, error: issued.error }

    await sendOtpEmail(customer.email, issued.code, "verify")

    return { success: true, expiresAt: issued.expiresAt, canResendAt: issued.canResendAt }
  } catch (error) {
    console.error("Resend OTP error:", error)
    return { success: false, error: "Failed to resend code" }
  }
}

export async function registerCustomer(formData: RegisterFormData): Promise<ActionResult> {
  const name = formData.name.trim()
  const email = formData.email.trim().toLowerCase()
  const phone = formData.phone.trim()
  const street = formData.street.trim()

  if (!name) return { success: false, error: "Name is required" }
  if (!email) return { success: false, error: "Email is required" }
  if (!validateEmail(email)) return { success: false, error: "Please enter a valid email address" }
  if (formData.password.length < 8) return { success: false, error: "Password must be at least 8 characters" }
  if (formData.password.length > 72) return { success: false, error: "Password must be at most 72 characters" }
  if (!phone) return { success: false, error: "Phone number is required" }
  if (!validatePakistaniPhone(phone)) return { success: false, error: "Phone must be 11 digits starting with 03 (e.g., 03001234567)" }
  if (!street) return { success: false, error: "Street address is required" }
  if (!formData.city.trim()) return { success: false, error: "City is required" }

  // Sign-up sends an e-mail, so cap it per network address and per e-mail address.
  const ip = await callerIp()
  if (!(await allowHit(`signup-ip:${ip}`, 5, 60 * 60)) || !(await allowHit(`signup-email:${email}`, 3, 60 * 60))) {
    return { success: false, error: "Too many sign-up attempts. Please try again in a little while." }
  }

  const profile: PendingProfile = { name, phone, street, city: formData.city }

  try {
    const { data: existing } = await supabaseAdmin
      .from("customers")
      .select("id, auth_id, email_verified")
      .eq("email", email)
      .maybeSingle()

    // 1. A verified account already exists.
    if (existing?.auth_id && existing.email_verified) {
      return { success: false, error: "An account with this email already exists. Try signing in, or use “Forgot password”." }
    }

    let customerId: string
    let pendingAuthId: string | undefined

    if (existing?.auth_id) {
      // 2. Sign-up was started earlier but never verified: resume it with the details just entered.
      customerId = existing.id
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existing.auth_id, {
        password: formData.password,
        email_confirm: false,
      })
      if (updateError) throw updateError
      await supabaseAdmin.from("customers").update({ name, phone }).eq("id", customerId)
    } else {
      // Sign-in stays blocked until the OTP is entered: the user is created UNCONFIRMED.
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: formData.password,
        email_confirm: false,
      })
      let authId = authData?.user?.id
      if (authError) {
        if (!/already (been )?registered|already exists/i.test(authError.message)) throw authError
        // A guest-order customer who started (but never finished) an earlier sign-up: reuse that
        // still-unverified login instead of dead-ending on "already exists".
        const { data: earlier } = existing && !existing.auth_id
          ? await supabaseAdmin.from("customer_otps").select("pending_auth_id").eq("customer_id", existing.id).eq("purpose", "verify").maybeSingle()
          : { data: null }
        if (!earlier?.pending_auth_id) {
          return { success: false, error: "An account with this email already exists. Try signing in, or use “Forgot password”." }
        }
        const { error: reuseError } = await supabaseAdmin.auth.admin.updateUserById(earlier.pending_auth_id as string, {
          password: formData.password,
          email_confirm: false,
        })
        if (reuseError) throw reuseError
        authId = earlier.pending_auth_id as string
      }
      if (!authId) return { success: false, error: "Failed to create user account" }

      if (existing) {
        // 3. The e-mail already has a customer record from a guest order. Don't touch it until the
        //    owner proves the address with the code (see verifyOTP).
        customerId = existing.id
        pendingAuthId = authId
      } else {
        // 4. Brand-new customer.
        const { data: customerData, error: customerError } = await supabaseAdmin
          .from("customers")
          .insert({ auth_id: authId, email, name, phone, email_verified: false })
          .select("id")
          .single()
        if (customerError) {
          await supabaseAdmin.auth.admin.deleteUser(authId)
          throw customerError
        }
        customerId = customerData.id

        const { error: addressError } = await insertDefaultAddress(customerId, profile)
        if (addressError) {
          await supabaseAdmin.from("customers").delete().eq("id", customerId)
          await supabaseAdmin.auth.admin.deleteUser(authId)
          throw addressError
        }
      }
    }

    const issued = await issueOtp(customerId, "verify", pendingAuthId ? { authId: pendingAuthId, profile: { ...profile } } : undefined)
    if (!issued.ok) return { success: false, error: issued.error }

    await sendOtpEmail(email, issued.code, "verify")

    return {
      success: true,
      customerId,
      attempts: 0,
      expiresAt: issued.expiresAt,
      canResendAt: issued.canResendAt,
    }
  } catch (error) {
    console.error("Registration error:", error)
    return { success: false, error: "We couldn't create your account. Please try again in a moment." }
  }
}
