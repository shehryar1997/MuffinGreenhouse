"use client"

import { useRef, useEffect } from "react"
import { Drawer } from "vaul"
import { X, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react"
import { SmartImage as Image } from "@/components/ui/smart-image"
import Link from "next/link"
import { useCart } from "@/components/providers/cart-provider"
import { formatPrice } from "@/lib/utils"
import { shipsBareRoot } from "@/lib/shipping"
import { isOverseas, leadTimeDays } from "@/lib/fulfillment"
import { Button } from "@/components/ui/button"
import type { CartItem } from "@/types"
import { FreeDeliveryBar } from "./free-delivery-bar"
import { Recommendations } from "@/components/shop/recommendations"

export function CartDrawer() {
  const { cart, toggleCart, removeItem, updateQuantity, itemCount } = useCart()
  const browsePlantsRef = useRef<HTMLAnchorElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const lastFocusedElement = useRef<HTMLElement | null>(null)
  
  const isCartEmpty = cart ? cart.items.length === 0 : false

  // Store the element that triggered the drawer open, restore focus on close
  useEffect(() => {
    if (cart?.isOpen) {
      lastFocusedElement.current = document.activeElement as HTMLElement
      // Focus the close button when drawer opens
      setTimeout(() => closeButtonRef.current?.focus(), 100)
    } else if (lastFocusedElement.current) {
      // Restore focus when drawer closes
      setTimeout(() => lastFocusedElement.current?.focus(), 100)
    }
  }, [cart?.isOpen])

  // Focus the "Browse Plants" link when cart becomes empty
  useEffect(() => {
    if (isCartEmpty && browsePlantsRef.current) {
      browsePlantsRef.current.focus()
    }
  }, [isCartEmpty])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && cart?.isOpen) {
        toggleCart(false)
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [cart?.isOpen, toggleCart])

  const v = (item: CartItem) => item.variant?.price ?? item.product.price
  
  if (!cart) return null

  return (
    <Drawer.Root open={cart.isOpen} onOpenChange={toggleCart} direction="right">
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => toggleCart(false)} />
        <Drawer.Content 
          className="fixed inset-y-0 right-0 z-50 h-full w-full sm:w-[440px] bg-background flex flex-col"
          aria-labelledby="cart-title"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            {/* A real dialog title (the drawer had none, which Radix/vaul warns about and screen readers miss). */}
            <Drawer.Title className="flex items-center gap-3 text-base font-normal" id="cart-title">
              <span className="font-mono text-xs text-primary">CART</span>
              <span className="font-mono text-xs text-muted-foreground">({itemCount})</span>
            </Drawer.Title>
            <button 
              ref={closeButtonRef}
              onClick={() => toggleCart(false)} 
              className="p-2.5 hover:bg-muted rounded-full transition-colors touch-target-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close cart"
            >
              <X className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
            </button>
          </div>

          {cart.items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6" aria-hidden="true">
                <ShoppingBag className="w-8 h-8 text-secondary-foreground" />
              </div>
              <p className="font-serif text-xl text-foreground mb-2">Your cart is empty</p>
              <p className="text-muted-foreground mb-8">Find something green to take home</p>
              <Link ref={browsePlantsRef} href="/shop/all" onClick={() => toggleCart(false)} className="inline-flex items-center gap-2 font-mono text-xs tracking-widest uppercase border-b border-foreground pb-2 hover:text-primary hover:border-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 px-2 py-1 touch-target-sm">
                Browse Plants <ArrowRight className="w-3 h-3" aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.items.map((item) => (
                  <div key={`${item.product.id}-${item.variant?.id || "x"}`} className="flex gap-4">
                    <div className="relative w-24 h-24 bg-muted shrink-0 rounded-md overflow-hidden">
                      <Image src={item.variant?.images?.[0]?.url || item.product.images[0]?.url || "/placeholder-plant.png"} alt={item.product.name} fill sizes="96px" className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif text-base text-foreground">{item.product.name}</h3>
                      {item.variant && item.variant.name.toLowerCase() !== "standard" && <p className="text-xs text-muted-foreground font-mono">{item.variant.name}</p>}
                      {shipsBareRoot(item.product) && <p className="text-xs text-forest-600 mt-0.5">Ships bare-root, pot included separately</p>}
                      {isOverseas(item.product) && <p className="text-xs text-amber-700 mt-0.5">Ships from overseas, about {leadTimeDays(item.product)} days</p>}
                      <p className="font-mono text-sm text-foreground mt-1">{formatPrice(v(item))}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center border border-border rounded-md overflow-hidden">
                          <button 
                            onClick={() => updateQuantity(item.product.id, item.variant?.id, item.quantity - 1)} 
                            className="p-2.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 touch-target-sm"
                            aria-label={`Decrease quantity of ${item.product.name}`}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3 text-foreground" aria-hidden="true" />
                          </button>
                          <span className="font-mono text-sm w-8 text-center" aria-live="polite">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.product.id, item.variant?.id, item.quantity + 1)} 
                            className="p-2.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 touch-target-sm"
                            aria-label={`Increase quantity of ${item.product.name}`}
                            disabled={item.quantity >= (item.variant?.stockCount ?? item.product.stockCount)}
                          >
                            <Plus className="w-3 h-3 text-foreground" aria-hidden="true" />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeItem(item.product.id, item.variant?.id)} 
                          className="text-xs text-muted-foreground hover:text-primary hover:underline font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 px-2 py-1 rounded touch-target-sm"
                          aria-label={`Remove ${item.product.name} from cart`}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <Recommendations excludeIds={cart.items.map((i) => i.product.id)} compact onNavigate={() => toggleCart(false)} />
              </div>

              <div className="border-t border-border p-6 bg-background">
                <FreeDeliveryBar subtotal={cart.subtotal} itemCount={cart.items.reduce((n, i) => n + i.quantity, 0)} className="mb-4" />
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span className="font-mono text-xs uppercase">Subtotal</span>
                    <span className="font-mono">{formatPrice(cart.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span className="font-mono text-xs uppercase">Delivery</span>
                    <span className="font-mono text-xs">{cart.deliveryFee > 0 ? formatPrice(cart.deliveryFee) : "At checkout"}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-border">
                    <span className="font-mono text-xs uppercase text-foreground">Total</span>
                    <span className="font-mono text-lg text-foreground">{formatPrice(cart.total)}</span>
                  </div>
                </div>
                <Button asChild className="w-full h-12 font-mono text-xs uppercase touch-target">
                  <Link href="/checkout" onClick={() => toggleCart(false)}>Checkout</Link>
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Plants are living things: the variety and quality will be the same as shown, but your plant can differ a little from the photo.
                </p>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Pay by bank transfer, JazzCash or Easypaisa after you order. We hold your items for 24 hours.
                </p>
                <button 
                  onClick={() => toggleCart(false)} 
                  className="w-full mt-3 py-3 font-mono text-xs uppercase text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md touch-target"
                >
                  Continue Shopping
                </button>
              </div>
            </>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
