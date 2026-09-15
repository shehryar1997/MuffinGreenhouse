import type { Metadata } from "next"
import { Playfair_Display, Inter, JetBrains_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { CartProvider } from "@/components/providers/cart-provider"
import { SearchProvider } from "@/components/providers/search-provider"
import { Toaster } from "@/components/ui/sonner"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { CartDrawer } from "@/components/cart/cart-drawer"
import { SearchDrawer } from "@/components/search/search-drawer"
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
      <head>
        <meta name="theme-color" content="#F7F3EA" />
      </head>
      <body className={`${playfair.variable} ${inter.variable} ${jetbrains.variable} font-sans`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:rounded focus:shadow-lg focus:text-dark focus:font-medium">
          Skip to content
        </a>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <SearchProvider>
            <CartProvider>
              <div className="relative min-h-screen flex flex-col">
                <Header />
                <main id="main-content" className="flex-1">{children}</main>
                <Footer />
              </div>
              <CartDrawer />
              <SearchDrawer />
              <MuffinWidget />
              <Toaster position="bottom-right" />
            </CartProvider>
          </SearchProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
