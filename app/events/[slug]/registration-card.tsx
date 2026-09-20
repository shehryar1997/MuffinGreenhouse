"use client"

import { useState, useTransition } from "react"
import { CalendarPlus, Check, Copy, MessageCircle, Users } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PAYMENT_ACCOUNTS } from "@/config/payment-accounts"
import { siteConfig } from "@/config/nav.config"
import { formatEventPrice, googleCalendarLink } from "@/lib/event-format"
import type { Event } from "@/types"
import { registerForEvent, type RegisterForEventResult } from "./actions"

interface Props {
  event: Event
  prefill?: { name: string; phone: string; email: string }
}

const whatsappNumber = siteConfig.whatsappNumber.replace(/\D/g, "")

export function RegistrationCard({ event, prefill }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [booked, setBooked] = useState<Extract<RegisterForEventResult, { ok: true }> | null>(null)
  const [name, setName] = useState(prefill?.name ?? "")
  const [phone, setPhone] = useState(prefill?.phone ?? "")
  const [email, setEmail] = useState(prefill?.email ?? "")
  const [spots, setSpots] = useState(1)

  const maxSpots = Math.max(1, Math.min(event.maxSpotsPerBooking, event.spotsRemaining))
  const taken = event.spotsTotal - event.spotsRemaining
  const fillPct = Math.min(100, Math.round((taken / event.spotsTotal) * 100))
  const total = event.price * spots

  if (booked) {
    return <BookedView event={event} booking={booked} name={name} email={email.trim()} />
  }

  // Closed states share one shape: a short explanation and a way to get help.
  const closed =
    event.status === "cancelled"
      ? { title: "This event was cancelled", body: "We're sorry. Message us on WhatsApp and we'll help with any booking you already made." }
      : !event.isUpcoming
        ? { title: "This event has finished", body: "Follow the calendar for the next one." }
        : event.spotsRemaining === 0
          ? { title: "Fully booked", body: "Message us on WhatsApp and we'll add you to the waitlist in case a spot opens up." }
          : null

  const emailRequired = event.price > 0

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (emailRequired && !email.trim()) {
      setError("Please add your e-mail address. We send your booking and payment details there.")
      return
    }
    startTransition(async () => {
      const result = await registerForEvent({ eventId: event.id, name, phone, email, spots })
      if (result.ok) {
        setBooked(result)
        window.scrollTo({ top: 0, behavior: "smooth" })
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-28">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="inline-flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" aria-hidden />
          {taken} of {event.spotsTotal} spots taken
        </span>
        {!closed && event.spotsRemaining <= 3 && <span className="font-medium text-primary">{event.spotsRemaining} left</span>}
      </div>
      <div
        className="mb-6 h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={event.spotsTotal}
        aria-valuenow={taken}
        aria-label="Spots taken"
      >
        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${fillPct}%` }} />
      </div>

      <div className="mb-6 flex items-baseline justify-between border-b border-border pb-6">
        <div>
          <p className="mb-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">Price</p>
          <p className="font-serif text-3xl text-foreground">{formatEventPrice(event.price)}</p>
        </div>
        {event.price > 0 && <span className="font-mono text-xs text-muted-foreground">per person</span>}
      </div>

      {closed ? (
        <div className="text-center">
          <p className="mb-2 font-serif text-xl text-foreground">{closed.title}</p>
          <p className="mb-5 text-sm text-muted-foreground">{closed.body}</p>
          <Button asChild variant="outline" className="w-full">
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi Muffin! About "${event.title}".`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="mr-2 h-4 w-4" aria-hidden />
              Message us
            </a>
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field id="reg-name" label="Full name">
            <Input id="reg-name" name="name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </Field>
          <Field id="reg-phone" label="WhatsApp number" hint="We confirm your spot here">
            <Input
              id="reg-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              required
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0300 1234567"
            />
          </Field>
          <Field id="reg-email" label="E-mail" hint={emailRequired ? "We send your booking and payment details here" : "Optional"}>
            <Input id="reg-email" name="email" type="email" required={emailRequired} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </Field>
          {maxSpots > 1 && (
            <Field id="reg-spots" label="How many people?">
              <select
                id="reg-spots"
                value={spots}
                onChange={(e) => setSpots(Number(e.target.value))}
                className="flex h-11 w-full rounded-md border border-input bg-background px-4 py-2 text-base md:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {Array.from({ length: maxSpots }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "person" : "people"}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={isPending}>
            {isPending ? "Booking…" : event.price === 0 ? "Reserve my free spot" : `Reserve · ${formatEventPrice(total)}`}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            {event.price === 0
              ? "Free events confirm instantly."
              : "No payment now. We hold your spot for 24 hours while you pay by bank transfer or wallet."}
          </p>
        </form>
      )}
    </div>
  )
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-foreground">
        <span>{label}</span>
        {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error("Couldn't copy. Please select the text instead.")
    }
  }
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-2 font-mono text-foreground hover:text-primary"
        aria-label={`Copy ${label}`}
      >
        {value}
        {copied ? <Check className="h-3.5 w-3.5 text-primary" aria-hidden /> : <Copy className="h-3.5 w-3.5 opacity-60" aria-hidden />}
      </button>
    </div>
  )
}

