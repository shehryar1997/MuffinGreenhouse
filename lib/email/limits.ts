// Sending limits per provider, used only to show "x of y" in the admin panel (the providers enforce their own
// limits, and lib/email/mailer.ts reacts to them). Defaults are the free plans; if you change plan, set these in
// Vercel instead of editing code:  EMAIL_RESEND_DAILY_LIMIT, EMAIL_RESEND_MONTHLY_LIMIT,
// EMAIL_MAILTRAP_DAILY_LIMIT, EMAIL_MAILTRAP_MONTHLY_LIMIT.
export type EmailProviderName = "resend" | "mailtrap"

const fromEnv = (name: string, fallback: number) => {
  const value = Number(process.env[name])
  return Number.isFinite(value) && value > 0 ? value : fallback
}

export function emailLimits(): Record<EmailProviderName, { daily: number; monthly: number }> {
  return {
    resend: { daily: fromEnv("EMAIL_RESEND_DAILY_LIMIT", 100), monthly: fromEnv("EMAIL_RESEND_MONTHLY_LIMIT", 3000) },
    mailtrap: { daily: fromEnv("EMAIL_MAILTRAP_DAILY_LIMIT", 150), monthly: fromEnv("EMAIL_MAILTRAP_MONTHLY_LIMIT", 4000) },
  }
}
