import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import * as Sentry from "@sentry/nextjs"
import { safeEqual } from "@/lib/safe-compare"
import { isAdminRequest } from "@/lib/admin-auth"
import { EmailSendError, sendEmail } from "@/lib/email/mailer"

const REPLY_TO = "support@muffinplants.com"

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

    // Sends through Resend, or Mailtrap when Resend can't take it (see lib/email/mailer.ts)
    const result = await sendEmail({ to, subject, text: message, replyTo: REPLY_TO, headers })

    return NextResponse.json({ success: true, id: result.id, provider: result.provider })
  } catch (err) {
    Sentry.captureException(err)
    // Every provider refused it: a bad-gateway-style failure rather than a bug in this route.
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: err instanceof EmailSendError ? 502 : 500 }
    )
  }
}
