"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Leaf } from "lucide-react"
import { loginWithPassword } from "./actions"

export default function LoginPage() {
  const [emailOrPhone, setEmailOrPhone] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const result = await loginWithPassword(emailOrPhone, password)

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
              type="text"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              placeholder="you@example.com or 03001234567"
              className="w-full"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-forest-700 mb-1">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full"
              disabled={isLoading}
              required
            />
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
          Don't have an account?{" "}
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
