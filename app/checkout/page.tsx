"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCart } from "@/components/providers/cart-provider"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"
import { redirect } from "next/navigation"

export default function CheckoutPage() {
  const { cart, itemCount } = useCart()
  const [step, setStep] = useState(1)
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (itemCount === 0) { redirect("/shop/all") }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    await new Promise(r => setTimeout(r, 1500))
    toast.success("Order placed!")
    setIsSubmitting(false)
  }

  const deliveryFee = deliveryType === "delivery" ? 200 : 0
  const total = cart.subtotal + deliveryFee

  return (
    <div className="bg-cream-100 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="font-serif text-2xl mb-6">Checkout</h1>
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            {step === 1 && (
              <div className="space-y-4 p-6 border border-forest-200 rounded-xl bg-white">
                <h2 className="font-medium">Contact Information</h2>
                <Input placeholder="Email" type="email" />
                <Input placeholder="Phone (WhatsApp)" />
                <Button onClick={() => setStep(2)} className="w-full">Continue</Button>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-4 p-6 border border-forest-200 rounded-xl bg-white">
                <h2 className="font-medium">Delivery Method</h2>
                <div className="flex gap-2">
                  <button onClick={() => setDeliveryType("delivery")} className={`flex-1 p-3 border-2 rounded-lg ${deliveryType === "delivery" ? "border-clay-500" : "border-forest-200"}`}>Delivery (PKR 200)</button>
                  <button onClick={() => setDeliveryType("pickup")} className={`flex-1 p-3 border-2 rounded-lg ${deliveryType === "pickup" ? "border-clay-500" : "border-forest-200"}`}>Pickup (Free)</button>
                </div>
                {deliveryType === "delivery" && <Input placeholder="Full Address" />}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                  <Button onClick={() => setStep(3)} className="flex-1">Continue</Button>
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-4 p-6 border border-forest-200 rounded-xl bg-white">
                <h2 className="font-medium">Payment Method</h2>
                <div className="space-y-2">
                  <button className="w-full p-3 border rounded-lg text-left hover:border-clay-500">Credit Card (Online)</button>
                  <button className="w-full p-3 border rounded-lg text-left hover:border-clay-500">Bank Transfer + WhatsApp</button>
                  <button className="w-full p-3 border rounded-lg text-left hover:border-clay-500">JazzCash / Easypaisa</button>
                </div>
                <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Processing..." : `Pay ${formatPrice(total)}`}
                </Button>
              </div>
            )}
          </div>
          <div className="p-6 bg-forest-50 rounded-xl h-fit">
            <h2 className="font-serif text-xl mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4">
              {cart.items.map((item) => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span>{item.product.name} x {item.quantity}</span>
                  <span className="font-mono">{formatPrice((item.variant?.price ?? item.product.price) * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-forest-200 pt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">{formatPrice(cart.subtotal)}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span className="font-mono">{deliveryType === "delivery" ? formatPrice(deliveryFee) : "Free"}</span></div>
              <div className="flex justify-between font-medium text-lg pt-2">
                <span>Total</span>
                <span className="font-mono">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
