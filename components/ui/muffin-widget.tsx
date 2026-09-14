"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, X, Sparkle } from "lucide-react"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
}

const quickReplies = [
  "Low light survivors",
  "Pet safe plants", 
  "Beginner friendly",
  "Workshop schedule",
]

const responses: Record<string, string> = {
  "low": "Snake plants, Pothos, ZZ — all indestructible. 18 in stock.",
  "pet": "Spider plant, Peperomia, Calathea. All non-toxic. 🐾",
  "beginner": "Snake plant. Water once a month. That's it.",
  "workshop": "Next one: Feb 10, Repotting. /events",
  "default": "Ask about plants, care, or orders.",
}

export function MuffinWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "Need help finding a plant?", sender: "bot" },
  ])
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  const getResponse = (text: string) => {
    const lower = text.toLowerCase()
    if (lower.includes("low") || lower.includes("dark")) return responses["low"]
    if (lower.includes("pet")) return responses["pet"]
    if (lower.includes("beginner") || lower.includes("easy")) return responses["beginner"]
    if (lower.includes("workshop")) return responses["workshop"]
    return responses["default"]
  }

  const handleSend = () => {
    if (!input.trim()) return
    setMessages(prev => [...prev, { id: Date.now().toString(), text: input, sender: "user" }])
    setInput("")
    setTimeout(() => {
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), text: getResponse(input), sender: "bot" }])
    }, 600)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-[#d95d2c] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
      >
        <Sparkle className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 z-50"
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 flex flex-col"
            >
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#d95d2c] rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">M</span>
                  </div>
                  <span className="font-medium">Muffin</span>
                </div>
                <button onClick={() => setIsOpen(false)}><X className="w-5 h-5" /></button>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : ""}`}>
                    <div className={`max-w-[80%] px-4 py-2 text-sm rounded-full ${
                      m.sender === "user" ? "bg-[#1a1a1a] text-white" : "bg-[#f5f2eb] text-[#1a1a1a]"
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t">
                <div className="flex gap-2 flex-wrap mb-3">
                  {quickReplies.map(q => (
                    <button
                      key={q}
                      onClick={() => {
                        setMessages(prev => [...prev, { id: Date.now().toString(), text: q, sender: "user" }])
                        setTimeout(() => setMessages(prev => [...prev, { id: (Date.now()+1).toString(), text: getResponse(q), sender: "bot" }]), 400)
                      }}
                      className="px-3 py-1 text-xs bg-[#f5f2eb] rounded-full hover:bg-[#e8e3da]"
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSend()}
                    placeholder="Ask..."
                    className="flex-1 px-4 py-2 border rounded-full text-sm focus:outline-none focus:border-[#d95d2c]"
                  />
                  <button onClick={handleSend} className="w-10 h-10 bg-[#d95d2c] text-white rounded-full flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
