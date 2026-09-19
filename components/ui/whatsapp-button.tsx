"use client"

import { MessageCircle } from "lucide-react"
import { siteConfig } from "@/config/nav.config"

export function WhatsAppButton() {
  const message = encodeURIComponent("Hi Muffin! I have a question about your plants.")
  const whatsappUrl = `https://wa.me/${siteConfig.whatsappNumber.replace(/\D/g, "")}?text=${message}`

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform duration-300 group"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-7 h-7 text-white fill-white" />
      <span className="absolute right-full mr-3 px-3 py-1.5 bg-ink text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Chat with us
      </span>
    </a>
  )
}
