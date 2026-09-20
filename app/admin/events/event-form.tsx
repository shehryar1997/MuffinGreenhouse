"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { ImageField } from "@/app/admin/_components/image-field"
import { Alert, Field, FormActions, FormSection, buttonClass, inputClass, textareaClass } from "@/app/admin/_components/ui"
import { slugify } from "@/lib/event-format"
import type { EventActionResult } from "./actions"

export interface EventFormValues {
  title: string
  slug: string
  type: string
  status: string
  description: string
  datetime: string // "YYYY-MM-DDTHH:mm" in Karachi time
  end_datetime: string
  location: string
  price: number
  spots_total: number
  max_spots_per_booking: number
  what_to_expect: string
  image_url: string | null
}

const EMPTY: EventFormValues = {
  title: "",
  slug: "",
  type: "workshop",
  status: "draft",
  description: "",
  datetime: "",
  end_datetime: "",
  location: "",
  price: 0,
  spots_total: 12,
  max_spots_per_booking: 4,
  what_to_expect: "",
  image_url: null,
}

export function EventForm({
  values,
  action,
  submitLabel,
}: {
  values?: EventFormValues
  action: (formData: FormData) => Promise<EventActionResult>
  submitLabel: string
}) {
  const initial = values ?? EMPTY
  const [isSaving, startSaving] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [slug, setSlug] = useState(initial.slug)
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug))
  const [price, setPrice] = useState(initial.price)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isSaving) return
    const formData = new FormData(e.currentTarget)
    setError(null)
    startSaving(async () => {
      try {
        const result = await action(formData)
        if (result?.error) {
          setError(result.error)
          window.scrollTo({ top: 0, behavior: "smooth" })
        }
      } catch {
        setError("Something went wrong while saving. Check your connection and try again.")
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="max-w-4xl">
      {error && <Alert tone="danger" className="mb-6">{error}</Alert>}

      <div>
        <FormSection title="The basics" description="What the event is and whether customers can see it yet.">
          <Field label="Title" required>
            <input
              name="title"
              required
              maxLength={120}
              defaultValue={initial.title}
              onChange={(e) => {
                if (!slugTouched) setSlug(slugify(e.target.value))
              }}
              className={inputClass}
              placeholder="Repotting Workshop: Spring Ready"
            />
          </Field>
          <Field label="Page address" hint={`muffinplants.com/events/${slug || "…"}`}>
            <input
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(slugify(e.target.value))
              }}
              className={`${inputClass} font-mono`}
              placeholder="repotting-workshop-spring-ready"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kind of event">
              <select name="type" defaultValue={initial.type} className={inputClass}>
                <option value="workshop">Workshop</option>
                <option value="tour">Plant walk</option>
                <option value="market">Plant market</option>
              </select>
            </Field>
            <Field label="Status" hint="Drafts are invisible to customers. Cancelled events stay visible, marked as cancelled.">
              <select name="status" defaultValue={initial.status} className={inputClass}>
                <option value="draft">Draft (hidden)</option>
                <option value="published">Published (open for booking)</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </Field>
          </div>
          <Field label="Description" required hint="Separate paragraphs with a blank line.">
            <textarea name="description" required rows={6} maxLength={5000} defaultValue={initial.description} className={textareaClass} />
          </Field>
          <Field label="What to expect" hint="One point per line, e.g. “Take-home pot and soil mix”. Optional.">
            <textarea name="what_to_expect" rows={4} defaultValue={initial.what_to_expect} className={textareaClass} />
          </Field>
          <ImageField name="image_url" folder="events" label="Cover image" defaultUrl={initial.image_url} hint="Shown on the calendar and the event page. Landscape works best." />
        </FormSection>

        <FormSection title="When & where" description="All times are Karachi time.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Starts" required>
              <input type="datetime-local" name="datetime" required defaultValue={initial.datetime} className={inputClass} />
            </Field>
            <Field label="Ends" hint="Optional">
              <input type="datetime-local" name="end_datetime" defaultValue={initial.end_datetime} className={inputClass} />
            </Field>
          </div>
          <Field label="Location" required hint="For a private venue, say “Address shared on WhatsApp after you book”.">
            <input name="location" required maxLength={200} defaultValue={initial.location} className={inputClass} placeholder="Muffin Greenhouse, Karachi" />
          </Field>
        </FormSection>

        <FormSection title="Price & capacity">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Price per person (PKR)" required hint="0 = free">
              <input
                type="number"
                name="price"
                min={0}
                step={1}
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className={inputClass}
              />
            </Field>
            <Field label="Total spots" required>
              <input type="number" name="spots_total" min={1} max={1000} step={1} required defaultValue={initial.spots_total} className={inputClass} />
            </Field>
            <Field label="Max per booking" required>
              <input type="number" name="max_spots_per_booking" min={1} max={20} step={1} required defaultValue={initial.max_spots_per_booking} className={inputClass} />
            </Field>
          </div>
          <p className="text-[13px] text-muted-foreground">
            {price > 0
              ? "Paid events hold a customer's spot for 24 hours. If you haven't marked the booking paid by then, the spot is released automatically."
              : "Free events confirm instantly."}
          </p>
        </FormSection>
      </div>

      <FormActions className="justify-end">
        <Link href="/admin/events" className={buttonClass({ variant: "ghost", size: "lg" })}>
          Cancel
        </Link>
        <button type="submit" disabled={isSaving} className={buttonClass({ variant: "primary", size: "lg" })}>
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {isSaving ? "Saving…" : submitLabel}
        </button>
      </FormActions>
    </form>
  )
}
