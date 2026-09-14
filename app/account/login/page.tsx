"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Leaf } from "lucide-react"
import { toast } from "sonner"
import { redirect } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error("Please enter your email")
      return
    }
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    toast.success("Magic link sent! Check your email.")
    setIsLoading(false)
    setEmail("")
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-cream-100 py-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sprout-300/20 mb-4">
            <Leaf className="w-8 h-8 text-clay-500" />
          </div>
          <h1 className="font-serif text-3xl text-forest-900">Welcome back</h1>
          <p className="text-forest-600 mt-2">Sign in to your Muffin account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full" required />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Magic Link"}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-forest-600">
          Don't have an account? <Link href="/account/register" className="text-clay-500 hover:underline">Create one</Link>
        </div>

        <div className="mt-8 border-t border-forest-200 pt-8">
          <p className="text-center text-sm text-forest-500 mb-4">Or continue as guest</p>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/">Browse Shop</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
