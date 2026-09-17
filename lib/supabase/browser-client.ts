// ============================================================================
// MUFFIN NURSERY - SUPABASE BROWSER CLIENT (@supabase/ssr)
// ============================================================================
// For use in Client Components only. Creates a client-side Supabase instance
// that manages auth sessions via cookies using the @supabase/ssr package.
//
// Usage:
//   import { createBrowserClient } from "@/lib/supabase/browser-client"
//   const supabase = createBrowserClient()
//
// ponytail: This replaces direct @supabase/supabase-js usage in browser contexts
// to enable proper cookie-based session management per Supabase SSR best practices.
// See: https://supabase.com/docs/guides/auth/server-side/creating-a-client
// ============================================================================

import { createBrowserClient as createSSRBrowerClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createBrowserClient() {
  return createSSRBrowerClient(supabaseUrl, supabaseAnonKey)
}