function BookedView({ event, booking, name, email }: { event: Event; booking: Extract<RegisterForEventResult, { ok: true }>; name: string; email: string }) {
  const firstName = name.trim().split(/\s+/)[0]
  const receiptMessage = `Hi Muffin! I'm ${name.trim()}. Booking ${booking.reference} for "${event.title}" (${booking.spots} ${booking.spots === 1 ? "person" : "people"}). Here is my payment receipt for ${formatEventPrice(booking.amountDue)}:`
  const confirmMessage = `Hi Muffin! I'm ${name.trim()}. I just booked "${event.title}" (${booking.reference}).`
  const calendar = googleCalendarLink({
    title: event.title,
    startIso: event.datetime,
    endIso: event.endDatetime,
    location: event.location,
    details: `Muffin Greenhouse · booking ${booking.reference}`,
  })

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-28" role="status" aria-live="polite">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-6 w-6" strokeWidth={3} aria-hidden />
        </span>
        <div>
          <p className="font-serif text-xl text-foreground">{booking.free ? `You're in, ${firstName}!` : `Spot held, ${firstName}!`}</p>
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Booking {booking.reference}</p>
        </div>
      </div>

      {booking.free ? (
        <p className="mb-5 text-sm text-muted-foreground">
          {booking.spots} {booking.spots === 1 ? "spot is" : "spots are"} reserved. We&apos;ll message you on WhatsApp with the final details before the day.
        </p>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            We&apos;re holding {booking.spots === 1 ? "your spot" : `your ${booking.spots} spots`} for <strong className="text-foreground">24 hours</strong>. Pay{" "}
            <strong className="text-foreground">{formatEventPrice(booking.amountDue)}</strong> to any account below, then send the receipt on WhatsApp quoting{" "}
            <strong className="text-foreground">{booking.reference}</strong>.
          </p>
          <div className="mb-5 divide-y divide-border rounded-xl border border-border px-4">
            {Object.values(PAYMENT_ACCOUNTS).map((account) => (
              <div key={account.title} className="py-3">
                <p className="mb-1 text-sm font-medium text-foreground">{account.title}</p>
                {account.details.map((d) => (
                  <CopyRow key={d.label} label={d.label} value={d.value} />
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {email && <p className="mb-5 text-xs text-muted-foreground">We&apos;re also e-mailing these details to {email}.</p>}

      <div className="space-y-2.5">
        <Button asChild className="w-full bg-[#25D366] text-white hover:bg-[#128C7E] hover:brightness-100">
          <a
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(booking.free ? confirmMessage : receiptMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="mr-2 h-4 w-4" aria-hidden />
            {booking.free ? "Confirm on WhatsApp" : "Send receipt on WhatsApp"}
          </a>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <a href={calendar} target="_blank" rel="noopener noreferrer">
            <CalendarPlus className="mr-2 h-4 w-4" aria-hidden />
            Add to calendar
          </a>
        </Button>
      </div>
    </div>
  )
}
