import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { checkRateLimit } from "@/lib/rate-limit"
import * as Sentry from "@sentry/nextjs"
import { safeEqual } from "@/lib/safe-compare"
import { isAdminRequest } from "@/lib/admin-auth"

// From email address
const FROM_EMAIL = "Muffin Plants <support@muffinplants.com>"
const REPLY_TO = "support@muffinplants.com"

// Lazy initialization - Resend is only created when the API is called
// This avoids build-time errors when RESEND_API_KEY isn't available
function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set")
  }
  return new Resend(apiKey)
}

interface EmailRequest {
  password: string
  to: string
  subject: string
  inReplyTo?: string
  message: string
}

export async function POST(request: NextRequest) {
  // Rate limiting check (5 requests per minute per IP)
  const rateLimitResponse = checkRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  // This endpoint sends mail as support@ -- only a logged-in admin may use it
  // (the /admin/email page is the only caller), on top of the shared password.
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = (await request.json()) as EmailRequest
    const { password, to, subject, inReplyTo, message } = body

    // Validate required fields
    if (!password || !to || !subject || !message) {
      return NextResponse.json(
        { error: "Missing to, subject, or message" },
        { status: 400 }
      )
    }

    // Validate password
    if (!process.env.SEND_PASSWORD || !(await safeEqual(password, process.env.SEND_PASSWORD))) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      )
    }

    // Build optional threading headers
    // If you paste in the customer's original Message-ID (found via Gmail's
    // "Show original" on their email), this keeps the reply in the same
    // Gmail thread on their end too.
    const headers: Record<string, string> = {}
    if (inReplyTo && inReplyTo.trim()) {
      const messageId = inReplyTo.trim().startsWith("<")
        ? inReplyTo.trim()
        : `<${inReplyTo.trim()}>`
      headers["In-Reply-To"] = messageId
      headers["References"] = messageId
    }

    // Send email via Resend
    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      replyTo: REPLY_TO,
      subject,
      text: message,
      headers,
    })

    if (error) {
      Sentry.captureException(error)
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (err) {
    Sentry.captureException(err)
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    )
  }
}
