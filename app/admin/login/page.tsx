import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { verifyPassword, getSessionCookieValue, COOKIE_NAME } from "@/lib/admin-session"
import { RateLimiter } from "@/lib/rate-limit"

// 10 attempts per 15 minutes per IP. In-memory, so best-effort per server
// instance (see lib/rate-limit.ts) -- it still stops casual brute forcing.
const loginLimiter = new RateLimiter({ interval: 15 * 60_000, max: 10 })

async function login(formData: FormData) {
  "use server"
  const requestHeaders = await headers()
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  if (loginLimiter.limit(ip)) {
    redirect("/admin/login?error=rate")
  }

  const password = formData.get("password")
  const ok = typeof password === "string" && (await verifyPassword(password))

  if (!ok) {
    redirect("/admin/login?error=1")
  }

  const token = await getSessionCookieValue()
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours, matches session token expiry
    path: "/",
  })
  redirect("/admin/products")
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F3EA] px-4">
      <form action={login} className="w-full max-w-sm bg-white p-8 rounded-lg shadow-sm border">
        <h1 className="text-xl font-serif mb-6">Muffin Admin</h1>
        {error && (
          <p className="text-sm text-red-600 mb-4">
            {error === "rate" ? "Too many attempts. Please wait a few minutes and try again." : "Wrong password. Try again."}
          </p>
        )}
        <label className="block text-sm font-medium mb-2" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          className="w-full border rounded px-3 py-2 mb-4 text-sm"
        />
        <button
          type="submit"
          className="w-full bg-[#E85D2C] text-white rounded px-3 py-2 font-medium text-sm"
        >
          Log in
        </button>
      </form>
    </div>
  )
}
