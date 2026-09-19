import type { Metadata } from "next"
import { Playfair_Display, Inter, JetBrains_Mono } from "next/font/google"
import { GoogleAnalytics } from "@next/third-parties/google"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { CartProvider } from "@/components/providers/cart-provider"
import { SearchProvider } from "@/components/providers/search-provider"
import { WishlistProvider } from "@/components/providers/wishlist-provider"
import { Toaster } from "@/components/ui/sonner"
import { SiteChrome } from "@/components/layout/site-chrome"
import { generateOrganizationSchema, serializeJsonLd } from "@/lib/structured-data"
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.muffinplants.com"

export const metadata: Metadata = {
  // Lets the file-based opengraph-image / twitter-image (and any relative canonical) resolve to absolute URLs.
  metadataBase: new URL(SITE_URL),
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
    siteName: "Muffin Greenhouse",
  },
  twitter: { card: "summary_large_image" },
  // ponytail: no site-wide canonical here. A single root canonical is inherited by every page that doesn't set
  // its own, which told search engines that every product/category/policy page was a copy of the home page.
  // Pages that should be indexed set their own (see app/page.tsx, shop, product, category).
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
        <meta name="theme-color" content="#F7F3EA" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#12160E" media="(prefers-color-scheme: dark)" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationSchema) }}
        />
      </head>
      <body className={`${playfair.variable} ${inter.variable} ${jetbrains.variable} font-sans antialiased`}>
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <SearchProvider>
            <CartProvider>
              <WishlistProvider>
                <SiteChrome>{children}</SiteChrome>
                {/* Top-center: bottom-right collided with the cart drawer's buttons and the floating chat/WhatsApp buttons. */}
                <Toaster position="top-center" />
              </WishlistProvider>
            </CartProvider>
          </SearchProvider>
        </ThemeProvider>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ""} />
      </body>
    </html>
  )
}
