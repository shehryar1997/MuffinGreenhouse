"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const WELCOME_AMOUNT_LABEL = "Rs 300"

export function NewsletterSignup() {
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) setMessage({ tone: "error", text: data.error || "Something went wrong. Please try again." })
      else if (data.already) setMessage({ tone: "ok", text: "You're already on the list. Check your inbox for your welcome code." })
      else {
        setMessage({ tone: "ok", text: data.code ? `You're in! Your code is ${data.code}. We've e-mailed it to you too.` : "You're in! Thanks for joining." })
        setEmail("")
      }
    } catch {
      setMessage({ tone: "error", text: "Couldn't reach us. Check your connection and try again." })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-12 flex flex-col gap-4 rounded-lg border border-border/40 bg-background/40 p-6 md:flex-row md:items-center md:justify-between">
      <div>
        <h3 className="font-serif text-xl text-foreground">Get {WELCOME_AMOUNT_LABEL} off your first order</h3>
        <p className="mt-1 text-sm text-secondary-foreground/80">Join our list for new arrivals, care tips and offers.</p>
      </div>
      <form onSubmit={submit} className="w-full md:max-w-md">
        <div className="flex gap-2">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            aria-label="Email address"
            autoComplete="email"
            inputMode="email"
          />
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Join"}
          </Button>
        </div>
        {message && (
          <p role={message.tone === "error" ? "alert" : "status"} className={`mt-2 text-sm ${message.tone === "error" ? "text-red-600" : "text-forest-700"}`}>
            {message.text}
          </p>
        )}
      </form>
    </div>
  )
}
