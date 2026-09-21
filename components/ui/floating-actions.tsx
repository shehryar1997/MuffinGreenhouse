"use client"

import { useState } from "react"
import { AskMuffinLauncher, MuffinWidget } from "@/components/ui/muffin-widget"
import { WhatsAppButton } from "@/components/ui/whatsapp-button"
import { showsMobileTabBar } from "@/components/layout/mobile-tab-bar"
import { usePathname } from "next/navigation"

// The floating WhatsApp and Ask Muffin buttons live in ONE column so the gap between them can't drift
// (they used to be positioned separately and touched). Each page decides which of the two to show.
export function FloatingActions({ showChat, showWhatsApp }: { showChat: boolean; showWhatsApp: boolean }) {
  const [chatOpen, setChatOpen] = useState(false)
  // Below lg the bottom tab bar is fixed to the screen edge, so the buttons sit above it.
  const aboveTabBar = showsMobileTabBar(usePathname())

  return (
    <>
      <div
        className={`fixed right-4 z-40 flex flex-col items-end gap-3 sm:right-6 sm:gap-4 lg:bottom-6 ${aboveTabBar ? "bottom-[calc(3.5rem+env(safe-area-inset-bottom)+1rem)] sm:bottom-[calc(3.5rem+env(safe-area-inset-bottom)+1.5rem)]" : "bottom-5 sm:bottom-6"}`}
      >
        {showWhatsApp && <WhatsAppButton />}
        {showChat && <AskMuffinLauncher onClick={() => setChatOpen(true)} />}
      </div>
      <MuffinWidget open={showChat && chatOpen} onOpenChange={setChatOpen} />
    </>
  )
}
