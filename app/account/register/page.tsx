"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, ChevronLeft, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { CitySelect } from "@/components/ui/city-select"
import {
  registerCustomer,
  verifyOTP,
  resendOTP,
  signInAfterVerification,
} from "./actions"

type Step = "register" | "verify"

interface VerificationData {
  customerId: string
  email: string
  password: string
  expiresAt: string
  canResendAt: string
  attempts: number
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = React.useState<Step>("register")
  const [isLoading, setIsLoading] = React.useState(false)
  const [verification, setVerification] = React.useState<VerificationData | null>(null)

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [phone, setPhone] = React.useState("")
  const [street, setStreet] = React.useState("")
  const [city, setCity] = React.useState("")

  const [otpCode, setOtpCode] = React.useState("")
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({})
  const [formError, setFormError] = React.useState("")
  const [resendCountdown, setResendCountdown] = React.useState(0)

  const validatePhone = (v: string) => /^03\d{9}$/.test(v)
  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

  const handlePhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "")
    if (v.length <= 11 && (v.length === 0 || v.startsWith("0"))) {
      setPhone(v)
      if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: "" }))
    }
  }

  const validate = (f: string, v: string) => {
    if (f === "email" && v && !validateEmail(v)) return "Please enter a valid email address"
    if (f === "password" && v && v.length < 8) return "Password must be at least 8 characters"
    if (f === "phone" && v && !validatePhone(v)) return "Phone must be 11 digits starting with 03"
    return ""
  }

  const onChange = (s: React.Dispatch<React.SetStateAction<string>>, f: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      s(e.target.value)
      if (fieldErrors[f]) setFieldErrors((p) => ({ ...p, [f]: "" }))
      if (formError) setFormError("")
    }

  React.useEffect(() => {
    if (step !== "verify" || !verification) return
    const tick = () => {
      const t = Math.ceil((new Date(verification.canResendAt).getTime() - Date.now()) / 1000)
      setResendCountdown(Math.max(0, t))
    }
    tick()
    const i = setInterval(tick, 1000)
    return () => clearInterval(i)
  }, [step, verification])

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    setFieldErrors({})
    const err: Record<string, string> = {}
    if (!name.trim()) err.name = "Name is required"
    if (!email.trim()) err.email = "Email is required"
    else if (validate("email", email)) err.email = validate("email", email)
    if (!password) err.password = "Password is required"
    else if (validate("password", password)) err.password = validate("password", password)
    if (!phone.trim()) err.phone = "Phone is required"
    else if (validate("phone", phone)) err.phone = validate("phone", phone)
    if (!street.trim()) err.street = "Street is required"
    if (!city.trim()) err.city = "City is required"
    if (Object.keys(err).length) { setFieldErrors(err); return }

    setIsLoading(true)
    const r = await registerCustomer({ name, email, password, phone, street, city })
    setIsLoading(false)

    if (r.success && r.customerId) {
      setVerification({ 
        customerId: r.customerId, 
        email, 
        password, 
        expiresAt: r.expiresAt || "", 
        canResendAt: r.canResendAt || "", 
        attempts: r.attempts || 0 
      })
      setStep("verify")
      setOtpCode("")
      setFormError("")
      setFieldErrors({})
      toast.success("Check your email for the verification code")
    } else { 
      setFormError(r.error || "Registration failed") 
    }
  }

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!verification) return
    setFormError("")
    setIsLoading(true)
    const r = await verifyOTP(verification.customerId, otpCode)
    if (r.success) {
      const s = await signInAfterVerification(verification.email, verification.password)
      if (s.success) {
        toast.success("Account verified successfully!")
        router.push("/account")
      } else {
        router.push("/account/login?verified=1")
      }
    } else {
      setFormError(r.error || "")
      if (r.attempts !== undefined) {
        setVerification((p) => p ? { ...p, attempts: r.attempts! } : null)
      }
    }
    setIsLoading(false)
  }

  const onResend = async () => {
    if (!verification || resendCountdown > 0) return
    setFormError("")
    setIsLoading(true)
    const r = await resendOTP(verification.customerId)
    setIsLoading(false)
    if (r.success && r.canResendAt) {
      setVerification((p) => p ? { ...p, expiresAt: r.expiresAt || p.expiresAt, canResendAt: r.canResendAt || p.canResendAt, attempts: 0 } : null)
      toast.success("New code sent to your email")
    } else { 
      setFormError(r.error || "") 
    }
  }

  const isBlocked = verification ? verification.attempts >= 5 : false

  const inputClass = (err?: string) => cn("mt-1", err && "border-destructive")

  return (
    <div className="min-h-screen bg-cream-100">
      <div className="mx-auto max-w-md px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl font-medium text-forest-900">
            {step === "register" ? "Create Account" : "Verify Email"}
          </h1>
          {step === "register" ? (
            <p className="mt-2 text-forest-600">
              Join Muffin Nursery for a personalized plant shopping experience
            </p>
          ) : (
            <p className="mt-2 text-forest-600" id="verify-instructions">
              We&apos;ve sent a 6-digit code to your email — check your inbox (and spam folder, just in case).
            </p>
          )}
        </div>

        {step === "register" ? (
          <form onSubmit={onRegister} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-forest-800">Full Name</label>
              <Input
                id="name"
                name="name"
                value={name} onChange={onChange(setName, "name")} placeholder="e.g., Sarah Khan" className={inputClass(fieldErrors.name)}
                autoComplete="name"
                aria-invalid={!!fieldErrors.name}
                aria-describedby={fieldErrors.name ? "name-error" : undefined}
              />
              {fieldErrors.name && <p id="name-error" className="mt-1 text-sm text-destructive">{fieldErrors.name}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-forest-800">Email</label>
              <Input
                id="email"
                name="email"
                type="email" value={email} onChange={onChange(setEmail, "email")} placeholder="sarah@example.com" className={inputClass(fieldErrors.email)}
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
              />
              {fieldErrors.email && <p id="email-error" className="mt-1 text-sm text-destructive">{fieldErrors.email}</p>}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-forest-800">Password</label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"} value={password} onChange={onChange(setPassword, "password")} placeholder="At least 8 characters" className={cn(inputClass(fieldErrors.password), "pr-10")}
                  autoComplete="new-password"
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? "password-error" : undefined}
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
              {fieldErrors.password && <p id="password-error" className="mt-1 text-sm text-destructive">{fieldErrors.password}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-forest-800">Phone Number</label>
              <Input
                id="phone"
                name="phone"
                type="tel" value={phone} onChange={handlePhone} placeholder="03001234567" className={inputClass(fieldErrors.phone)}
                autoComplete="tel"
                inputMode="tel"
                aria-invalid={!!fieldErrors.phone}
                aria-describedby={fieldErrors.phone ? "phone-error" : "phone-hint"}
              />
              {fieldErrors.phone && <p id="phone-error" className="mt-1 text-sm text-destructive">{fieldErrors.phone}</p>}
              <p id="phone-hint" className="mt-1 text-xs text-forest-500">Used for contact/delivery purposes</p>
            </div>
            <div>
              <label htmlFor="street" className="block text-sm font-medium text-forest-800">Street Address</label>
              <Input
                id="street"
                name="street"
                value={street} onChange={onChange(setStreet, "street")} placeholder="123 Green Street" className={inputClass(fieldErrors.street)}
                autoComplete="street-address"
                aria-invalid={!!fieldErrors.street}
                aria-describedby={fieldErrors.street ? "street-error" : undefined}
              />
              {fieldErrors.street && <p id="street-error" className="mt-1 text-sm text-destructive">{fieldErrors.street}</p>}
            </div>
            <div>
              <label id="city-label" className="block text-sm font-medium text-forest-800">City</label>
              <div className="mt-1">
                <CitySelect
                  id="city"
                  value={city}
                  onChange={(v) => { setCity(v); setFieldErrors((p) => ({ ...p, city: "" })); }}
                  placeholder="Select your city"
                  error={!!fieldErrors.city}
                  aria-labelledby="city-label"
                  aria-describedby={fieldErrors.city ? "city-error" : undefined}
                />
              </div>
              {fieldErrors.city && <p id="city-error" className="mt-1 text-sm text-destructive">{fieldErrors.city}</p>}
            </div>
            {formError && <div role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{formError}</div>}
            <Button type="submit" disabled={isLoading} className="w-full bg-clay-500 hover:bg-clay-600">
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Account"}
            </Button>
            <p className="text-center text-sm text-forest-600">
              Already have an account? <a href="/account/login" className="text-clay-600 hover:text-clay-700">Sign in</a>
            </p>
          </form>
        ) : verification && (
          <div className="space-y-6">
            <form onSubmit={onVerify} className="space-y-5">
              <div>
                <label htmlFor="otp-code" className="block text-sm font-medium text-forest-800">Verification Code</label>
                <Input
                  id="otp-code"
                  name="otp-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    if (v.length <= 6) setOtpCode(v);
                    if (formError) setFormError("");
                  }}
                  placeholder="000000"
                  disabled={isBlocked}
                  className={cn("mt-1 text-center text-2xl tracking-[0.5em]", isBlocked && "opacity-50")}
                  aria-invalid={!!formError || isBlocked}
                  aria-describedby={formError ? "otp-error" : isBlocked ? "otp-blocked" : "verify-instructions"}
                />
                {isBlocked && <p id="otp-blocked" className="mt-2 text-sm text-destructive">Too many failed attempts. Please request a new code.</p>}
                {formError && <p id="otp-error" role="alert" className="mt-2 text-sm text-destructive">{formError}</p>}
              </div>
              <Button type="submit" disabled={otpCode.length !== 6 || isLoading || isBlocked} className="w-full bg-clay-500 hover:bg-clay-600">
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</> : "Verify"}
              </Button>
            </form>
            <div className="text-center">
              <p className="text-sm text-forest-600">Didn&apos;t receive the code?</p>
              <button 
                type="button" 
                onClick={onResend} 
                disabled={resendCountdown > 0 || isLoading} 
                className={cn("mt-1 text-sm font-medium", resendCountdown > 0 ? "text-forest-500 cursor-not-allowed" : "text-clay-600 hover:text-clay-700")}
              >
                {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend code"}
              </button>
            </div>
            <button 
              type="button" 
              onClick={() => { setStep("register"); setOtpCode(""); setFormError(""); }} 
              className="flex w-full items-center justify-center gap-2 text-sm text-forest-600 hover:text-forest-800"
            >
              <ChevronLeft className="h-4 w-4" />Back to registration</button>
          </div>
        )}
      </div>
    </div>
  )
}
