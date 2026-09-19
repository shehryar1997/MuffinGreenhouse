// SERVER-ONLY. One-time codes for e-mail verification and password reset.
// Codes are generated with a CSPRNG, stored only as a salted hash in `customer_otps`
// (a table no browser-facing role can read), expire after 10 minutes, allow 5 wrong
// guesses, and can be re-sent at most once per 30 seconds / 5 times per hour.
import { createHash, randomInt, timingSafeEqual } from "node:crypto"
import { supabaseAdmin } from "@/supabase/admin-client"

export type OtpPurpose = "verify" | "reset"

export const OTP_TTL_MS = 10 * 60 * 1000
export const OTP_RESEND_COOLDOWN_S = 30
export const OTP_MAX_ATTEMPTS = 5
const OTP_MAX_SENDS_PER_HOUR = 5
const HOUR_MS = 60 * 60 * 1000

// Any server-side secret works as the pepper: it only has to be unknown to someone who can read the table.
const PEPPER = process.env.OTP_PEPPER || process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "muffin-otp"

const hashCode = (customerId: string, purpose: OtpPurpose, code: string) =>
  createHash("sha256").update(`${customerId}:${purpose}:${code}:${PEPPER}`).digest("hex")

export const generateCode = () => String(randomInt(100000, 1000000))

export type IssueResult =
  | { ok: true; code: string; expiresAt: string; canResendAt: string }
  | { ok: false; error: string }

interface OtpRow {
  code_hash: string
  expires_at: string
  attempts: number
  last_sent_at: string
  sends_in_window: number
  window_started_at: string
  pending_auth_id: string | null
  pending_profile: Record<string, unknown> | null
}

/** Creates (or replaces) the code for this customer + purpose, enforcing the resend limits. */
export async function issueOtp(
  customerId: string,
  purpose: OtpPurpose,
  pending?: { authId?: string; profile?: Record<string, unknown> }
): Promise<IssueResult> {
  const { data: existing } = await supabaseAdmin
    .from("customer_otps")
    .select("code_hash, expires_at, attempts, last_sent_at, sends_in_window, window_started_at, pending_auth_id, pending_profile")
    .eq("customer_id", customerId)
    .eq("purpose", purpose)
    .maybeSingle<OtpRow>()

  const now = Date.now()
  let sends = 1
  let windowStart = new Date(now)

  if (existing) {
    const sinceLast = (now - new Date(existing.last_sent_at).getTime()) / 1000
    if (sinceLast < OTP_RESEND_COOLDOWN_S) {
      return { ok: false, error: `Please wait ${Math.ceil(OTP_RESEND_COOLDOWN_S - sinceLast)}s before requesting a new code` }
    }
    const windowAge = now - new Date(existing.window_started_at).getTime()
    if (windowAge < HOUR_MS) {
      if (existing.sends_in_window >= OTP_MAX_SENDS_PER_HOUR) {
        return { ok: false, error: "Too many codes requested. Please try again in an hour." }
      }
      sends = existing.sends_in_window + 1
      windowStart = new Date(existing.window_started_at)
    }
  }

  const code = generateCode()
  const expiresAt = new Date(now + OTP_TTL_MS)
  const { error } = await supabaseAdmin.from("customer_otps").upsert(
    {
      customer_id: customerId,
      purpose,
      code_hash: hashCode(customerId, purpose, code),
      expires_at: expiresAt.toISOString(),
      attempts: 0,
      last_sent_at: new Date(now).toISOString(),
      sends_in_window: sends,
      window_started_at: windowStart.toISOString(),
      // A resend keeps whatever sign-up details were stashed by the first send.
      pending_auth_id: pending?.authId ?? existing?.pending_auth_id ?? null,
      pending_profile: pending?.profile ?? existing?.pending_profile ?? null,
    },
    { onConflict: "customer_id,purpose" }
  )
  if (error) {
    console.error("issueOtp failed:", error)
    return { ok: false, error: "Couldn't create a verification code. Please try again." }
  }

  return { ok: true, code, expiresAt: expiresAt.toISOString(), canResendAt: new Date(now + OTP_RESEND_COOLDOWN_S * 1000).toISOString() }
}

export type CheckResult =
  | { ok: true; pendingAuthId: string | null; pendingProfile: Record<string, unknown> | null }
  | { ok: false; reason: "none" | "expired" | "locked" | "wrong"; attempts: number; remaining: number }

/** Checks a submitted code. A correct code is consumed (single use). */
export async function checkOtp(customerId: string, purpose: OtpPurpose, submitted: string): Promise<CheckResult> {
  const { data: row } = await supabaseAdmin
    .from("customer_otps")
    .select("code_hash, expires_at, attempts, last_sent_at, sends_in_window, window_started_at, pending_auth_id, pending_profile")
    .eq("customer_id", customerId)
    .eq("purpose", purpose)
    .maybeSingle<OtpRow>()

  if (!row) return { ok: false, reason: "none", attempts: 0, remaining: 0 }
  if (row.attempts >= OTP_MAX_ATTEMPTS) return { ok: false, reason: "locked", attempts: row.attempts, remaining: 0 }
  if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, reason: "expired", attempts: row.attempts, remaining: 0 }

  const a = Buffer.from(row.code_hash, "hex")
  const b = Buffer.from(hashCode(customerId, purpose, submitted), "hex")
  const match = a.length === b.length && timingSafeEqual(a, b)

  if (!match) {
    const attempts = row.attempts + 1
    await supabaseAdmin.from("customer_otps").update({ attempts }).eq("customer_id", customerId).eq("purpose", purpose)
    return { ok: false, reason: attempts >= OTP_MAX_ATTEMPTS ? "locked" : "wrong", attempts, remaining: Math.max(0, OTP_MAX_ATTEMPTS - attempts) }
  }

  await supabaseAdmin.from("customer_otps").delete().eq("customer_id", customerId).eq("purpose", purpose)
  return { ok: true, pendingAuthId: row.pending_auth_id, pendingProfile: row.pending_profile }
}
