"use client"

import { useState } from "react"
import { AskMuffinLauncher, MuffinWidget } from "@/components/ui/muffin-widget"
import { WhatsAppButton } from "@/components/ui/whatsapp-button"

// The floating WhatsApp and Ask Muffin buttons live in ONE column so the gap between them can't drift
// (they used to be positioned separately and touched). Each page decides which of the two to show.
export function FloatingActions({ showChat, showWhatsApp }: { showChat: boolean; showWhatsApp: boolean }) {
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <>
      <div className="fixed bottom-5 right-4 z-40 flex flex-col items-end gap-4 sm:bottom-6 sm:right-6">
        {showWhatsApp && <WhatsAppButton />}
        {showChat && <AskMuffinLauncher onClick={() => setChatOpen(true)} />}
      </div>
      <MuffinWidget open={showChat && chatOpen} onOpenChange={setChatOpen} />
    </>
  )
}
