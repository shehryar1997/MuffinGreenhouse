"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/supabase/admin-client"
import { sendOtpEmail } from "@/lib/email/send-otp-email"
import { createServerClient } from "@/lib/supabase/server-client"
import { pakistanCities } from "@/data/pakistan-cities"

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
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validatePakistaniPhone(phone: string): boolean {
  const phoneRegex = /^03\d{9}$/
  return phoneRegex.test(phone)
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function getProvince(cityName: string): string {
  const city = pakistanCities.find((c) => c.name === cityName)
  return city?.province || ""
}

export async function verifyOTP(
  customerId: string,
  code: string
): Promise<ActionResult> {
  if (!customerId || !code) {
    return { success: false, error: "Invalid verification request" }
  }

  if (code.length !== 6 || !/^\d{6}$/.test(code)) {
    return { success: false, error: "Please enter a valid 6-digit code" }
  }

  try {
    const { data: customer, error: fetchError } = await supabaseAdmin
      .from("customers")
      .select("otp_code, otp_expires_at, otp_attempts")
      .eq("id", customerId)
      .single()

    if (fetchError || !customer) {
      return { success: false, error: "Customer not found" }
    }

    if (!customer.otp_code || !customer.otp_expires_at) {
      return { success: false, error: "No verification pending" }
    }

    if (customer.otp_attempts >= 5) {
      return {
        success: false,
        error: "Too many failed attempts. Please request a new code.",
        attempts: customer.otp_attempts,
      }
    }

    const expiresAt = new Date(customer.otp_expires_at)
    if (expiresAt < new Date()) {
      return { success: false, error: "Code has expired. Please request a new code." }
    }

    if (customer.otp_code !== code) {
      const newAttempts = (customer.otp_attempts || 0) + 1
      const remaining = 5 - newAttempts

      await supabaseAdmin
        .from("customers")
        .update({ otp_attempts: newAttempts })
        .eq("id", customerId)

      if (newAttempts >= 5) {
        return {
          success: false,
          error: "Too many failed attempts. Please request a new code.",
          attempts: newAttempts,
        }
      }

      return {
        success: false,
        error: `That code doesn't match — check it and try again. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
        attempts: newAttempts,
      }
    }

    await supabaseAdmin
      .from("customers")
      .update({
        email_verified: true,
        otp_code: null,
        otp_expires_at: null,
        otp_attempts: 0,
        otp_last_sent_at: null,
      })
      .eq("id", customerId)

    return { success: true }
  } catch (error) {
    console.error("Verification error:", error)
    return { success: false, error: "Verification failed" }
  }
}

export async function signInAfterVerification(
  email: string,
  password: string
): Promise<ActionResult> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(cookieStore)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/account")
    return { success: true }
  } catch (error) {
    console.error("Sign in error:", error)
    return { success: false, error: "Failed to sign in" }
  }
}

export async function resendOTP(
  customerId: string
): Promise<ActionResult> {
  if (!customerId) {
    return { success: false, error: "Invalid request" }
  }

  try {
    const { data: customer, error: fetchError } = await supabaseAdmin
      .from("customers")
      .select("otp_last_sent_at, email")
      .eq("id", customerId)
      .single()

    if (fetchError || !customer) {
      return { success: false, error: "Customer not found" }
    }

    if (customer.otp_last_sent_at) {
      const lastSent = new Date(customer.otp_last_sent_at)
      const secondsSinceLastSent = (Date.now() - lastSent.getTime()) / 1000
      if (secondsSinceLastSent < 30) {
        const remaining = Math.ceil(30 - secondsSinceLastSent)
        return { success: false, error: `Please wait ${remaining}s before requesting a new code` }
      }
    }

    const otpCode = generateOTP()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000)
    const canResendAt = new Date(now.getTime() + 30 * 1000)

    await supabaseAdmin
      .from("customers")
      .update({
        otp_code: otpCode,
        otp_expires_at: expiresAt.toISOString(),
        otp_attempts: 0,
        otp_last_sent_at: now.toISOString(),
      })
      .eq("id", customerId)

    await sendOtpEmail(customer.email, otpCode)

    return {
      success: true,
      expiresAt: expiresAt.toISOString(),
      canResendAt: canResendAt.toISOString(),
    }
  } catch (error) {
    console.error("Resend OTP error:", error)
    return { success: false, error: "Failed to resend code" }
  }
}

export async function registerCustomer(
  formData: RegisterFormData
): Promise<ActionResult> {
  if (!formData.name.trim()) {
    return { success: false, error: "Name is required" }
  }
  if (!formData.email.trim()) {
    return { success: false, error: "Email is required" }
  }
  if (!validateEmail(formData.email)) {
    return { success: false, error: "Please enter a valid email address" }
  }
  if (formData.password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" }
  }
  if (!formData.phone.trim()) {
    return { success: false, error: "Phone number is required" }
  }
  if (!validatePakistaniPhone(formData.phone)) {
    return { success: false, error: "Phone must be 11 digits starting with 03 (e.g., 03001234567)" }
  }
  if (!formData.street.trim()) {
    return { success: false, error: "Street address is required" }
  }
  if (!formData.city.trim()) {
    return { success: false, error: "City is required" }
  }

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: formData.email,
      password: formData.password,
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes("already exists")) {
        return { success: false, error: "An account with this email already exists" }
      }
      throw authError
    }

    const authId = authData.user?.id
    if (!authId) {
      return { success: false, error: "Failed to create user account" }
    }

    const { data: customerData, error: customerError } = await supabaseAdmin
      .from("customers")
      .insert({
        auth_id: authId,
        email: formData.email.toLowerCase(),
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email_verified: false,
      })
      .select("id")
      .single()

    if (customerError) {
      await supabaseAdmin.auth.admin.deleteUser(authId)
      throw customerError
    }

    const customerId = customerData.id
    const province = getProvince(formData.city)

    const { error: addressError } = await supabaseAdmin.from("addresses").insert({
      customer_id: customerId,
      label: "Home",
      street: formData.street.trim(),
      city: formData.city,
      province: province || "",
      is_default: true,
    })

    if (addressError) {
      await supabaseAdmin.from("customers").delete().eq("id", customerId)
      await supabaseAdmin.auth.admin.deleteUser(authId)
      throw addressError
    }

    const otpCode = generateOTP()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000)
    const canResendAt = new Date(now.getTime() + 30 * 1000)

    await supabaseAdmin.from("customers").update({
      otp_code: otpCode,
      otp_expires_at: expiresAt.toISOString(),
      otp_attempts: 0,
      otp_last_sent_at: now.toISOString(),
    }).eq("id", customerId)

    await sendOtpEmail(formData.email, otpCode)

    return {
      success: true,
      customerId,
      attempts: 0,
      expiresAt: expiresAt.toISOString(),
      canResendAt: canResendAt.toISOString(),
    }
  } catch (error) {
    console.error("Registration error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Registration failed" }
  }
}
