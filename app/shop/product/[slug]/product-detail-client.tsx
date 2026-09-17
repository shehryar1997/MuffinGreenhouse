"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Heart, Share2, Sun, Droplets, CloudRain, Thermometer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"
import { useCart } from "@/components/providers/cart-provider"
import { toast } from "sonner"
import { Product } from "@/types"

interface ProductDetailClientProps {
  product: Product
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedVariant, setSelectedVariant] = useState(product?.variants[0] || null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const { addItem, toggleCart } = useCart()

  const handleAddToCart = () => {
    addItem(product, selectedVariant || undefined, quantity)
    toast(`${product.name} added to cart`, { action: { label: "View Cart", onClick: () => toggleCart(true) } })
  }

  const isOutOfStock = product.stockStatus === "out_of_stock"
  const currentPrice = selectedVariant?.price || product.price
  const currentCompareAt = product.compareAtPrice
  const currentStockCount = selectedVariant?.stockCount ?? product.stockCount

  // Re-clamp quantity when switching variants, so a quantity chosen for a
  // higher-stock variant can't silently carry over past a lower-stock one.
  useEffect(() => {
    setQuantity((q) => Math.min(Math.max(1, q), Math.max(1, currentStockCount)))
  }, [currentStockCount])

  return (
    <div className="bg-cream-100 min-h-screen pt-28 pb-8">
      <div className="container mx-auto px-4">
        <nav className="flex items-center gap-2 text-sm text-forest-500 mb-6">
          <Link href="/">Home</Link><span>/</span><Link href="/shop/all">Shop</Link><span>/</span><span className="text-forest-900">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="aspect-square relative rounded-2xl overflow-hidden bg-forest-50">
              <Image src={product.images[selectedImage]?.url || "/placeholder.jpg"} alt={product.name} fill className="object-cover" priority />
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNewArrival && <Badge variant="secondary">New</Badge>}
                {product.stockStatus === "low_stock" && <Badge variant="lowStock">Low Stock</Badge>}
                {product.isPetSafe && <Badge variant="outline">Pet Safe</Badge>}
              </div>
            </div>
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button key={img.id} onClick={() => setSelectedImage(i)} className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${selectedImage === i ? "border-clay-500" : "border-transparent"}`}>
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
                <span className="font-mono text-lg text-forest-400 line-through">{formatPrice(currentCompareAt)}</span>
              )}
              {isOutOfStock ? <Badge variant="outOfStock">Out of Stock</Badge> : <Badge variant="lowStock">In Stock ({currentStockCount} left)</Badge>}
            </div>

            {product.variants.length > 1 && (
              <div className="mb-6">
                <label className="font-medium text-forest-900 block mb-2">Size</label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button key={v.id} onClick={() => setSelectedVariant(v)} disabled={v.stockStatus === "out_of_stock"} 
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
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2 hover:bg-forest-50">-</button>
                <span className="px-4 py-2 font-mono min-w-[3rem] text-center">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(currentStockCount, quantity + 1))} disabled={quantity >= currentStockCount} className="px-4 py-2 hover:bg-forest-50 disabled:opacity-40 disabled:cursor-not-allowed">+</button>
              </div>
            </div>

            <div className="flex gap-4 mb-8">
              <Button size="lg" className="flex-1" onClick={handleAddToCart} disabled={isOutOfStock}>
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </Button>
              <Button size="lg" variant="outline"><Heart className="w-5 h-5" /></Button>
              <Button size="lg" variant="outline"><Share2 className="w-5 h-5" /></Button>
            </div>

            {/* Care Requirements */}
            <div className="border-t border-forest-200 pt-6">
              <h3 className="font-serif text-xl mb-4">Care Requirements</h3>
              <div className="grid grid-cols-2 gap-3">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}