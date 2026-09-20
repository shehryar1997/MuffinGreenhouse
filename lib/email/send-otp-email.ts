// ============================================================================
// MUFFIN NURSERY - EMAIL OTP SENDER
// ============================================================================
// Sends OTP codes via email for email address verification.
//
// Usage:
//   import { sendOtpEmail } from "@/lib/email/send-otp-email"
//   await sendOtpEmail("user@example.com", "123456")
//
// ponytail: Sends through the shared mailer (Resend, with Mailtrap as backup) - not routed through /api/send-email
// to avoid the SEND_PASSWORD gate which is for human-operated admin replies only.
// ============================================================================

import { sendEmail } from "./mailer"
import { emailSignOff } from "./common"

/**
 * Send a one-time code by e-mail.
 * @param toEmail - Recipient email address
 * @param code - 6-digit code
 * @param purpose - "verify" (confirm a new account's e-mail) or "reset" (choose a new password)
 */
export async function sendOtpEmail(toEmail: string, code: string, purpose: "verify" | "reset" = "verify"): Promise<void> {
  const isReset = purpose === "reset"
  await sendEmail({
    to: toEmail,
    subject: isReset ? "Your Muffin Plants password reset code" : "Your Muffin Plants verification code",
    text: `Hi there,

${isReset ? "Your password reset code is" : "Your verification code is"}: ${code}

This code will expire in 10 minutes.

${isReset ? "If you didn't ask to reset your password, you can safely ignore this email. Your password won't change." : "If you didn't request this verification code, you can safely ignore this email."}

${emailSignOff()}`,
  })
}
