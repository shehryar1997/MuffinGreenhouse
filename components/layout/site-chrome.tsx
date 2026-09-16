"use client"

import { usePathname } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { CartDrawer } from "@/components/cart/cart-drawer"
import { SearchDrawer } from "@/components/search/search-drawer"
import { MuffinWidget } from "@/components/ui/muffin-widget"
import { WhatsAppButton } from "@/components/ui/whatsapp-button"

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith("/admin")

  if (isAdmin) {
    return <>{children}</>
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <SearchDrawer />
      <MuffinWidget />
      <WhatsAppButton />
    </div>
  )
}
