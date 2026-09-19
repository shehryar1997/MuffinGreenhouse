"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Leaf, Eye, EyeOff } from "lucide-react"
import { loginWithPassword } from "./actions"

export function LoginPageClient() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const returnTo = searchParams.get("returnTo")
  const prefillEmail = searchParams.get("email")

  const [emailOrPhone, setEmailOrPhone] = useState(prefillEmail || "")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const result = await loginWithPassword(emailOrPhone, password, returnTo)

    setIsLoading(false)

    if (!result.success && result.error) {
      setError(result.error)
    }
    // On success, the server action handles redirect
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
            <label htmlFor="password" className="block text-sm font-medium text-forest-700 mb-1">
              Password
            </label>
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