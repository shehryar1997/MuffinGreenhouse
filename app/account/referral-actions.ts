"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/supabase/admin-client"
import { createServerClient } from "@/lib/supabase/server-client"
import { allowHit, callerIp } from "@/lib/db-rate-limit"

export type ReferralResult = { error: string } | { ok: true }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Refer by e-mail: records that this signed-in customer referred `rawEmail`. The reward is paid later, when an
// order from that e-mail is paid (see lib/referrals.ts).
export async function referFriend(rawEmail: string): Promise<ReferralResult> {
  const email = String(rawEmail ?? "").trim().toLowerCase()
  if (!EMAIL_RE.test(email) || email.length > 254) return { error: "Enter a valid email address." }

  const supabase = createServerClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Please sign in first." }
  const { data: me } = await supabaseAdmin.from("customers").select("id, email").eq("auth_id", user.id).maybeSingle()
  if (!me) return { error: "We couldn't find your account." }

  if (!(await allowHit(`refer:${me.id}`, 20, 24 * 60 * 60))) return { error: "You've referred a lot of friends today. Please try again tomorrow." }
  if (email === me.email.toLowerCase()) return { error: "You can't refer yourself." }

  // Someone who has already bought from us can't be a new referral.
  const { data: existing } = await supabaseAdmin.from("customers").select("id").eq("email", email).maybeSingle()
  if (existing) {
    const { count } = await supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).eq("customer_id", existing.id).neq("status", "cancelled")
    if ((count ?? 0) > 0) return { error: "That person has already ordered from us, so they can't be referred." }
  }

  const { error } = await supabaseAdmin.from("referrals").insert({ referrer_id: me.id, referred_email: email })
  if (error) return { error: error.code === "23505" ? "You've already referred that email." : "Couldn't save the referral. Please try again." }

  revalidatePath("/account")
  return { ok: true }
}
