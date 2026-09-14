import type { Metadata } from "next"
import { Playfair_Display, Inter, JetBrains_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { CartProvider } from "@/components/providers/cart-provider"
import { Toaster } from "@/components/ui/sonner"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { CartDrawer } from "@/components/cart/cart-drawer"
import { MuffinWidget } from "@/components/ui/muffin-widget"
import "./globals.css"

const playfair = Playfair_Display({ 
  subsets: ["latin"], 
  variable: "--font-serif",
  display: "swap",
  weight: ["400", "500", "600"],
})

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600"],
})

const jetbrains = JetBrains_Mono({ 
  subsets: ["latin"], 
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
})

export const metadata: Metadata = {
  title: "Muffin / greenhouse — Good plants. Good energy.",
  description: "A plant nursery for Karachi, Pakistan. Locally grown plants for real homes, with honest care advice.",
  keywords: ["plants", "nursery", "Karachi", "succulents", "aroids", "hoya", "monstera"],
  openGraph: {
    title: "Muffin — Good plants. Good energy.",
    description: "A plant nursery for Karachi, Pakistan. Locally grown plants for real homes.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${playfair.variable} ${inter.variable} ${jetbrains.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <CartProvider>
            <div className="relative min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <CartDrawer />
            <MuffinWidget />
            <Toaster position="bottom-right" />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
