import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { verifyPassword, getSessionCookieValue, COOKIE_NAME } from "@/lib/admin-session"
import { RateLimiter } from "@/lib/rate-limit"

// 10 attempts per 15 minutes per IP
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
    maxAge: 60 * 60 * 24,
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F7F3EA] via-[#FAF7F2] to-[#E8F4E8] px-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#E85D2C]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#D4F542]/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-40 h-40 bg-[#3f6b3f]/10 rounded-full blur-2xl" />
      </div>

      {/* Animated leaf patterns */}
      <svg className="absolute top-10 left-10 w-32 h-32 text-[#E85D2C]/10 animate-pulse" viewBox="0 0 100 100" fill="currentColor">
        <path d="M50 0 C30 20 10 40 10 60 C10 80 30 90 50 90 C70 90 90 80 90 60 C90 40 70 20 50 0 Z" />
      </svg>
      <svg className="absolute bottom-10 right-10 w-24 h-24 text-[#3f6b3f]/10 animate-pulse delay-700" viewBox="0 0 100 100" fill="currentColor">
        <path d="M50 0 C30 20 10 40 10 60 C10 80 30 90 50 90 C70 90 90 80 90 60 C90 40 70 20 50 0 Z" />
      </svg>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E85D2C] to-[#d45124] shadow-xl shadow-orange-500/30 mb-4 transform hover:scale-105 transition-transform duration-300">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <h1 className="font-serif text-3xl font-bold text-neutral-900 mb-2">Muffin Admin</h1>
          <p className="text-sm text-neutral-500">Welcome back! Sign in to manage your store.</p>
        </div>

        {/* Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-neutral-200/50 p-8 border border-white/50">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-sm text-red-700">
                {error === "rate" ? "Too many attempts. Please wait a few minutes and try again." : "Wrong password. Try again."}
              </p>
            </div>
          )}

          <form action={login} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D2C]/20 focus:border-[#E85D2C] transition-all duration-200 pl-11"
                  placeholder="Enter your password"
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-[#E85D2C] to-[#d45124] text-white rounded-xl font-semibold text-sm shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 hover:from-[#d45124] hover:to-[#c24a20] transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Sign in to Dashboard
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-400 mt-6">
          Protected area. Authorized personnel only.
        </p>
      </div>
    </div>
  )
}
