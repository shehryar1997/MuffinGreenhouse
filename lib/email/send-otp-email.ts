// ============================================================================
// MUFFIN NURSERY - EMAIL OTP SENDER
// ============================================================================
// Sends OTP codes via email for email address verification.
//
// Usage:
//   import { sendOtpEmail } from "@/lib/email/send-otp-email"
//   await sendOtpEmail("user@example.com", "123456")
//
// ponytail: Uses Resend directly - not routed through /api/send-email to avoid
// the SEND_PASSWORD gate which is for human-operated admin replies only.
// ============================================================================

import { Resend } from "resend"
import { emailSignOff } from "./common"

const FROM_EMAIL = "Muffin Plants <support@muffinplants.com>"

// Lazy initialization - Resend is only created when the function is called
// This avoids build-time errors when RESEND_API_KEY isn't available
function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set")
  }
  return new Resend(apiKey)
}

/**
 * Send an OTP verification code via email.
 * @param toEmail - Recipient email address
 * @param code - 6-digit verification code
 */
export async function sendOtpEmail(toEmail: string, code: string): Promise<void> {
  const resend = getResend()

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [toEmail],
    subject: "Your Muffin Plants verification code",
    text: `Hi there,

Your verification code is: ${code}

This code will expire in 5 minutes.

If you didn't request this verification code, you can safely ignore this email.

${emailSignOff()}`,
  })

  if (error) {
    console.error("Failed to send OTP email:", error)
    throw new Error(`Failed to send verification email: ${error.message}`)
  }
}
