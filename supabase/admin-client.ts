// SERVER-ONLY. Uses the service role key, bypasses RLS entirely.
// Never import this from a Client Component, never prefix the key with
// NEXT_PUBLIC_, and never expose it to the browser. Safe here because every
// /admin route is gated by middleware.ts + the password check.
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Next.js patches the global `fetch` on the server to route requests through
// its own Data Cache, keyed by the exact request (URL + method + headers).
// `export const dynamic = "force-dynamic"` on a page is supposed to make
// every fetch in that route default to `no-store`, but it only applies to
// fetches made *after* that config exists — a fetch signature that was
// already cached from an earlier deploy (before force-dynamic was added)
// can keep serving its old cached response indefinitely, since the Data
// Cache persists across deployments and isn't invalidated just because a
// route's config changed later. That's what was happening here: admin
// pages kept showing stale/missing customer data even after adding
// force-dynamic, because the specific queries in question had already been
// cached under their old signature.
//
// The fix: never let this client's requests touch the Data Cache at all,
// regardless of route config or query shape. Every request from
// supabaseAdmin now explicitly opts out with `cache: "no-store"`.
const noStoreFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: "no-store" })

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
  global: { fetch: noStoreFetch },
})
