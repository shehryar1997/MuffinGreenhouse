"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Send, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getMuffinResponse, MUFFIN_QUICK_REPLIES } from "@/lib/muffin-engine"
import { askMuffin } from "@/config/nav.config"

interface Message { id: string; text: string; sender: "user" | "bot"; timestamp: Date }

const quickReplies = MUFFIN_QUICK_REPLIES

export function MuffinPageClient() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "Hi! I am Muffin, your plant guide. What are you looking for today?", sender: "bot", timestamp: new Date() },
  ])
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }) }, [messages])

  // Takes the text as an argument: quick replies used to call setInput(reply) then handleSend(), which
  // still read the OLD input state, so each click sent the previous label (and the first click did nothing).
  const send = (raw: string) => {
    const text = raw.trim()
    if (!text) return
    setMessages(m => [...m, { id: Date.now().toString(), text, sender: "user", timestamp: new Date() }])
    setInput("")
    setTimeout(() => {
      setMessages(m => [...m, { id: (Date.now() + 1).toString(), text: getMuffinResponse(text), sender: "bot", timestamp: new Date() }])
    }, 500)
  }
  const handleSend = () => send(input)

  return (
    <div className="bg-ink min-h-[calc(100vh-80px)] flex flex-col">
      <div className="flex-1 container mx-auto px-4 max-w-3xl py-8 flex flex-col">
        <div className="text-center mb-6">
          <h1 className="inline-flex items-center gap-3 rounded-full bg-paper py-2 pl-3 pr-6">
            <Image src={askMuffin.logo} alt="" width={askMuffin.logoWidth} height={askMuffin.logoHeight} className="h-10 w-auto object-contain" priority />
            <span className="font-serif text-2xl text-ink">{askMuffin.name}</span>
          </h1>
        </div>

        <div ref={scrollRef} role="log" aria-live="polite" aria-label="Conversation with Muffin" className="flex-1 overflow-y-auto space-y-4 mb-6 px-4">
          <AnimatePresence>
            {messages.map((m) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-4 ${m.sender === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${m.sender === "bot" ? "bg-paper" : "bg-ink-muted"}`}>
                  {m.sender === "bot"
                    ? <Image src={askMuffin.logo} alt="" width={askMuffin.logoWidth} height={askMuffin.logoHeight} className="h-auto w-7 object-contain" />
                    : <User className="w-5 h-5 text-paper" aria-hidden="true" />}
                </div>
                <div className={`max-w-[75%] p-4 rounded-2xl ${m.sender === "bot" ? "bg-paper text-ink rounded-tl-none" : "bg-clay-500 text-white rounded-tr-none"}`}>
                  <p>{m.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 px-4">
            {quickReplies.map(reply => <button key={reply} type="button" onClick={() => send(reply)} className="px-4 py-2 text-sm bg-white/10 text-paper rounded-full hover:bg-white/20 transition-colors">{reply}</button>)}
          </div>
          <div className="flex gap-2">
            <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} placeholder="Type your question..." aria-label="Type your question" className="flex-1 bg-white/10 border-white/20 text-paper placeholder:text-paper-dim/70" />
            <Button onClick={handleSend} className="bg-clay-500 hover:bg-clay-600" aria-label="Send message"><Send className="w-4 h-4" aria-hidden="true" /></Button>
          </div>
        </div>
      </div>
    </div>
  )
}