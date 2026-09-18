"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/supabase/admin-client"
import { createServerClient } from "@/lib/supabase/server-client"

export interface LoginResult {
  success: boolean
  error?: string
}

// Resolves an email-or-phone input to the account's email, with no sign-in
// or redirect side effects. Used by any client component (e.g. checkout's
// inline sign-in) that needs to call supabase.auth.signInWithPassword
// itself from the browser client rather than the server-redirecting flow
// below. Looking up a customer by phone requires the service-role client,
// which is why this has to be a server action rather than done client-side.
export async function resolveEmailOrPhone(emailOrPhone: string): Promise<string | null> {
  if (!emailOrPhone.trim()) return null
  if (emailOrPhone.includes("@")) return emailOrPhone.trim().toLowerCase()

  const { data: customer, error } = await supabaseAdmin
    .from("customers")
    .select("email")
    .eq("phone", emailOrPhone.trim())
    .single()

  if (error || !customer) return null
  return customer.email
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

export async function loginWithPassword(
  emailOrPhone: string,
  password: string,
  returnTo?: string | null
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

  // Success - redirect back to where the user started (e.g. /checkout), or
  // the account page by default.
  redirect(safeReturnTo(returnTo))
}
