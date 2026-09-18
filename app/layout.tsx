import type { Metadata } from "next"
import { Playfair_Display, Inter, JetBrains_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { CartProvider } from "@/components/providers/cart-provider"
import { SearchProvider } from "@/components/providers/search-provider"
import { WishlistProvider } from "@/components/providers/wishlist-provider"
import { Toaster } from "@/components/ui/sonner"
import { SiteChrome } from "@/components/layout/site-chrome"
import { generateOrganizationSchema } from "@/lib/structured-data"
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
  title: {
    default: "Buy Plants Online in Karachi - Muffin Greenhouse",
    template: "%s - Muffin Greenhouse",
  },
  description: "Locally grown indoor plants, pots, and plant care supplies for Karachi homes. Delivery across Pakistan with care tips and 30-day plant guarantee.",
  keywords: ["plants", "nursery", "Karachi", "Pakistan", "succulents", "aroids", "hoya", "monstera", "indoor plants", "snake plant", "online plant shop"],
  openGraph: {
    title: "Muffin Greenhouse - Good Plants. Good Energy.",
    description: "Locally grown indoor plants for Karachi homes. Delivery across Pakistan.",
    type: "website",
    locale: "en_PK",
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || "https://www.muffinplants.com",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const organizationSchema = generateOrganizationSchema()

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#F7F3EA" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema, null, 2) }}
        />
      </head>
      <body className={`${playfair.variable} ${inter.variable} ${jetbrains.variable} font-sans`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:rounded focus:shadow-lg focus:text-dark focus:font-medium">
          Skip to content
        </a>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <SearchProvider>
            <CartProvider>
              <WishlistProvider>
                <SiteChrome>{children}</SiteChrome>
                <Toaster position="bottom-right" />
              </WishlistProvider>
            </CartProvider>
          </SearchProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
