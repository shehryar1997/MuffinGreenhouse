"use client"

import { useRef, useEffect } from "react"
import { Drawer } from "vaul"
import { X, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/components/providers/cart-provider"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { CartItem } from "@/types"

export function CartDrawer() {
  const { cart, toggleCart, removeItem, updateQuantity, itemCount } = useCart()
  const browsePlantsRef = useRef<HTMLAnchorElement>(null)
  
  const isCartEmpty = cart ? cart.items.length === 0 : false

  // Focus the "Browse Plants" link when cart becomes empty
  useEffect(() => {
    if (isCartEmpty && browsePlantsRef.current) {
      browsePlantsRef.current.focus()
    }
  }, [isCartEmpty])
  const v = (item: CartItem) => item.variant?.price ?? item.product.price
  
  if (!cart) return null

  return (
    <Drawer.Root open={cart.isOpen} onOpenChange={toggleCart} direction="right">
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-[#1A1A1A]/40 backdrop-blur-sm z-50" onClick={() => toggleCart(false)} />
        <Drawer.Content className="fixed inset-y-0 right-0 z-50 h-full w-full sm:w-[440px] bg-[#FAF7F2] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-forest-200">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-[#E85A3C]">CART</span>
              <span className="font-mono text-xs text-forest-500">({itemCount})</span>
            </div>
            <button onClick={() => toggleCart(false)} className="p-2 hover:bg-forest-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-forest-700" />
            </button>
          </div>

          {cart.items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-[#D4F542] flex items-center justify-center mb-6">
                <ShoppingBag className="w-8 h-8 text-[#1A1A1A]" />
              </div>
              <p className="font-serif text-xl text-[#1A1A1A] mb-2">Your cart is empty</p>
              <p className="text-forest-500 mb-8">Find something green to take home</p>
              <Link ref={browsePlantsRef} href="/shop/all" onClick={() => toggleCart(false)} className="inline-flex items-center gap-2 font-mono text-xs tracking-widest uppercase border-b border-[#1A1A1A] pb-2 hover:text-[#E85A3C] hover:border-[#E85A3C] transition-colors outline-offset-4 focus:outline-2 focus:outline-[#E85A3C]">
                Browse Plants <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.items.map((item) => (
                  <div key={`${item.product.id}-${item.variant?.id || "x"}`} className="flex gap-4">
                    <div className="relative w-24 h-24 bg-forest-100 shrink-0">
                      <Image src={item.product.images[0]?.url || "/placeholder-plant.png"} alt={item.product.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif text-base text-[#1A1A1A]">{item.product.name}</h3>
                      {item.variant && <p className="text-xs text-forest-500 font-mono">{item.variant.name}</p>}
                      <p className="font-mono text-sm text-forest-700 mt-1">{formatPrice(v(item))}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center border border-forest-300">
                          <button onClick={() => updateQuantity(item.product.id, item.variant?.id, item.quantity - 1)} className="p-2 hover:bg-forest-100">
                            <Minus className="w-3 h-3 text-forest-600" />
                          </button>
                          <span className="font-mono text-sm w-8 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.id, item.variant?.id, item.quantity + 1)} className="p-2 hover:bg-forest-100">
                            <Plus className="w-3 h-3 text-forest-600" />
                          </button>
                        </div>
                        <button onClick={() => removeItem(item.product.id, item.variant?.id)} className="text-xs text-forest-400 hover:text-[#E85A3C] underline font-mono" aria-label={`Remove ${item.product.name} from cart`}>Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-forest-200 p-6 bg-[#FAF7F2]">
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm text-forest-600">
                    <span className="font-mono text-xs uppercase">Subtotal</span>
                    <span className="font-mono">{formatPrice(cart.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-forest-600">
                    <span className="font-mono text-xs uppercase">Delivery</span>
                    <span className="font-mono text-xs">{cart.deliveryFee > 0 ? formatPrice(cart.deliveryFee) : "At checkout"}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-forest-200">
                    <span className="font-mono text-xs uppercase text-[#1A1A1A]">Total</span>
                    <span className="font-mono text-lg text-[#1A1A1A]">{formatPrice(cart.total)}</span>
                  </div>
                </div>
                <Button asChild className="w-full h-12 bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-white font-mono text-xs uppercase">
                  <Link href="/checkout" onClick={() => toggleCart(false)}>Checkout</Link>
                </Button>
                <button onClick={() => toggleCart(false)} className="w-full mt-3 py-3 font-mono text-xs uppercase text-forest-600 hover:text-[#E85A3C]">Continue Shopping</button>
              </div>
            </>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
