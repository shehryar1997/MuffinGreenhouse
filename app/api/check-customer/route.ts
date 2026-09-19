import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/supabase/admin-client"
import { checkRateLimit, RateLimiter } from "@/lib/rate-limit"

/**
 * CHECK CUSTOMER ENDPOINT
 *
 * Queries the customers table to check if an email is registered (has auth_id).
 * Used during guest checkout to prompt existing customers to sign in.
 *
 * POST { email: string }
 * Response: { exists: boolean, hasAuth: boolean }
 */

interface CheckCustomerRequest {
  email: string
}

interface CheckCustomerResponse {
  exists: boolean
  hasAuth: boolean
}

// Looser than the checkout limits (the form calls this on e-mail blur), but
// still caps how fast anyone can probe which e-mails are registered.
const checkCustomerLimiter = new RateLimiter({ interval: 60_000, max: 20 })

export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request, checkCustomerLimiter)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = (await request.json()) as CheckCustomerRequest

    // Validate email
    if (!body.email || typeof body.email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Normalize email (lowercase, trim)
    const normalizedEmail = body.email.toLowerCase().trim().slice(0, 254)

    // Query customers table for this email
    const { data, error } = await supabaseAdmin
      .from("customers")
      .select("id, email, auth_id")
      .eq("email", normalizedEmail)
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error("Check customer error:", error)
      return NextResponse.json(
        { error: "Failed to check customer" },
        { status: 500 }
      )
    }

    const response: CheckCustomerResponse = {
      exists: !!data,
      hasAuth: !!(data?.auth_id)
    }

    return NextResponse.json(response, { status: 200 })

  } catch (err) {
    console.error("Check customer error:", err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: process.env.NODE_ENV === "development" ? message : undefined
      },
      { status: 500 }
    )
  }
}
