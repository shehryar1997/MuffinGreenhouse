import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { verifyPassword, getSessionCookieValue, COOKIE_NAME } from "@/lib/admin-session"
import { RateLimiter } from "@/lib/rate-limit"
import { Alert, Field } from "../_components/ui"
import { BrandLogo } from "../_components/brand-logo"
import { PasswordInput } from "../_components/password-input"
import { SubmitButton } from "../_components/submit-button"
import { DanceFloor } from "./dance-floor"

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
    <div className="admin-scope flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 text-sm text-foreground antialiased">
      <main id="main-content" className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-4">
          <BrandLogo className="h-16" />
          <div>
            <p className="font-serif text-[34px] leading-none tracking-tight text-foreground">Muffin</p>
            <p className="mt-2 text-sm text-muted-foreground">Muffin Plants admin</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <h1 className="font-sans text-lg font-semibold tracking-normal">Sign in</h1>

          {error && (
            <Alert tone="danger" className="mt-4">
              {error === "rate" ? "Too many attempts. Wait a few minutes and try again." : "That password isn't right. Try again."}
            </Alert>
          )}

          <form action={login} className="mt-5 space-y-5">
            <Field label="Password" htmlFor="password">
              <PasswordInput id="password" name="password" required autoFocus autoComplete="current-password" />
            </Field>
            <SubmitButton size="lg" pendingLabel="Signing in…" className="w-full">
              Sign in
            </SubmitButton>
          </form>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">Staff only.</p>

        <DanceFloor />
      </main>
    </div>
  )
}
