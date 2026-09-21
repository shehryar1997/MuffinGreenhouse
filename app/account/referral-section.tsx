"use client"

import { useState } from "react"
import { Check, Copy, Gift, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatPrice } from "@/lib/utils"
import { referFriend } from "./referral-actions"

export interface ReferralSectionProps {
  code: string | null
  friendDiscount: number
  codeReward: number
  emailReward: number
  emailMinOrder: number
  coupons: Array<{ code: string; amount: number }>
  referrals: Array<{ email: string; rewarded: boolean }>
}

function CopyButton({ value, copied, onCopy }: { value: string; copied: boolean; onCopy: (value: string) => void }) {
  return (
    <button type="button" onClick={() => onCopy(value)} aria-label={`Copy ${value}`} className="rounded p-1.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {copied ? <Check className="h-4 w-4 text-sprout-600" aria-hidden="true" /> : <Copy className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
    </button>
  )
}

export function ReferralSection({ code, friendDiscount, codeReward, emailReward, emailMinOrder, coupons, referrals }: ReferralSectionProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(value)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      toast.error("Couldn't copy. Select the code and copy it by hand.")
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    const result = await referFriend(email).catch(() => ({ error: "Something went wrong. Please try again." }))
    setBusy(false)
    if ("error" in result) setError(result.error)
    else {
      setEmail("")
      toast.success("Referral saved")
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-3">
        <Gift className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        <h2 className="font-serif text-xl text-foreground">Refer a friend</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">
            Share your code. Your friend gets <strong>{formatPrice(friendDiscount)} off their first order</strong>, and once it&apos;s paid you get a{" "}
            <strong>{formatPrice(codeReward)} coupon</strong> for your next purchase.
          </p>
          {code ? (
            <div className="mt-3 flex items-center justify-between rounded-md border border-dashed border-forest-400 bg-forest-50 px-4 py-3">
              <span className="font-mono text-lg font-semibold tracking-wider text-forest-900">{code}</span>
              <CopyButton value={code} copied={copied === code} onCopy={copy} />
            </div>
          ) : (
            <p className="mt-3 text-sm text-red-600">We couldn&apos;t create your code right now. Refresh the page to try again.</p>
          )}
        </div>

        <div>
          <p className="text-sm text-muted-foreground">
            Or refer someone by email. When they order more than <strong>{formatPrice(emailMinOrder)}</strong> and it&apos;s paid, you get a{" "}
            <strong>{formatPrice(emailReward)} coupon</strong>.
          </p>
          <form onSubmit={submit} className="mt-3 flex gap-2">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="friend@email.com" aria-label="Friend's email" />
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Refer"}
            </Button>
          </form>
          {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
          {referrals.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm">
              {referrals.map((r) => (
                <li key={r.email} className="flex items-center justify-between gap-3">
                  <span className="break-all">{r.email}</span>
                  <span className={r.rewarded ? "text-sprout-700" : "text-muted-foreground"}>{r.rewarded ? "Reward sent" : "Waiting for their order"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {coupons.length > 0 && (
        <div className="mt-6 border-t border-border pt-4">
          <h3 className="mb-2 text-sm font-medium text-foreground">Your coupons</h3>
          <ul className="space-y-2">
            {coupons.map((c) => (
              <li key={c.code} className="flex items-center justify-between rounded-md border border-border px-4 py-2.5">
                <span>
                  <span className="font-mono font-semibold">{c.code}</span>
                  <span className="ml-3 text-sm text-muted-foreground">{formatPrice(c.amount)} off your next order</span>
                </span>
                <CopyButton value={c.code} copied={copied === c.code} onCopy={copy} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
