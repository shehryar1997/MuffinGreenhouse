"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Send, X } from "lucide-react"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { getMuffinResponse, MUFFIN_QUICK_REPLIES } from "@/lib/muffin-engine"
import { askMuffin } from "@/config/nav.config"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
}

const quickReplies = MUFFIN_QUICK_REPLIES

// ponytail: Responses now from getMuffinResponse()

/** The logo on a light chip. The logo has a dark outline, so it needs a light backdrop in dark mode too. */
function LogoChip({ className, imgClassName }: { className?: string; imgClassName?: string }) {
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-paper ring-1 ring-forest-200", className)}>
      <Image src={askMuffin.logo} alt="" width={askMuffin.logoWidth} height={askMuffin.logoHeight} className={cn("h-auto w-3/4 object-contain", imgClassName)} />
    </span>
  )
}

/** Floating "Ask Muffin" button. Text shows from sm up; phones get just the logo so it doesn't cover the buy bar. */
export function AskMuffinLauncher({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-2.5 rounded-full border border-border bg-background p-1.5 shadow-xl transition duration-300 hover:-translate-y-0.5 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:pr-5"
      aria-label="Open Ask Muffin chat"
    >
      <LogoChip className="h-11 w-11" imgClassName="transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" />
      <span className="hidden font-serif text-base leading-none text-foreground sm:inline">{askMuffin.name}</span>
    </button>
  )
}

export function MuffinWidget({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "Need help finding a plant?", sender: "bot" },
  ])
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const close = () => onOpenChange(false)

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: prefersReducedMotion ? "auto" : "smooth" })
  }, [messages, prefersReducedMotion])

  // Escape closes the panel (keyboard users had no way out short of tabbing to the X).
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onOpenChange(false) }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onOpenChange])

  const send = (raw: string, replyDelay: number) => {
    const text = raw.trim()
    if (!text) return
    setMessages(prev => [...prev, { id: Date.now().toString(), text, sender: "user" }])
    setInput("")
    setTimeout(() => {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: getMuffinResponse(text), sender: "bot" }])
    }, replyDelay)
  }

  const panelBody = (
    <>
      <div className="p-4 border-b border-border flex items-center justify-between bg-card">
        <div className="flex items-center gap-2.5">
          <LogoChip className="h-10 w-10" />
          <span id="muffin-widget-title" className="font-serif text-lg text-foreground">{askMuffin.name}</span>
        </div>
        <button
          onClick={close}
          className="p-2 hover:bg-muted rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 touch-target-sm"
          aria-label="Close chat"
        >
          <X className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain" role="log" aria-live="polite" aria-label="Chat messages">
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.sender === "user" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[80%] px-4 py-2 text-sm rounded-2xl break-words",
              m.sender === "user"
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted text-foreground rounded-bl-md"
            )}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border bg-card">
        <div className="flex gap-2 flex-wrap mb-3">
          {quickReplies.map(q => (
            <button
              key={q}
              onClick={() => send(q, 400)}
              className="px-3 py-1.5 text-xs bg-muted text-foreground rounded-full hover:bg-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 touch-target-sm"
            >
              {q}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send(input, 600)}
            placeholder="Ask about plants..."
            className="flex-1 min-h-11 px-4 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Type your message"
          />
          <button
            onClick={() => send(input, 600)}
            className="w-11 h-11 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:brightness-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 touch-target-sm"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </>
  )

  const backdropClass = "fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
  const panelClass = "fixed right-0 top-0 h-full w-full max-w-md bg-background z-50 flex flex-col border-l border-border"

  if (prefersReducedMotion) {
    return open ? (
      <>
        <div onClick={close} className={backdropClass} aria-hidden="true" />
        <div role="dialog" aria-modal="true" aria-labelledby="muffin-widget-title" className={panelClass}>
          {panelBody}
        </div>
      </>
    ) : null
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="muffin-backdrop"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={close}
          className={backdropClass}
          aria-hidden="true"
        />
      )}
      {open && (
        <motion.div
          key="muffin-panel"
          initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className={panelClass}
          role="dialog"
          aria-modal="true"
          aria-labelledby="muffin-widget-title"
        >
          {panelBody}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
