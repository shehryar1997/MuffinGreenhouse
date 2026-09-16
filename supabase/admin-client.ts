// SERVER-ONLY. Uses the service role key, bypasses RLS entirely.
// Never import this from a Client Component, never prefix the key with
// NEXT_PUBLIC_, and never expose it to the browser. Safe here because every
// /admin route is gated by middleware.ts + the password check.
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
})
