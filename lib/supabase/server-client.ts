// ============================================================================
// MUFFIN NURSERY - SUPABASE SERVER CLIENT (@supabase/ssr)
// ============================================================================
// For use in Server Components, Server Actions, and Route Handlers.
// Creates a server-side Supabase instance that reads/writes auth cookies
// from the incoming request and outgoing response.
//
// Usage in Server Component:
//   import { createServerClient } from "@/lib/supabase/server-client"
//   const cookieStore = await cookies()
//   const supabase = createServerClient(cookieStore)
//
// Usage in Route Handler:
//   import { createServerClient } from "@/lib/supabase/server-client"
//   const cookieStore = await cookies()
//   const supabase = createServerClient(cookieStore)
//
// ponytail: This uses @supabase/ssr's server client pattern for secure,
// cookie-based session management in the Next.js App Router.
// See: https://supabase.com/docs/guides/auth/server-side/creating-a-client
// ============================================================================

import { createServerClient as createSSRServerClient } from "@supabase/ssr"
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createServerClient(cookieStore: ReadonlyRequestCookies) {
  return createSSRServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        // ponytail: In Server Components/Actions, cookies must be set in the
        // response context. This setAll is called to update cookies during
        // session refresh. The middleware handles this for incoming requests.
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // The `setAll` method may throw if called during a Server Component
          // render (cookies are read-only). This is expected — the middleware
          // handles session refresh on the request path.
        }
      },
    },
  })
}
