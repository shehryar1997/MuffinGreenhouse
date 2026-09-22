"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Heart, Share2, Sun, Droplets, CloudRain, Thermometer, PawPrint } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn, formatPrice } from "@/lib/utils"
import Link from "next/link"
import { useCart } from "@/components/providers/cart-provider"
import { useWishlist } from "@/components/providers/wishlist-provider"
import { toast } from "sonner"
import { Product } from "@/types"
import { generateProductSchema, serializeJsonLd } from "@/lib/structured-data"
import { isPlantProduct } from "@/lib/product-categories"
import { pickGallery } from "@/lib/product-photos"
import { NotifyMeForm } from "@/components/shop/notify-me-form"
import { Recommendations } from "@/components/shop/recommendations"

interface ProductDetailClientProps {
  product: Product
  /** Server-rendered reviews section, shown under the product details. */
  reviewsSlot?: React.ReactNode
  rating?: { average: number; count: number }
}

export function ProductDetailClient({ product, reviewsSlot, rating }: ProductDetailClientProps) {
  const [selectedVariant, setSelectedVariant] = useState(product?.variants[0] || null)
  // Id of the photo the shopper chose (a thumbnail, or a variant's own photo). null = the default photo.
  const [shownImageId, setShownImageId] = useState<string | null>(null)
  const [requestedQuantity, setQuantity] = useState(1)
  const { addItem } = useCart()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const router = useRouter()
  const wishlisted = isWishlisted(product.id)
  const [togglingWishlist, setTogglingWishlist] = useState(false)

  // Sticky mobile buy bar: shown only once the real Add to Cart button has scrolled out of view
  // (on a phone that button sits ~1.6 screens down the page).
  const ctaRef = useRef<HTMLDivElement>(null)
  const [ctaInView, setCtaInView] = useState(true)
  useEffect(() => {
    const el = ctaRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setCtaInView(entry.isIntersecting))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleToggleWishlist = async () => {
    if (togglingWishlist) return
    setTogglingWishlist(true)
    const result = await toggleWishlist(product.id)
    setTogglingWishlist(false)
    if (!result.signedIn) {
      toast("Sign in to save plants to your wishlist", {
        action: { label: "Sign in", onClick: () => router.push("/account/login") },
      })
      return
    }
    if (!result.ok) {
      toast.error("Couldn't update your wishlist. Try again")
      return
    }
    toast(wishlisted ? `Removed ${product.name} from wishlist` : `${product.name} added to wishlist`)
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url })
      } else {
        await navigator.clipboard.writeText(url)
        toast("Link copied")
      }
    } catch {
      // Share sheet dismissed, or clipboard blocked: nothing to do.
    }
  }

  const productSchema = generateProductSchema(product, rating)
  // Tools & Equipment (pots, fertilizer, media...) have no plant care info to show.
  const isPlant = isPlantProduct(product)

  const handleAddToCart = () => {
    // Adding opens the cart drawer, which is the confirmation (a toast on top of it said the same thing twice).
    addItem(product, selectedVariant || undefined, quantity)
  }

  // General photos first, then the selected variant's own; the main photo never goes blank (see pickGallery).
  const { galleryImages, mainImage } = pickGallery(product, selectedVariant, shownImageId)

  const isOutOfStock = product.stockStatus === "out_of_stock"
  const currentPrice = selectedVariant?.price ?? product.price
  const currentCompareAt = product.compareAtPrice
  const currentStockCount = selectedVariant?.stockCount ?? product.stockCount

  // Derived (not synced via an effect): a quantity chosen for a higher-stock
  // variant can't carry over past a lower-stock one.
  const quantity = Math.min(Math.max(1, requestedQuantity), Math.max(1, currentStockCount))

  return (
    <div className="bg-cream-100 min-h-screen pt-28 pb-44 md:pb-8">
      <div className="container mx-auto px-4">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-forest-500 mb-6 max-lg:[&>a]:inline-flex max-lg:[&>a]:min-h-11 max-lg:[&>a]:items-center">
          <Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/shop/all">Shop</Link>
          {product.category.slug && (
            <><span aria-hidden="true">/</span><Link href={`/shop/${product.category.slug}`}>{product.category.name}</Link></>
          )}
          <span aria-hidden="true">/</span><span aria-current="page" className="text-forest-900">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="aspect-square relative rounded-2xl overflow-hidden bg-forest-50">
              <Image
                src={mainImage?.url || "/placeholder-plant.png"}
                alt={mainImage?.alt || product.name}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNewArrival && <Badge variant="secondary">New</Badge>}
                {product.stockStatus === "low_stock" && <Badge variant="lowStock">Low Stock</Badge>}
                {isPlant && product.isPetSafe && <Badge variant="outline">Pet Safe</Badge>}
                {isPlant && product.isImported && <Badge variant="outline">Imported</Badge>}
              </div>
            </div>
            <div className="flex gap-2 max-lg:overflow-x-auto max-lg:pb-1">
              {galleryImages.map((img, i) => (
                <button key={img.id} type="button" onClick={() => setShownImageId(img.id)} aria-label={`Show photo ${i + 1} of ${galleryImages.length}`} aria-current={mainImage?.id === img.id} className={`w-20 h-20 max-lg:shrink-0 rounded-lg overflow-hidden border-2 ${mainImage?.id === img.id ? "border-clay-500" : "border-transparent"}`}>
                  <Image src={img.url} alt={img.alt} width={80} height={80} className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-mono text-sm text-forest-500 uppercase tracking-wider mb-2">{product.category.name}</p>
            <h1 className="font-serif text-heading-1 text-forest-900 mb-4">{product.name}</h1>
            <p className="text-body-lg text-forest-700 mb-6">{product.description}</p>
            
            <div className="flex items-center gap-4 mb-6">
              <span className="font-mono text-3xl font-medium">{formatPrice(currentPrice)}</span>
              {currentCompareAt && currentCompareAt > currentPrice && (
                <span className="font-mono text-lg text-forest-500 line-through">{formatPrice(currentCompareAt)}</span>
              )}
              {/* Amber is for "running low" only; a plain in-stock plant used to look like a warning. */}
              {isOutOfStock ? <Badge variant="outOfStock">Out of Stock</Badge> : product.stockStatus === "low_stock" ? <Badge variant="lowStock">Only {currentStockCount} left</Badge> : <Badge variant="success">In stock</Badge>}
            </div>

            {product.variants.length > 1 && (
              <div className="mb-6">
                <label className="font-medium text-forest-900 block mb-2">Size</label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button key={v.id} type="button" onClick={() => { setSelectedVariant(v); const own = v.images?.[0]; if (own) setShownImageId(own.id) }} aria-pressed={selectedVariant?.id === v.id} disabled={v.stockStatus === "out_of_stock"}
                      className={`px-4 py-2 border-2 rounded-lg ${selectedVariant?.id === v.id ? "border-clay-500 bg-clay-50" : "border-forest-200 hover:border-forest-300 disabled:opacity-50"}`}>
                      <span className="text-sm font-medium">{v.name}</span>
                      <span className="ml-2 text-xs text-forest-500">{formatPrice(v.price)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 mb-8">
              <label className="font-medium text-forest-900">Quantity</label>
              <div className="flex items-center border border-forest-200 rounded-lg">
                <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1} aria-label="Decrease quantity" className="px-4 py-2 max-lg:min-h-11 max-lg:min-w-11 hover:bg-forest-50 disabled:opacity-40 disabled:cursor-not-allowed">-</button>
                <span className="px-4 py-2 font-mono min-w-[3rem] text-center" aria-live="polite">{quantity}</span>
                <button type="button" onClick={() => setQuantity(Math.min(currentStockCount, quantity + 1))} disabled={quantity >= currentStockCount} aria-label="Increase quantity" className="px-4 py-2 max-lg:min-h-11 max-lg:min-w-11 hover:bg-forest-50 disabled:opacity-40 disabled:cursor-not-allowed">+</button>
              </div>
            </div>

            <div ref={ctaRef} className="flex gap-4 mb-8">
              <Button size="lg" className="flex-1" onClick={handleAddToCart} disabled={isOutOfStock}>
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </Button>
              {/* Both buttons used to have no handler at all. */}
              <Button size="lg" variant="outline" onClick={handleToggleWishlist} disabled={togglingWishlist} aria-pressed={wishlisted} aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}>
                <Heart className={cn("w-5 h-5", wishlisted && "fill-primary text-primary")} aria-hidden="true" />
              </Button>
              <Button size="lg" variant="outline" onClick={handleShare} aria-label="Share this plant">
                <Share2 className="w-5 h-5" aria-hidden="true" />
              </Button>
            </div>

            {isOutOfStock && <NotifyMeForm productId={product.id} productName={product.name} />}

            {/* Care Requirements (plants only) */}
            {isPlant && (
            <div className="border-t border-forest-200 pt-6">
              <h3 className="font-serif text-xl mb-4">Care Requirements</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Light */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100 h-full">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sun className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-amber-700/80 font-medium uppercase tracking-wide mb-1">Light</p>
                    <p className="text-sm font-semibold text-amber-900 leading-relaxed">{product.careInfo.light}</p>
                  </div>
                </div>
                {/* Water */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100 h-full">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Droplets className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-700/80 font-medium uppercase tracking-wide mb-1">Water</p>
                    <p className="text-sm font-semibold text-blue-900 leading-relaxed">{product.careInfo.water}</p>
                  </div>
                </div>
                {/* Humidity */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-sky-50 border border-sky-100 h-full">
                  <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CloudRain className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-xs text-sky-700/80 font-medium uppercase tracking-wide mb-1">Humidity</p>
                    <p className="text-sm font-semibold text-sky-900 leading-relaxed">{product.careInfo.humidity}</p>
                  </div>
                </div>
                {/* Temperature */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-50 border border-orange-100 h-full">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Thermometer className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-orange-700/80 font-medium uppercase tracking-wide mb-1">Temperature</p>
                    <p className="text-sm font-semibold text-orange-900 leading-relaxed">{product.careInfo.temperature}</p>
                  </div>
                </div>
              </div>

              {/* Pet safety was collected (toxicity) but never shown, and the "Pet Safe" badge only appeared when true,
                  so its absence said nothing. Always say something, and default to the cautious wording. */}
              <div className={cn("mt-3 flex items-start gap-3 rounded-xl border p-4", product.isPetSafe ? "border-forest-200 bg-forest-50" : "border-amber-200 bg-amber-50")}>
                <PawPrint className={cn("mt-0.5 h-5 w-5 shrink-0", product.isPetSafe ? "text-forest-600" : "text-amber-700")} aria-hidden="true" />
                <div>
                  <p className={cn("text-xs font-medium uppercase tracking-wide", product.isPetSafe ? "text-forest-600" : "text-amber-700")}>Pets and children</p>
                  <p className={cn("text-sm font-semibold leading-relaxed", product.isPetSafe ? "text-forest-900" : "text-amber-900")}>
                    {product.isPetSafe ? "Pet-safe" : product.careInfo.toxicity || "Not marked pet-safe. Keep out of reach of cats, dogs and small children."}
                  </p>
                </div>
              </div>

              {(product.careInfo.soil || product.careInfo.fertilizer) && (
                <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {product.careInfo.soil && (
                    <div><dt className="text-xs uppercase tracking-wide text-forest-500">Soil</dt><dd className="text-forest-900">{product.careInfo.soil}</dd></div>
                  )}
                  {product.careInfo.fertilizer && (
                    <div><dt className="text-xs uppercase tracking-wide text-forest-500">Fertilizer</dt><dd className="text-forest-900">{product.careInfo.fertilizer}</dd></div>
                  )}
                </dl>
              )}
            </div>
            )}
          </div>
        </div>
        {reviewsSlot}
        <Recommendations excludeIds={[product.id]} />
      </div>
      {/* Sticky mobile buy bar. Right padding keeps the floating WhatsApp/chat buttons off the CTA. */}
      {!isOutOfStock && !ctaInView && (
        <div
          className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 flex items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-3 pr-24 backdrop-blur md:hidden"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-forest-900">{product.name}</p>
            <p className="font-mono text-sm text-forest-700">{formatPrice(currentPrice)}</p>
          </div>
          <Button onClick={handleAddToCart}>Add to Cart</Button>
        </div>
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(productSchema) }}
      />
    </div>
  )
}