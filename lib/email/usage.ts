// SERVER-ONLY. Reads and writes the `email_usage` table (one row per provider per UTC day) that the admin's
// e-mail page shows. Recording never blocks or breaks sending: it is best-effort with a short time limit.
import { supabaseAdmin } from "@/supabase/admin-client"
import type { EmailAttempt } from "./mailer"
import { scrubError, type UsageRow } from "./usage-summary"

const WRITE_TIMEOUT_MS = 2000

export async function recordEmailAttempt(attempt: EmailAttempt): Promise<void> {
  try {
    const write = supabaseAdmin.rpc("record_email_attempt", {
      p_provider: attempt.provider,
      p_ok: attempt.ok,
      p_took_over: attempt.tookOver,
      p_error: attempt.error ? scrubError(attempt.error) : null,
    })
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timed out")), WRITE_TIMEOUT_MS))
    const { error } = await Promise.race([write, timeout])
    if (error) console.warn("[email] couldn't record usage:", error.message)
  } catch (err) {
    console.warn("[email] couldn't record usage:", err instanceof Error ? err.message : err)
  }
}

/** The last `days` UTC days of rows (a little extra so a month-to-date total is complete). */
export async function loadEmailUsage(days = 45): Promise<UsageRow[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)
  const { data, error } = await supabaseAdmin
    .from("email_usage")
    .select("provider, day, sent, failed, took_over, last_error, last_error_at")
    .gte("day", since)
    .order("day", { ascending: true })
  if (error) {
    console.error("[email] couldn't load usage:", error.message)
    return []
  }
  return (data ?? []) as UsageRow[]
}
