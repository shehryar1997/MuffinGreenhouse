import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"
import { cookies } from "next/headers"
import Link from "next/link"
import { Heart, ShoppingBag, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createServerClient } from "@/lib/supabase/server-client"
import { WishlistClient } from "./wishlist-client"
import { mapSupabaseProductToProduct } from "@/lib/data/adapters"
import { Product } from "@/types"
import { SupabaseProduct } from "@/supabase/client"

export const metadata: Metadata = pageMetadata({ title: "Wishlist", description: "Your saved plants and favourites at Muffin Plants.", noindex: true })

// Match the PRODUCT_SELECT shape from lib/data/products.ts
const PRODUCT_SELECT = `
  *,
  images:product_images(id, url, alt_text, sort_order, is_primary, variant_id),
  variants:product_variants(id, sku, name, price, stock_status, stock_count, is_default, is_active)
`

interface WishlistRow {
  id: string
  product_id: string
  product: SupabaseProduct | null
}

function SignedOutState() {
  return (
    <div className="min-h-screen bg-cream-100 pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="max-w-xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-clay-100 mb-6">
            <Heart className="w-8 h-8 text-clay-500" />
          </div>
          <h1 className="font-serif text-3xl lg:text-4xl text-forest-900 mb-4">
            Your Wishlist
          </h1>
          <p className="text-forest-600 mb-8 max-w-md mx-auto">
            Sign in to save your favourite plants and view them anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="touch-target">
              <Link href="/account/login?returnTo=/wishlist">
                <User className="w-4 h-4 mr-2" />
                Sign in
              </Link>
            </Button>
            <Button asChild variant="outline" className="touch-target">
              <Link href="/account/register">Create account</Link>
            </Button>
          </div>
          <div className="mt-12 pt-8 border-t border-forest-200">
            <Link
              href="/shop/all"
              className="inline-flex items-center gap-2 text-forest-600 hover:text-clay-600 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Browse plants
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyWishlistState() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-forest-100 mb-6">
          <Heart className="w-8 h-8 text-forest-400" />
        </div>
        <h2 className="font-serif text-2xl text-forest-900 mb-3">
          No plants saved yet
        </h2>
        <p className="text-forest-600 mb-8 max-w-sm mx-auto">
          Start exploring and save plants you love to your wishlist.
        </p>
        <Button asChild className="touch-target">
          <Link href="/shop/all">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Browse plants
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default async function WishlistPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <SignedOutState />
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_id", user.id)
    .single()

  if (!customer) {
    return <SignedOutState />
  }

  const { data: wishlistRaw = [] } = await supabase
    .from("wishlist_items")
    .select(`
      id,
      product_id,
      product:products!inner(${PRODUCT_SELECT})
    `)
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false })

  const wishlistItems = (wishlistRaw ?? []) as unknown as WishlistRow[]
  const products: Product[] = wishlistItems
    .map((item) => item.product)
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .map(mapSupabaseProductToProduct)

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-cream-100 pt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <h1 className="font-serif text-3xl lg:text-4xl text-forest-900 mb-8 text-center">
            Your Wishlist
          </h1>
          <EmptyWishlistState />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-100 pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <h1 className="font-serif text-3xl lg:text-4xl text-forest-900 mb-8">
          Your Wishlist
        </h1>
        <WishlistClient initialProducts={products} />
      </div>
    </div>
  )
}
