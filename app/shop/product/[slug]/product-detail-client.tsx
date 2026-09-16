"use client"

import { useState } from "react"
import Image from "next/image"
import { Heart, Share2 } from "lucide-react"
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
  const currentCompareAt = selectedVariant?.compareAtPrice ?? product.compareAtPrice
  const currentStockCount = selectedVariant?.stockCount ?? product.stockCount

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
                <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-2 hover:bg-forest-50">+</button>
              </div>
            </div>

            <div className="flex gap-4 mb-8">
              <Button size="lg" className="flex-1" onClick={handleAddToCart} disabled={isOutOfStock}>
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </Button>
              <Button size="lg" variant="outline"><Heart className="w-5 h-5" /></Button>
              <Button size="lg" variant="outline"><Share2 className="w-5 h-5" /></Button>
            </div>

            <div className="border-t border-forest-200 pt-6">
              <h3 className="font-serif text-lg mb-4">Care Requirements</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(product.careInfo).slice(0, 4).map(([key, val]) => (
                  <div key={key}>
                    <p className="text-xs text-forest-500 uppercase">{key}</p>
                    <p className="font-medium text-forest-800">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}