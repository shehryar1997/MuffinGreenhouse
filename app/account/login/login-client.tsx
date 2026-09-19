"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Leaf, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { loginWithPassword } from "./actions"
import { resendOTP, signInAfterVerification, verifyOTP } from "../register/actions"

export function LoginPageClient() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get("returnTo")
  const prefillEmail = searchParams.get("email")

  const [emailOrPhone, setEmailOrPhone] = useState(prefillEmail || "")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  // Set when the password was right but sign-up was never finished (e-mail not verified yet).
  const [pendingVerify, setPendingVerify] = useState<{ customerId: string; email: string } | null>(null)
  const [code, setCode] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const result = await loginWithPassword(emailOrPhone, password, returnTo)

    setIsLoading(false)

    if (result.needsVerification && result.customerId && result.email) {
      setPendingVerify({ customerId: result.customerId, email: result.email })
      setCode("")
      toast.success("We've e-mailed you a 6-digit code")
      return
    }
    if (!result.success && result.error) {
      setError(result.error)
    }
    // On success, the server action handles redirect
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pendingVerify) return
    setError(null)
    setIsLoading(true)
    const verified = await verifyOTP(pendingVerify.customerId, code)
    if (!verified.success) {
      setIsLoading(false)
      setError(verified.error ?? "Verification failed")
      return
    }
    const signedIn = await signInAfterVerification(pendingVerify.email, password)
    setIsLoading(false)
    if (!signedIn.success) {
      setPendingVerify(null)
      setError("Your e-mail is verified. Please sign in again.")
      return
    }
    toast.success("Email verified. Welcome!")
    const safe = returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/account"
    router.push(safe)
    router.refresh()
  }

  const handleResend = async () => {
    if (!pendingVerify) return
    setError(null)
    setIsLoading(true)
    const r = await resendOTP(pendingVerify.customerId)
    setIsLoading(false)
    if (r.success) toast.success("New code sent")
    else setError(r.error ?? "Couldn't send a new code")
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-cream-100 py-20">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sprout-300/20 mb-4">
            <Leaf className="w-8 h-8 text-clay-500" />
          </div>
          <h1 className="font-serif text-3xl text-forest-900">Welcome back</h1>
          <p className="text-forest-600 mt-2">Sign in to your Muffin account</p>
        </div>

        {pendingVerify ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm text-forest-700">
              Your account isn&apos;t verified yet. Enter the 6-digit code we sent to <strong>{pendingVerify.email}</strong> to finish signing in.
            </p>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              aria-label="6-digit verification code"
              className="tracking-[0.4em] text-center text-lg"
              disabled={isLoading}
              required
            />
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading || code.length !== 6}>
              {isLoading ? "Verifying..." : "Verify & sign in"}
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button type="button" onClick={handleResend} disabled={isLoading} className="text-clay-500 hover:underline">
                Send a new code
              </button>
              <button type="button" onClick={() => { setPendingVerify(null); setError(null) }} className="text-forest-600 hover:underline">
                Back
              </button>
            </div>
          </form>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email-or-phone" className="block text-sm font-medium text-forest-700 mb-1">
              Email or phone
            </label>
            <Input
              id="email-or-phone"
              name="username"
              type="text"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              placeholder="you@example.com or 03001234567"
              className="w-full"
              disabled={isLoading}
              required
              autoComplete="username"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-forest-700">
                Password
              </label>
              <Link
                href={`/account/forgot-password${emailOrPhone.includes("@") ? `?email=${encodeURIComponent(emailOrPhone.trim())}` : ""}`}
                className="text-xs text-clay-500 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pr-10"
                disabled={isLoading}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-forest-500 hover:text-forest-600"
                aria-pressed={showPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Entering..." : "Enter your Green World 🌱"}
          </Button>
        </form>
        )}

        <div className="mt-8 text-center text-sm text-forest-600">
          Don&apos;t have an account?{" "}
          <Link href="/account/register" className="text-clay-500 hover:underline">
            Create one
          </Link>
        </div>

        <div className="mt-8 border-t border-forest-200 pt-8">
          <p className="text-center text-sm text-forest-500 mb-4">Or continue as guest</p>
          <Button variant="outline" className="w-full" asChild disabled={isLoading}>
            <Link href="/">Browse Shop</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}