"use client"

import { useState } from "react"
import { Camera, Loader2, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { downscaleForUpload } from "@/lib/admin-upload"
import { cn } from "@/lib/utils"
import { submitPublicReview } from "@/app/shop/product/[slug]/review-actions"

async function uploadPhoto(file: File): Promise<string> {
  const body = await downscaleForUpload(file)
  const fd = new FormData()
  fd.append("file", body, file.name)
  const res = await fetch("/api/upload-review-image", { method: "POST", body: fd })
  const data: { url?: string; error?: string } | null = await res.json().catch(() => null)
  if (!res.ok || !data?.url) throw new Error(data?.error ?? "Couldn't upload the photo.")
  return data.url
}

// The open "Write a review" form on a product page: anyone can post, no order required. Unlike an order's own
// review (app/orders/[token]/review-form.tsx), this one isn't tied to a purchase on the site, so it's held for
// admin approval before it shows (see review-actions.ts) rather than appearing straight away.
export function WriteReviewForm({ productId, productName }: { productId: string; productName: string }) {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [body, setBody] = useState("")
  const [showName, setShowName] = useState(true)
  const [name, setName] = useState("")
  const [photo, setPhoto] = useState<File | null>(null)
  const [website, setWebsite] = useState("") // honeypot: left blank by real visitors
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (done) {
    return <p role="status" className="mt-4 text-sm text-sprout-700">Thank you! We&apos;ll take a quick look and publish it soon.</p>
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => setOpen(true)}>
        <Star className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Write a review
      </Button>
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const imageUrl = photo ? await uploadPhoto(photo) : null
      const result = await submitPublicReview(productId, { rating, body, showName, name, imageUrl, website })
      if ("error" in result) setError(result.error)
      else setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-xl border border-forest-200 bg-surface p-4">
      <p className="font-medium text-forest-900">How was your {productName}?</p>

      <div role="radiogroup" aria-label="Star rating" className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
            className="rounded p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Star className={cn("h-7 w-7", n <= rating ? "fill-amber-400 text-amber-400" : "text-forest-300")} aria-hidden="true" />
          </button>
        ))}
      </div>

      <textarea
        required
        rows={4}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={1500}
        placeholder="Tell others about the plant's health, packaging and how it's doing."
        aria-label="Your review"
        className="w-full rounded-md border border-forest-200 bg-background px-3 py-2 text-sm"
      />

      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium text-forest-900">Posted as</legend>
        <label className="flex items-center gap-2 text-sm text-forest-800">
          <input type="radio" name={`who-${productId}`} checked={showName} onChange={() => setShowName(true)} /> My name
        </label>
        {showName && <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={60} aria-label="Name to show" />}
        <label className="flex items-center gap-2 text-sm text-forest-800">
          <input type="radio" name={`who-${productId}`} checked={!showName} onChange={() => setShowName(false)} /> Anonymous
        </label>
      </fieldset>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-forest-500">
        <Camera className="h-4 w-4" aria-hidden="true" />
        <span>{photo ? photo.name : "Add a photo (optional)"}</span>
        <input type="file" accept="image/*" className="sr-only" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
      </label>

      {/* Honeypot: real visitors never see this field, so a filled one means a bot submitted the form. */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="sr-only"
      />

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy || rating === 0}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Post review"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={busy}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
