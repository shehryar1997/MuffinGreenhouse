import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/supabase/admin-client"

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

export async function POST(request: NextRequest) {
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
    const normalizedEmail = body.email.toLowerCase().trim()

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
