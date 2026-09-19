import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { COOKIE_NAME, isValidSessionCookie } from "@/lib/admin-session"

// proxy.ts only gates /admin/* page navigations. A server action can be
// POSTed to from any path, and every admin action runs with the service-role
// key (RLS bypassed), so each one must verify the admin session itself.

export async function isAdminRequest(): Promise<boolean> {
  const cookieStore = await cookies()
  return isValidSessionCookie(cookieStore.get(COOKIE_NAME)?.value)
}

/** For actions that redirect/throw: sends unauthenticated callers to the login page. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdminRequest())) redirect("/admin/login")
}
