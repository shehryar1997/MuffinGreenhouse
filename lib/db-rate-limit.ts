// Cross-instance rate limiting backed by the `rate_limit_hit` Postgres function.
// (lib/rate-limit.ts is per-process only, which does very little on serverless.)
import { headers } from "next/headers"
import { supabaseAdmin } from "@/supabase/admin-client"

/** Best-effort caller IP inside a Server Action / route handler. */
export async function callerIp(): Promise<string> {
  const h = await headers()
  const forwarded = h.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }
  return h.get("x-real-ip") ?? "unknown"
}

/**
 * Records a hit for `key` and returns whether it is allowed.
 * Fails OPEN if the database can't be reached: a rate limiter outage must not lock real customers out.
 */
export async function allowHit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc("rate_limit_hit", {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
  })
  if (error) {
    console.error("[rate-limit] check failed, allowing request:", error.message)
    return true
  }
  return data === true
}
