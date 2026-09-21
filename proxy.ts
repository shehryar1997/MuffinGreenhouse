import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { COOKIE_NAME, isValidSessionCookie } from "@/lib/admin-session"

// ============================================================================
// SUPABASE SSR SESSION REFRESH
// Refreshes the Supabase Auth session on each request by calling getUser().
// This handles cookie-based session management per @supabase/ssr best practices.
// https://supabase.com/docs/guides/auth/server-side/nextjs
//
// ponytail: We refresh for all routes (not just /admin) to keep customer
// sessions alive. The admin auth check remains gated separately.
// ============================================================================
async function refreshSupabaseSession(request: NextRequest, response: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  // Refresh session by validating it and refreshing if needed
  // This sets the auth cookie and refreshes the session if expired
  try {
    await supabase.auth.getUser()
  } catch (err) {
    // A stale/invalid auth cookie or a Supabase Auth outage must not take every page down.
    console.error("Session refresh failed:", err)
  }

  return response
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next()

  // ============================================================================
  // SUPABASE AUTH SESSION REFRESH (runs for ALL requests)
  // ============================================================================
  // Refresh session before any other checks to keep cookies in sync
  response = await refreshSupabaseSession(request, response)

  // ============================================================================
  // ADMIN AUTH CHECK (preserves existing behavior)
  // ============================================================================
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const cookie = request.cookies.get(COOKIE_NAME)?.value
    const valid = await isValidSessionCookie(cookie)

    if (!valid) {
      // Redirect to login, but preserve the Supabase session refresh
      const redirectResponse = NextResponse.redirect(new URL("/admin/login", request.url))
      // Copy cookies from the session-refresh response to the redirect
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
      })
      return redirectResponse
    }
  }

  return response
}

export const config = {
  // Match all routes except static files and API routes that don't need session refresh
  matcher: [
    // Exclude static files and internal Next.js files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
