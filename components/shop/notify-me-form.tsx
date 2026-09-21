"use client"

import { useState } from "react"
import { BellRing, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// Shown on a sold-out product: asks for an e-mail and WhatsApp number and saves them for a back-in-stock alert.
export function NotifyMeForm({ productId, productName }: { productId: string; productName: string }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/notify-stock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, email, whatsapp }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) setError(data.error || "Something went wrong. Please try again.")
      else setDone(true)
    } catch {
      setError("Couldn't reach us. Check your connection and try again.")
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div role="status" className="mb-8 flex items-start gap-3 rounded-xl border border-sprout-200 bg-sprout-50 p-4 text-sm text-sprout-700">
        <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>Done! We&apos;ll e-mail you as soon as {productName} is back in stock.</p>
      </div>
    )
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" size="lg" className="mb-8 w-full" onClick={() => setOpen(true)}>
        <BellRing className="mr-2 h-4 w-4" aria-hidden="true" />
        Notify me when it&apos;s back
      </Button>
    )
  }

  return (
    <form onSubmit={submit} className="mb-8 space-y-3 rounded-xl border border-forest-200 bg-surface p-4">
      <p className="text-sm text-forest-700">Tell us where to reach you and we&apos;ll let you know when {productName} is back.</p>
      <div>
        <label htmlFor="notify-email" className="mb-1 block text-sm font-medium text-forest-700">Email</label>
        <Input id="notify-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" autoComplete="email" inputMode="email" />
      </div>
      <div>
        <label htmlFor="notify-whatsapp" className="mb-1 block text-sm font-medium text-forest-700">WhatsApp number</label>
        <Input id="notify-whatsapp" type="tel" required value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="03XX-XXXXXXX" autoComplete="tel" inputMode="tel" />
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Notify me"}
      </Button>
    </form>
  )
}
