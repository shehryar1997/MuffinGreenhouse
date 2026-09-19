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
  // On checkout the chat launcher sits over the form fields on phones; the WhatsApp help button stays.
  const isCheckout = pathname?.startsWith("/checkout")
  // The payment page has its own WhatsApp buttons, and the floating one covered the copy icons on the bank rows.
  const isPay = pathname?.startsWith("/checkout/pay")

  if (isAdmin) {
    return <>{children}</>
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <SearchDrawer />
      {!isCheckout && <MuffinWidget />}
      {!isPay && <WhatsAppButton />}
    </div>
  )
}
