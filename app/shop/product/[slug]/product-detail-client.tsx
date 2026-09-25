"use client"

import { useState, useEffect, useRef } from "react"
import { SmartImage as Image } from "@/components/ui/smart-image"
import { useRouter } from "next/navigation"
import { Heart, Share2, Sun, Droplets, CloudRain, Thermometer, PawPrint, PackageOpen, Truck, Plane, Wallet, ShieldCheck, MessageCircle, Sprout, FlaskConical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn, formatPrice } from "@/lib/utils"
import Link from "next/link"
import { useCart } from "@/components/providers/cart-provider"
import { useWishlist } from "@/components/providers/wishlist-provider"
import { toast } from "sonner"
import type { Product, ProductVariant } from "@/types"
import { generateProductBreadcrumb, generateProductSchema, serializeJsonLd } from "@/lib/structured-data"
import { isPlantProduct } from "@/lib/product-categories"
import { shipsBareRoot } from "@/lib/shipping"
import { isOverseas, leadTimeDays } from "@/lib/fulfillment"
import { pickGallery, startingFromPrice, displayPrice } from "@/lib/product-photos"
import { NotifyMeForm } from "@/components/shop/notify-me-form"
import { Recommendations } from "@/components/shop/recommendations"
import { Markdown } from "@/components/journal/markdown"
import { trackViewItem } from "@/lib/analytics"
import { whatsAppLink } from "@/lib/whatsapp-link"
import { siteConfig } from "@/config/nav.config"
import { SITE_URL } from "@/lib/seo"
import { PAYMENT_ACCOUNTS } from "@/config/payment-accounts"
import { EQUIPMENT_FEE_PER_KG, FREE_DELIVERY_MAX_ITEMS, FREE_DELIVERY_THRESHOLD, KARACHI_DELIVERY_FEE } from "@/lib/delivery-fee"

interface ProductDetailClientProps {
  product: Product
  /** Pots, potting mix and fertilizer suggested with a plant ("complete the setup"). */
  addOns?: Product[]
  /** Server-rendered reviews section, shown under the product details. */
  reviewsSlot?: React.ReactNode
  rating?: { average: number; count: number }
}

// What the light/water pickers in the admin panel mean, used when no care text was written for the plant.
const LIGHT_TEXT: Record<Product["lightRequirement"], string> = {
  low: "Low light is fine. Keep it out of direct sun.",
  medium: "Medium, indirect light, such as a room with a window.",
  bright: "Bright, indirect light, near a bright window without harsh midday sun.",
  full_sun: "Full sun, ideally a balcony or rooftop.",
}
const WATER_TEXT: Record<Product["waterRequirement"], string> = {
  low: "Let the soil dry out completely between waterings.",
  medium: "Water when the top few centimetres of soil are dry.",
  high: "Keep the soil lightly moist, never waterlogged.",
}

/** Opens on the cheapest size that is in stock (the "Starting from" price on the shop card), else the cheapest. */
function initialVariant(variants: ProductVariant[]): ProductVariant | null {
  if (variants.length === 0) return null
  const cheapest = (list: ProductVariant[]) => list.reduce((best, v) => (v.price < best.price ? v : best))
  const available = variants.filter((v) => v.stockStatus !== "out_of_stock")
  return cheapest(available.length > 0 ? available : variants)
}

