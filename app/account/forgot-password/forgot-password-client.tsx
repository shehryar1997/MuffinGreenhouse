"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, KeyRound } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { signInAfterVerification } from "../register/actions"
import { requestPasswordReset, resetPassword } from "./actions"

export function ForgotPasswordClient() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordForm />
    </Suspense>
  )
}

function ForgotPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<"email" | "code">("email")
  const [email, setEmail] = useState(searchParams.get("email") ?? "")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [resendAt, setResendAt] = useState(0)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (step !== "code") return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [step])
  const wait = Math.max(0, Math.ceil((resendAt - now) / 1000))

  const send = async (isResend = false) => {
    setError(null)
    setBusy(true)
    const r = await requestPasswordReset(email)
    setBusy(false)
    if (!r.success) {
      setError(r.error ?? "Something went wrong")
      return
    }
    setResendAt(r.canResendAt ? new Date(r.canResendAt).getTime() : Date.now() + 30_000)
    setNow(Date.now())
    setStep("code")
    if (isResend) toast.success("New code sent")
  }

  const onEmail = (e: React.FormEvent) => {
    e.preventDefault()
    void send()
  }

  const onReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const r = await resetPassword(email, code, password)
    if (!r.success) {
      setBusy(false)
      setError(r.error ?? "Something went wrong")
      return
    }
    toast.success("Password updated")
    const signedIn = await signInAfterVerification(email, password)
    setBusy(false)
    router.push(signedIn.success ? "/account" : `/account/login?email=${encodeURIComponent(email)}`)
    router.refresh()
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-cream-100 py-20">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sprout-300/20 mb-4">
            <KeyRound className="w-8 h-8 text-clay-500" />
          </div>
          <h1 className="font-serif text-3xl text-forest-900">Reset your password</h1>
          <p className="text-forest-600 mt-2">
            {step === "email"
              ? "Enter your e-mail and we'll send you a 6-digit code."
              : `If ${email} has an account, a code is on its way. Check your spam folder too.`}
          </p>
        </div>

        {step === "email" ? (
          <form onSubmit={onEmail} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-forest-700 mb-1">
                E-mail
              </label>
              <Input id="reset-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" disabled={busy} />
            </div>
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Sending…" : "Send me a code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={onReset} className="space-y-4">
            <div>
              <label htmlFor="reset-code" className="block text-sm font-medium text-forest-700 mb-1">
                6-digit code
              </label>
              <Input
                id="reset-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="tracking-[0.4em] text-center text-lg"
                disabled={busy}
              />
            </div>
            <div>
              <label htmlFor="reset-password" className="block text-sm font-medium text-forest-700 mb-1">
                New password
              </label>
              <div className="relative">
                <Input
                  id="reset-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="pr-10"
                  disabled={busy}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-forest-500 hover:text-forest-600 max-lg:right-0 max-lg:flex max-lg:h-11 max-lg:w-11 max-lg:items-center max-lg:justify-center"
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
            <Button type="submit" className="w-full" disabled={busy || code.length !== 6 || password.length < 8}>
              {busy ? "Updating…" : "Set new password & sign in"}
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button type="button" onClick={() => void send(true)} disabled={busy || wait > 0} className="text-clay-500 hover:underline disabled:text-forest-400 disabled:no-underline">
                {wait > 0 ? `Resend code in ${wait}s` : "Resend code"}
              </button>
              <button type="button" onClick={() => { setStep("email"); setError(null); setCode("") }} className="text-forest-600 hover:underline">
                Use a different e-mail
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 text-center text-sm text-forest-600">
          <Link href="/account/login" className="text-clay-500 hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
