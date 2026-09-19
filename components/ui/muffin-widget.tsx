"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, X, Sparkle } from "lucide-react"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { getMuffinResponse, MUFFIN_QUICK_REPLIES } from "@/lib/muffin-engine"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
}

const quickReplies = MUFFIN_QUICK_REPLIES

// ponytail: Responses now from getMuffinResponse()

export function MuffinWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "Need help finding a plant?", sender: "bot" },
  ])
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const prefersReducedMotion = useReducedMotion()

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: prefersReducedMotion ? "auto" : "smooth" })
  }, [messages, prefersReducedMotion])

  const handleSend = () => {
    if (!input.trim()) return
    setMessages(prev => [...prev, { id: Date.now().toString(), text: input, sender: "user" }])
    setInput("")
    setTimeout(() => {
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), text: getMuffinResponse(input), sender: "bot" }])
    }, 600)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 touch-target"
        aria-label="Open chat with Muffin"
      >
        <Sparkle className="w-5 h-5" aria-hidden="true" />
      </button>

      {isOpen && (
        prefersReducedMotion ? (
          <>
            <div
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              role="dialog"
              aria-modal="true"
              aria-labelledby="muffin-widget-title"
            />
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background z-50 flex flex-col border-l border-border">
              <div className="p-4 border-b border-border flex items-center justify-between bg-card">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground text-xs font-bold" aria-hidden="true">M</span>
                  </div>
                  <span id="muffin-widget-title" className="font-medium text-foreground">Muffin</span>
                </div>
                <button 
                  onClick={() => setIsOpen(false)} 
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
                      "max-w-[80%] px-4 py-2 text-sm rounded-2xl",
                      m.sender === "user" 
                        ? "bg-primary text-primary-foreground rounded-br-md" 
                        : "bg-muted text-muted-foreground rounded-bl-md"
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
                      onClick={() => {
                        setMessages(prev => [...prev, { id: Date.now().toString(), text: q, sender: "user" }])
                        setMessages(prev => [...prev, { id: (Date.now()+1).toString(), text: getMuffinResponse(q), sender: "bot" }])
                      }}
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
                    onKeyDown={e => e.key === "Enter" && handleSend()}
                    placeholder="Ask about plants..."
                    className="flex-1 min-h-11 px-4 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Type your message"
                  />
                  <button 
                    onClick={handleSend} 
                    className="w-11 h-11 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:brightness-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 touch-target-sm"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <AnimatePresence>
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                aria-hidden="true"
              />
              <motion.div
                initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed right-0 top-0 h-full w-full max-w-md bg-background z-50 flex flex-col border-l border-border"
                role="dialog"
                aria-modal="true"
                aria-labelledby="muffin-widget-title-animated"
              >
                <div className="p-4 border-b border-border flex items-center justify-between bg-card">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground text-xs font-bold" aria-hidden="true">M</span>
                    </div>
                    <span id="muffin-widget-title-animated" className="font-medium text-foreground">Muffin</span>
                  </div>
                  <button 
                    onClick={() => setIsOpen(false)} 
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
                        "max-w-[80%] px-4 py-2 text-sm rounded-2xl",
                        m.sender === "user" 
                          ? "bg-primary text-primary-foreground rounded-br-md" 
                          : "bg-muted text-muted-foreground rounded-bl-md"
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
                        onClick={() => {
                          setMessages(prev => [...prev, { id: Date.now().toString(), text: q, sender: "user" }])
                          setTimeout(() => setMessages(prev => [...prev, { id: (Date.now()+1).toString(), text: getMuffinResponse(q), sender: "bot" }]), 400)
                        }}
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
                      onKeyDown={e => e.key === "Enter" && handleSend()}
                      placeholder="Ask about plants..."
                      className="flex-1 min-h-11 px-4 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      aria-label="Type your message"
                    />
                    <button 
                      onClick={handleSend} 
                      className="w-11 h-11 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:brightness-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 touch-target-sm"
                      aria-label="Send message"
                    >
                      <Send className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          </AnimatePresence>
        )
      )}
    </>
  )
}