export function ProductDetailClient({ product, addOns = [], reviewsSlot, rating }: ProductDetailClientProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(() => initialVariant(product.variants))
  // Id of the thumbnail the shopper chose among the selected variant's photos. null = its first photo.
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

  useEffect(() => {
    trackViewItem({ currency: "PKR", value: displayPrice(product), items: [{ item_name: product.name, price: displayPrice(product) }] })
  }, [product])

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
  const breadcrumbSchema = generateProductBreadcrumb(product)
  // Tools & Equipment (pots, fertilizer, media...) have no plant care info to show.
  const isPlant = isPlantProduct(product)
  const bareRoot = isPlant && shipsBareRoot(product)

  // Only the selected variant's own photos are shown (see pickGallery), never another size's.
  // A legacy product with no variants falls back to its product photos.
  const gallery = pickGallery(selectedVariant, shownImageId)
  const galleryImages = product.variants.length > 0 ? gallery.galleryImages : product.images
  const mainImage = gallery.mainImage ?? (product.variants.length === 0 ? product.images[0] : undefined)

  // Stock, price and "was" price all follow the size being looked at, not the product as a whole.
  const stockStatus = selectedVariant?.stockStatus ?? product.stockStatus
  const isOutOfStock = stockStatus === "out_of_stock"
  const allSoldOut = product.variants.length > 0 ? product.variants.every((v) => v.stockStatus === "out_of_stock") : isOutOfStock
  const currentPrice = selectedVariant?.price ?? product.price
  const currentCompareAt = selectedVariant?.compareAtPrice
  const currentStockCount = selectedVariant?.stockCount ?? product.stockCount

  // Derived (not synced via an effect): a quantity chosen for a higher-stock
  // variant can't carry over past a lower-stock one.
  const quantity = Math.min(Math.max(1, requestedQuantity), Math.max(1, currentStockCount))

  const handleAddToCart = () => {
    if (isOutOfStock) return
    // Adding opens the cart drawer, which is the confirmation (a toast on top of it said the same thing twice).
    addItem(product, selectedVariant || undefined, quantity)
  }

  const sizeLabel = product.variants.length > 1 && selectedVariant ? ` (${selectedVariant.name})` : ""
  const whatsappOrder = whatsAppLink(
    siteConfig.whatsappNumber,
    `Hi Muffin Plants! I'd like to order ${product.name}${sizeLabel} x ${quantity}.\n${SITE_URL}/shop/product/${product.slug}`
  )

  const careCards = isPlant
    ? [
        { key: "light", label: "Light", text: product.careInfo.light || LIGHT_TEXT[product.lightRequirement], icon: Sun, tone: "amber" },
        { key: "water", label: "Water", text: product.careInfo.water || WATER_TEXT[product.waterRequirement], icon: Droplets, tone: "blue" },
        { key: "humidity", label: "Humidity", text: product.careInfo.humidity, icon: CloudRain, tone: "sky" },
        { key: "temperature", label: "Temperature", text: product.careInfo.temperature, icon: Thermometer, tone: "orange" },
      ].filter((c) => c.text && c.text.trim())
    : []

  return (
    <div className="bg-cream-100 min-h-screen pt-28 pb-44 lg:pb-8">
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
                alt={mainImage?.alt || (product.variants.length > 1 && selectedVariant ? `${product.name}, ${selectedVariant.name}` : product.name)}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
                priority
              />
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNewArrival && <Badge variant="secondary">New</Badge>}
                {stockStatus === "low_stock" && <Badge variant="lowStock">Low Stock</Badge>}
                {isPlant && product.isPetSafe && <Badge variant="outline">Pet Safe</Badge>}
                {isPlant && product.isImported && <Badge variant="outline">Imported</Badge>}
                {bareRoot && <Badge variant="outline">Ships bare-root</Badge>}
                {isOverseas(product) && <Badge variant="outline">Ships from overseas</Badge>}
              </div>
            </div>
            <div className="flex gap-2 max-lg:overflow-x-auto max-lg:pb-1">
              {galleryImages.length > 1 && galleryImages.map((img, i) => (
                <button key={img.id} type="button" onClick={() => setShownImageId(img.id)} aria-label={`Show photo ${i + 1} of ${galleryImages.length}`} aria-current={mainImage?.id === img.id} className={`w-20 h-20 max-lg:shrink-0 rounded-lg overflow-hidden border-2 ${mainImage?.id === img.id ? "border-clay-500" : "border-transparent"}`}>
                  <Image src={img.url} alt={img.alt} width={80} height={80} className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-mono text-sm text-forest-500 uppercase tracking-wider mb-2">{product.category.name}</p>
            <h1 className="font-serif text-heading-1 text-forest-900 mb-3">{product.name}</h1>
            {product.shortDescription && <p className="text-body-lg text-forest-700 mb-6">{product.shortDescription}</p>}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6">
              <span className="font-mono text-3xl font-medium">{formatPrice(currentPrice)}</span>
              {currentCompareAt && currentCompareAt > currentPrice && (
                <span className="font-mono text-lg text-forest-500 line-through">
                  <span className="sr-only">Was </span>{formatPrice(currentCompareAt)}
                </span>
              )}
              {/* Amber is for "running low" only; a plain in-stock plant used to look like a warning. */}
              {isOutOfStock ? <Badge variant="outOfStock">{allSoldOut ? "Out of Stock" : "This size is sold out"}</Badge> : stockStatus === "low_stock" ? <Badge variant="lowStock">Only {currentStockCount} left</Badge> : <Badge variant="success">In stock</Badge>}
            </div>

            {product.variants.length > 1 && (
              <fieldset className="mb-6">
                <legend className="font-medium text-forest-900 mb-2">Size</legend>
                <div className="flex flex-wrap gap-2" role="radiogroup">
                  {product.variants.map((v) => {
                    const soldOut = v.stockStatus === "out_of_stock"
                    const selected = selectedVariant?.id === v.id
                    return (
                      <button key={v.id} type="button" role="radio" aria-checked={selected} onClick={() => { setSelectedVariant(v); setShownImageId(null) }}
                        className={cn(
                          "px-4 py-2 border-2 rounded-lg text-left max-lg:min-h-11",
                          selected ? "border-clay-500 bg-clay-50 dark:bg-clay-500/10" : "border-forest-200 hover:border-forest-300",
                          soldOut && "opacity-60"
                        )}>
                        <span className={cn("text-sm font-medium", soldOut && "line-through")}>{v.name}</span>
                        <span className="ml-2 text-xs text-forest-500">{soldOut ? "Sold out" : formatPrice(v.price)}</span>
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            )}

            {!isOutOfStock && (
              <div className="flex items-center gap-4 mb-8">
                <span id="qty-label" className="font-medium text-forest-900">Quantity</span>
                <div className="flex items-center border border-forest-200 rounded-lg" role="group" aria-labelledby="qty-label">
                  <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1} aria-label="Decrease quantity" className="px-4 py-2 max-lg:min-h-11 max-lg:min-w-11 hover:bg-forest-50 disabled:opacity-40 disabled:cursor-not-allowed">-</button>
                  <span className="px-4 py-2 font-mono min-w-[3rem] text-center" aria-live="polite">{quantity}</span>
                  <button type="button" onClick={() => setQuantity(Math.min(currentStockCount, quantity + 1))} disabled={quantity >= currentStockCount} aria-label="Increase quantity" className="px-4 py-2 max-lg:min-h-11 max-lg:min-w-11 hover:bg-forest-50 disabled:opacity-40 disabled:cursor-not-allowed">+</button>
                </div>
              </div>
            )}

            <div ref={ctaRef} className="flex gap-4 mb-4">
              <Button size="lg" className="flex-1" onClick={handleAddToCart} disabled={isOutOfStock}>
                {isOutOfStock ? (allSoldOut ? "Out of Stock" : "Choose another size") : "Add to Cart"}
              </Button>
              <Button size="lg" variant="outline" onClick={handleToggleWishlist} disabled={togglingWishlist} aria-pressed={wishlisted} aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}>
                <Heart className={cn("w-5 h-5", wishlisted && "fill-primary text-primary")} aria-hidden="true" />
              </Button>
              <Button size="lg" variant="outline" onClick={handleShare} aria-label="Share this plant">
                <Share2 className="w-5 h-5" aria-hidden="true" />
              </Button>
            </div>

            {!isOutOfStock && whatsappOrder && (
              <a href={whatsappOrder} target="_blank" rel="noopener noreferrer" className="mb-6 flex min-h-11 items-center justify-center gap-2 rounded-lg border border-forest-200 px-4 text-sm font-medium text-forest-800 hover:bg-forest-50 dark:hover:bg-forest-500/10">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Prefer to chat? Order on WhatsApp
              </a>
            )}

            {/* Restock alerts are per product, so they're offered once every size is gone. */}
            {isOutOfStock && allSoldOut && <NotifyMeForm productId={product.id} productName={product.name} />}
            {isOutOfStock && !allSoldOut && (
              <p className="mb-6 text-sm text-forest-700">This size is sold out. Pick one of the other sizes above, or message us on WhatsApp to ask when it&apos;s back.</p>
            )}

            <PurchaseInfo isPlant={isPlant} overseasDays={isOverseas(product) ? leadTimeDays(product) : null} />

            {addOns.length > 0 && <CompleteTheSetup addOns={addOns} />}

            {product.description && (
              <section className="border-t border-forest-200 pt-6 mt-6" aria-labelledby="about-heading">
                <h2 id="about-heading" className="font-serif text-xl mb-3">{isPlant ? "About this plant" : "About this product"}</h2>
                <div className="prose-sm max-w-none space-y-3 text-forest-700 [&_h2]:font-serif [&_h2]:text-lg [&_h2]:text-forest-900 [&_h3]:font-medium [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5">
                  <Markdown source={product.description} />
                </div>
              </section>
            )}

            {/* Care Requirements (plants only) */}
            {isPlant && (
            <section className="border-t border-forest-200 pt-6 mt-6" aria-labelledby="care-heading">
              <h2 id="care-heading" className="font-serif text-xl mb-4">Care requirements</h2>
              {careCards.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {careCards.map(({ key, label, text, icon: Icon, tone }) => (
                    <div key={key} className={cn("flex items-start gap-3 p-4 rounded-xl border h-full", CARE_TONES[tone].card)}>
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5", CARE_TONES[tone].chip)}>
                        <Icon className={cn("w-5 h-5", CARE_TONES[tone].icon)} aria-hidden="true" />
                      </div>
                      <div>
                        <p className={cn("text-xs font-medium uppercase tracking-wide mb-1", CARE_TONES[tone].label)}>{label}</p>
                        <p className={cn("text-sm font-semibold leading-relaxed", CARE_TONES[tone].text)}>{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pet safety was collected (toxicity) but never shown, and the "Pet Safe" badge only appeared when true,
                  so its absence said nothing. Always say something, and default to the cautious wording. */}
              <div className={cn("mt-3 flex items-start gap-3 rounded-xl border p-4", product.isPetSafe ? "border-forest-200 bg-forest-50 dark:bg-forest-500/10" : "border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10")}>
                <PawPrint className={cn("mt-0.5 h-5 w-5 shrink-0", product.isPetSafe ? "text-forest-600" : "text-amber-700 dark:text-amber-300")} aria-hidden="true" />
                <div>
                  <p className={cn("text-xs font-medium uppercase tracking-wide", product.isPetSafe ? "text-forest-600" : "text-amber-700 dark:text-amber-300")}>Pets and children</p>
                  <p className={cn("text-sm font-semibold leading-relaxed", product.isPetSafe ? "text-forest-900" : "text-amber-900 dark:text-amber-100")}>
                    {product.isPetSafe ? "Pet-safe" : product.careInfo.toxicity || "Not marked pet-safe. Keep out of reach of cats, dogs and small children."}
                  </p>
                </div>
              </div>

              {bareRoot && (
                <div className="mt-3 flex items-start gap-3 rounded-xl border border-forest-200 bg-forest-50 dark:bg-forest-500/10 p-4">
                  <PackageOpen className="mt-0.5 h-5 w-5 shrink-0 text-forest-600" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-forest-600">Packaging</p>
                    <p className="text-sm font-semibold leading-relaxed text-forest-900">
                      Ships bare-root, pot sent separately. This plant&apos;s leaves can snap if packed inside its pot, so we ship it bare-root with the pot boxed alongside it. It&apos;s a tough, hardy plant that isn&apos;t stressed by bare-root shipping, so just pot it up in fresh potting mix when it arrives.
                    </p>
                  </div>
                </div>
              )}

              {(product.careInfo.soil || product.careInfo.fertilizer) && (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {product.careInfo.soil && (
                    <div className={cn("flex items-start gap-3 p-4 rounded-xl border h-full", CARE_TONES.stone.card)}>
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5", CARE_TONES.stone.chip)}>
                        <Sprout className={cn("w-5 h-5", CARE_TONES.stone.icon)} aria-hidden="true" />
                      </div>
                      <div>
                        <p className={cn("text-xs font-medium uppercase tracking-wide mb-1", CARE_TONES.stone.label)}>Soil</p>
                        <p className={cn("text-sm font-semibold leading-relaxed", CARE_TONES.stone.text)}>{product.careInfo.soil}</p>
                      </div>
                    </div>
                  )}
                  {product.careInfo.fertilizer && (
                    <div className={cn("flex items-start gap-3 p-4 rounded-xl border h-full", CARE_TONES.emerald.card)}>
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5", CARE_TONES.emerald.chip)}>
                        <FlaskConical className={cn("w-5 h-5", CARE_TONES.emerald.icon)} aria-hidden="true" />
                      </div>
                      <div>
                        <p className={cn("text-xs font-medium uppercase tracking-wide mb-1", CARE_TONES.emerald.label)}>Fertilizer</p>
                        <p className={cn("text-sm font-semibold leading-relaxed", CARE_TONES.emerald.text)}>{product.careInfo.fertilizer}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
            )}
          </div>
        </div>
        {reviewsSlot}
        <Recommendations excludeIds={[product.id]} />
      </div>
      {/* Sticky buy bar on phones and tablets. Right padding keeps the floating WhatsApp/chat buttons off the CTA. */}
      {!isOutOfStock && !ctaInView && (
        <div
          className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 flex items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-3 pr-24 backdrop-blur lg:hidden"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-forest-900">{product.name}{sizeLabel}</p>
            <p className="font-mono text-sm text-forest-700">{formatPrice(currentPrice)}</p>
          </div>
          <Button onClick={handleAddToCart}>Add to Cart</Button>
        </div>
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbSchema) }}
      />
    </div>
  )
}

const CARE_TONES: Record<string, { card: string; chip: string; icon: string; label: string; text: string }> = {
  amber: {
    card: "bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20",
    chip: "bg-amber-100 dark:bg-amber-500/20",
    icon: "text-amber-600 dark:text-amber-300",
    label: "text-amber-700/80 dark:text-amber-300/80",
    text: "text-amber-900 dark:text-amber-100",
  },
  blue: {
    card: "bg-blue-50 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20",
    chip: "bg-blue-100 dark:bg-blue-500/20",
    icon: "text-blue-600 dark:text-blue-300",
    label: "text-blue-700/80 dark:text-blue-300/80",
    text: "text-blue-900 dark:text-blue-100",
  },
  sky: {
    card: "bg-sky-50 border-sky-100 dark:bg-sky-500/10 dark:border-sky-500/20",
    chip: "bg-sky-100 dark:bg-sky-500/20",
    icon: "text-sky-600 dark:text-sky-300",
    label: "text-sky-700/80 dark:text-sky-300/80",
    text: "text-sky-900 dark:text-sky-100",
  },
  orange: {
    card: "bg-orange-50 border-orange-100 dark:bg-orange-500/10 dark:border-orange-500/20",
    chip: "bg-orange-100 dark:bg-orange-500/20",
    icon: "text-orange-600 dark:text-orange-300",
    label: "text-orange-700/80 dark:text-orange-300/80",
    text: "text-orange-900 dark:text-orange-100",
  },
  stone: {
    card: "bg-stone-50 border-stone-200 dark:bg-stone-500/10 dark:border-stone-500/20",
    chip: "bg-stone-200 dark:bg-stone-500/20",
    icon: "text-stone-600 dark:text-stone-300",
    label: "text-stone-700/80 dark:text-stone-300/80",
    text: "text-stone-900 dark:text-stone-100",
  },
  emerald: {
    card: "bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20",
    chip: "bg-emerald-100 dark:bg-emerald-500/20",
    icon: "text-emerald-600 dark:text-emerald-300",
    label: "text-emerald-700/80 dark:text-emerald-300/80",
    text: "text-emerald-900 dark:text-emerald-100",
  },
}

/** Delivery, payment and guarantee facts next to the buy button: the questions shoppers ask before ordering. */
function PurchaseInfo({ isPlant, overseasDays }: { isPlant: boolean; overseasDays: number | null }) {
  const wallets = Object.values(PAYMENT_ACCOUNTS).map((a) => a.title.replace(/ Bank Transfer$/, " bank transfer"))
  const payWith = wallets.length > 1 ? `${wallets.slice(0, -1).join(", ")} or ${wallets[wallets.length - 1]}` : wallets[0]
  return (
    <ul className="space-y-3 rounded-xl border border-forest-200 bg-surface p-4 text-sm text-forest-700" aria-label="Delivery, payment and guarantee">
      {overseasDays !== null && (
        <li className="flex gap-3">
          <Plane className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" aria-hidden="true" />
          <span>
            <strong className="font-medium">Ships from overseas.</strong> We order it for you once your payment is confirmed, so it reaches you in about {overseasDays} days
            (not 1-2 business days). If your order has other items too, everything ships together. You&apos;ll see the exact estimated date at checkout.
          </span>
        </li>
      )}
      <li className="flex gap-3">
        <Truck className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" aria-hidden="true" />
        <span>
          {isPlant
            ? <>Delivery {formatPrice(KARACHI_DELIVERY_FEE)} in Karachi; elsewhere in Pakistan by parcel weight.</>
            : <>Delivery {formatPrice(EQUIPMENT_FEE_PER_KG)} per kg anywhere in Pakistan.</>}{" "}
          Free on orders of {formatPrice(FREE_DELIVERY_THRESHOLD)}+ ({FREE_DELIVERY_MAX_ITEMS} items or fewer). Free pickup in Karachi.{" "}
          <Link href="/delivery-and-pickup" className="underline underline-offset-2 hover:text-forest-900">Details</Link>
        </span>
      </li>
      <li className="flex gap-3">
        <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" aria-hidden="true" />
        <span>Pay by {payWith} after you order. We hold your items for 24 hours while you pay.</span>
      </li>
      <li className="flex gap-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" aria-hidden="true" />
        <span>
          Arrived damaged? Send us photos within 2 hours of delivery for a replacement or store credit.{" "}
          <Link href="/our-guarantee" className="underline underline-offset-2 hover:text-forest-900">Our guarantee</Link>
        </span>
      </li>
    </ul>
  )
}

/** "Complete the setup": a pot, potting mix or fertilizer to go with the plant, one tap to add. */
function CompleteTheSetup({ addOns }: { addOns: Product[] }) {
  const { addItem } = useCart()
  return (
    <section className="mt-6" aria-labelledby="addons-heading">
      <h2 id="addons-heading" className="mb-3 font-mono text-xs uppercase tracking-wider text-forest-500">Complete the setup</h2>
      <ul className="space-y-2">
        {addOns.map((p) => {
          const from = startingFromPrice(p)
          const buyable = p.variants.filter((v) => v.stockStatus !== "out_of_stock")
          const oneSize = p.variants.length <= 1 && buyable.length === 1
          return (
            <li key={p.id} className="flex items-center gap-3 rounded-lg border border-forest-200 bg-surface p-2">
              <Link href={`/shop/product/${p.slug}`} className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-forest-50">
                <Image src={p.images[0]?.url || "/placeholder-plant.png"} alt={p.images[0]?.alt || p.name} fill sizes="56px" className="object-cover" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/shop/product/${p.slug}`} className="block truncate text-sm font-medium text-forest-900 hover:underline">{p.name}</Link>
                <p className="font-mono text-xs text-forest-600">{from !== null ? `From ${formatPrice(from)}` : formatPrice(displayPrice(p))}</p>
              </div>
              {oneSize ? (
                <Button size="sm" variant="outline" onClick={() => addItem(p, buyable[0], 1)} aria-label={`Add ${p.name} to cart`}>Add</Button>
              ) : (
                <Button size="sm" variant="outline" asChild><Link href={`/shop/product/${p.slug}`}>Choose</Link></Button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
