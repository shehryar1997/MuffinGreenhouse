"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Bot, User, Leaf } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getMuffinResponse, MUFFIN_QUICK_REPLIES } from "@/lib/muffin-engine"

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
    <div className="bg-forest-950 min-h-[calc(100vh-80px)] flex flex-col">
      <div className="flex-1 container mx-auto px-4 max-w-3xl py-8 flex flex-col">
        <div className="text-center mb-6">
          <h1 className="inline-flex items-center gap-2 px-4 py-2 bg-sprout-300/20 rounded-full">
            <Leaf className="w-5 h-5 text-sprout-300" aria-hidden="true" />
            <span className="font-mono text-base text-sprout-300">Muffin Intelligence</span>
          </h1>
        </div>

        <div ref={scrollRef} role="log" aria-live="polite" aria-label="Conversation with Muffin" className="flex-1 overflow-y-auto space-y-4 mb-6 px-4">
          <AnimatePresence>
            {messages.map((m) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-4 ${m.sender === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${m.sender === "bot" ? "bg-clay-500" : "bg-forest-700"}`}>
                  {m.sender === "bot" ? <Bot className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-cream-100" />}
                </div>
                <div className={`max-w-[75%] p-4 rounded-2xl ${m.sender === "bot" ? "bg-cream-100 text-forest-900 rounded-tl-none" : "bg-clay-500 text-white rounded-tr-none"}`}>
                  <p>{m.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 px-4">
            {quickReplies.map(reply => <button key={reply} type="button" onClick={() => send(reply)} className="px-4 py-2 text-sm bg-white/10 text-cream-100 rounded-full hover:bg-white/20 transition-colors">{reply}</button>)}
          </div>
          <div className="flex gap-2">
            <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} placeholder="Type your question..." aria-label="Type your question" className="flex-1 bg-white/10 border-white/20 text-cream-100 placeholder:text-cream-300/70" />
            <Button onClick={handleSend} className="bg-clay-500 hover:bg-clay-600" aria-label="Send message"><Send className="w-4 h-4" aria-hidden="true" /></Button>
          </div>
        </div>
      </div>
    </div>
  )
}