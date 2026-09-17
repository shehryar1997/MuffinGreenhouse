"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/supabase/admin-client"
import { createServerClient } from "@/lib/supabase/server-client"

export interface LoginResult {
  success: boolean
  error?: string
}

export async function loginWithPassword(
  emailOrPhone: string,
  password: string
): Promise<LoginResult> {
  if (!emailOrPhone.trim()) {
    return { success: false, error: "Incorrect email/phone or password" }
  }
  if (!password) {
    return { success: false, error: "Incorrect email/phone or password" }
  }

  let email: string

  // Detect if input is email (@ present) or phone number
  if (emailOrPhone.includes("@")) {
    email = emailOrPhone.trim().toLowerCase()
  } else {
    // It's a phone number - look up the matching customer to get their email
    const phone = emailOrPhone.trim()
    const { data: customer, error: lookupError } = await supabaseAdmin
      .from("customers")
      .select("email")
      .eq("phone", phone)
      .single()

    if (lookupError || !customer) {
      // ponytail: Same generic error whether phone not found or password wrong
      return { success: false, error: "Incorrect email/phone or password" }
    }

    email = customer.email
  }

  // Sign in with Supabase Auth using the resolved email
  const cookieStore = await cookies()
  const supabase = createServerClient(cookieStore)

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, error: "Incorrect email/phone or password" }
  }

  // Success - redirect to account page
  redirect("/account")
}
