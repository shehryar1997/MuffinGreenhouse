"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Heart, Home, Search, ShoppingBag, Store } from "lucide-react"
import { useCart } from "@/components/providers/cart-provider"
import { useSearch } from "@/components/providers/search-provider"
import { useWishlist } from "@/components/providers/wishlist-provider"
import { cn } from "@/lib/utils"

/** Height of the bar, so fixed elements and page padding can clear it. Phones and tablets only (hidden from `lg` up). */
export const MOBILE_TAB_BAR_HEIGHT = "3.5rem"

/** The tab bar is left off the checkout, where the form needs the whole screen. */
export function showsMobileTabBar(pathname: string | null) {
  return !pathname?.startsWith("/checkout")
}

const tabClass =
  "relative flex min-h-[3.5rem] flex-1 flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground transition-colors active:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"

function Badge({ count }: { count: number }) {
  if (count < 1) return null
  return (
    <span className="absolute -right-2 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 font-mono text-[11px] font-semibold text-primary-foreground">
      {count > 9 ? "9+" : count}
    </span>
  )
}

export function MobileTabBar({ onShop }: { onShop: () => void }) {
  const pathname = usePathname()
  const { toggleCart, itemCount } = useCart()
  const { openSearch } = useSearch()
  const { count: wishlistCount } = useWishlist()

  if (!showsMobileTabBar(pathname)) return null

  const onHome = pathname === "/"
  const onShopPages = !!pathname?.startsWith("/shop")

  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background/95 backdrop-blur-sm lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <Link href="/" className={cn(tabClass, onHome && "text-primary")} aria-current={onHome ? "page" : undefined}>
        <Home className="h-5 w-5" aria-hidden="true" />
        Home
      </Link>
      <button type="button" onClick={onShop} className={cn(tabClass, onShopPages && "text-primary")} aria-haspopup="dialog">
        <Store className="h-5 w-5" aria-hidden="true" />
        Shop
      </button>
      <button type="button" onClick={openSearch} className={tabClass}>
        <Search className="h-5 w-5" aria-hidden="true" />
        Search
      </button>
      <Link href="/wishlist" className={cn(tabClass, pathname === "/wishlist" && "text-primary")} aria-label={`Wishlist, ${wishlistCount} saved`}>
        <span className="relative">
          <Heart className="h-5 w-5" aria-hidden="true" />
          <Badge count={wishlistCount} />
        </span>
        Wishlist
      </Link>
      <button type="button" onClick={() => toggleCart(true)} className={tabClass} aria-label={`Cart, ${itemCount} items`}>
        <span className="relative">
          <ShoppingBag className="h-5 w-5" aria-hidden="true" />
          <Badge count={itemCount} />
        </span>
        Cart
      </button>
    </nav>
  )
}
