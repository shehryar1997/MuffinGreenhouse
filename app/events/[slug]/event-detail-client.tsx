"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Calendar, Clock, MapPin, Check, Users, ArrowLeft, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Event } from "@/types"
import Image from "next/image"
import Link from "next/link"

function formatTime(date: Date) {
  const hours = date.getHours()
  const minutes = date.getMinutes().toString().padStart(2, "0")
  const ampm = hours >= 12 ? "PM" : "AM"
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes} ${ampm}`
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" })
}

export default function EventDetailClient({ event }: { event: Event }) {
  const [reserved, setReserved] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const date = new Date(event.datetime)
  const isSoldOut = event.spotsRemaining === 0
  const isLowSpots = event.spotsRemaining > 0 && event.spotsRemaining <= 3

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await new Promise(r => setTimeout(r, 800))
    setIsSubmitting(false)
    setReserved(true)
  }

  if (reserved) {
    return <SuccessView event={event} />
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Hero */}
      <div className="relative min-h-[65vh] lg:min-h-[70vh]">
        <Image src={event.image} alt={event.title} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/80 via-[#1A1A1A]/20 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-end">
          <div className="container mx-auto px-6 lg:px-12 pb-12 lg:pb-16">
            <Link href="/events" className="inline-flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-white/70 hover:text-[#D4F542] transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" />All Events</Link>

            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className="bg-[#D4F542] text-[#1A1A1A] font-mono text-[10px] uppercase tracking-wider">{event.type}</Badge>
              {event.price === 0 ? (
                <Badge variant="outline" className="text-white border-white/30 font-mono text-[10px]">Free Entry</Badge>
              ) : (
                <Badge variant="outline" className="text-white border-white/30 font-mono text-[10px]">PKR {event.price.toLocaleString()}</Badge>
              )}
              {isLowSpots && !isSoldOut && <Badge className="bg-[#E85A3C] text-white font-mono text-[10px]">{event.spotsRemaining} spots left</Badge>}
              {isSoldOut && <Badge variant="outline" className="text-white border-white/30 font-mono text-[10px]">Sold Out</Badge>}
            </div>

            <h1 className="font-serif text-[clamp(2rem,5vw,4rem)] text-white leading-[0.95] tracking-tight max-w-3xl">{event.title}</h1>

            <div className="flex flex-wrap items-center gap-5 mt-6 text-white/80">
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-[#D4F542]" /><span className="font-mono text-sm">{formatDate(date)}</span></div>
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-[#D4F542]" /><span className="font-mono text-sm">{formatTime(date)}</span></div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#D4F542]" /><span className="font-mono text-sm">{event.location}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 lg:px-12 py-12 lg:py-20">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
          {/* Left - Description */}
          <div className="lg:col-span-7">
            <span className="font-mono text-xs text-[#E85A3C] tracking-widest uppercase mb-3 block">About</span>
            <p className="text-lg text-[#1A1A1A]/80 leading-relaxed">{event.description}</p>

            <div className="mt-10 p-6 bg-[#1A1A1A]/[0.03] rounded-xl border border-[#1A1A1A]/5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[#E85A3C]" />
                <h3 className="font-serif text-lg text-[#1A1A1A]">What to expect</h3>
              </div>
              <ul className="space-y-2.5 text-[#1A1A1A]/70 text-sm">
                {["Hands-on learning with expert guidance", "Small group for personalized attention", "Take-home materials and care guides", "WhatsApp support after the event"].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4F542] mt-1.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right - Reservation Card */}
          <div className="lg:col-span-4 lg:col-start-9">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#1A1A1A]/5 sticky top-24">
              {/* Capacity */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#1A1A1A]/40" />
                  <span className="font-mono text-[10px] text-[#1A1A1A]/50 uppercase tracking-wider">{event.spotsTotal - event.spotsRemaining} / {event.spotsTotal} taken</span>
                </div>
                {isLowSpots && <span className="text-xs text-[#E85A3C] font-medium">{event.spotsRemaining} left</span>}
              </div>

              {/* Progress bar */}
              <div className="h-1 bg-[#D4F542]/20 rounded-full overflow-hidden mb-6">
                <motion.div initial={{ width: 0 }} animate={{ width: `${((event.spotsTotal - event.spotsRemaining) / event.spotsTotal) * 100}%` }} transition={{ duration: 0.6, delay: 0.3 }} className="h-full bg-[#D4F542] rounded-full" />
              </div>

              {/* Price */}
              <div className="flex items-baseline justify-between mb-6 pb-6 border-b border-[#1A1A1A]/8">
                <div>
                  <span className="font-mono text-[10px] text-[#1A1A1A]/40 uppercase tracking-wider block mb-1">Price</span>
                  <span className="font-serif text-2xl text-[#1A1A1A]">{event.price === 0 ? "Free" : `PKR ${event.price.toLocaleString()}`}</span>
                </div>
                <span className="font-mono text-[10px] text-[#1A1A1A]/40">Per person</span>
              </div>

              {isSoldOut ? (
                <div className="text-center py-4">
                  <span className="font-serif text-lg text-[#1A1A1A] block mb-2">Sold Out</span>
                  <p className="text-sm text-[#1A1A1A]/60 mb-4">This event is at full capacity.</p>
                  <Button asChild variant="outline" className="w-full border-[#1A1A1A]/20"><Link href="/events">Explore Events</Link></Button>
                </div>
              ) : (
                <form onSubmit={handleReserve} className="space-y-3">
                  <div>
                    <label htmlFor="reserve-name" className="font-mono text-[10px] text-[#1A1A1A]/60 uppercase tracking-wider block mb-1.5">Full Name *</label>
                    <input id="reserve-name" name="name" type="text" required autoComplete="name" className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#1A1A1A]/10 rounded-lg text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:border-[#D4F542]" placeholder="Your name" />
                  </div>
                  <div>
                    <label htmlFor="reserve-phone" className="font-mono text-[10px] text-[#1A1A1A]/60 uppercase tracking-wider block mb-1.5">WhatsApp *</label>
                    <input id="reserve-phone" name="phone" type="tel" required autoComplete="tel" inputMode="tel" className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#1A1A1A]/10 rounded-lg text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:border-[#D4F542]" placeholder="03XX-XXXXXXX" />
                  </div>
                  <div>
                    <label htmlFor="reserve-guests" className="font-mono text-[10px] text-[#1A1A1A]/60 uppercase tracking-wider block mb-1.5">Guests</label>
                    <select id="reserve-guests" name="guests" className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#1A1A1A]/10 rounded-lg text-sm text-[#1A1A1A] focus:outline-none focus:border-[#D4F542]">
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} {n===1?"person":"people"}</option>)}
                    </select>
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full py-3 px-4 mt-2 bg-[#1A1A1A] text-white font-mono text-xs tracking-wider uppercase rounded-lg hover:bg-[#1A1A1A]/90 disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSubmitting ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Reserving...</> : event.price === 0 ? "Reserve Free Spot" : `Reserve — PKR ${event.price.toLocaleString()}`}
                  </button>
                  <p className="text-[10px] text-[#1A1A1A]/40 text-center">No payment now. We&apos;ll confirm via WhatsApp.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#1A1A1A]/10">
        <div className="container mx-auto px-6 lg:px-12 py-10">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#E85A3C] tracking-widest uppercase">More to Explore</span>
            <Link href="/events" className="font-mono text-xs tracking-widest uppercase text-[#1A1A1A]/60 hover:text-[#1A1A1A]">All Events →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function SuccessView({ event }: { event: Event }) {
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <div className="container mx-auto px-6 lg:px-12 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="w-20 h-20 bg-[#D4F542] rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-[#1A1A1A]" strokeWidth={3} />
          </motion.div>
          <span className="font-mono text-xs text-[#E85A3C] tracking-widest uppercase mb-3 block">You&apos;re In!</span>
          <h1 className="font-serif text-heading-2 text-[#1A1A1A] mb-3">Reserved Successfully</h1>
          <p className="text-base text-[#1A1A1A]/70 mb-2">{event.title}</p>
          <p className="text-sm text-[#1A1A1A]/50 mb-8">We&apos;ve sent a confirmation to your WhatsApp.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline" className="border-[#1A1A1A]/20"><Link href="/events">More Events</Link></Button>
            <Button asChild className="bg-[#D4F542] text-[#1A1A1A] hover:bg-[#c5e63d]"><Link href="/">Home</Link></Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}