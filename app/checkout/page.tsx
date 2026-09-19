"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CitySelect } from "@/components/ui/city-select"
import { useCart } from "@/components/providers/cart-provider"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"
import { redirect, useRouter } from "next/navigation"
import { trackBeginCheckout } from "@/lib/analytics"
import { Package, Truck, Check, AlertCircle, Loader2 } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/browser-client"
import Link from "next/link"
import type { CartItem } from "@/types"

interface SavedAddress {
  id: string
  label: string
  street: string
  city: string
  province: string
  is_default: boolean
}

interface CheckoutFormData {
  fullName: string
  email: string
  contactNumber: string
  fullAddress: string
  city: string
}

interface FormErrors {
  fullName?: string
  email?: string
  contactNumber?: string
  fullAddress?: string
  city?: string
}

interface TouchedFields {
  fullName: boolean
  email: boolean
  contactNumber: boolean
  fullAddress: boolean
  city: boolean
}

interface EmailCheckResult {
  exists: boolean
  hasAuth: boolean
}

interface ProductDimensions {
  boxHeightCm: number | null
  boxWidthCm: number | null
  boxBreadthCm: number | null
  categorySlug: string | null
  weightKg: number | null
}

type CheckoutStep = 1 | 2

export default function CheckoutPage() {
  const { cart, itemCount, clearCart } = useCart()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(1)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery")
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [emailCheckResult, setEmailCheckResult] = useState<EmailCheckResult | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [signedInCustomer, setSignedInCustomer] = useState<{ id: string; name: string | null; email: string; phone: string | null } | null>(null)
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | "manual">("manual")
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [isCalculatingDeliveryFee, setIsCalculatingDeliveryFee] = useState(false)
  const [deliveryFeeError, setDeliveryFeeError] = useState<string | null>(null)
  const [productDimensions, setProductDimensions] = useState<Record<string, ProductDimensions>>({})
  const [formData, setFormData] = useState<CheckoutFormData>({ fullName: "", email: "", contactNumber: "", fullAddress: "", city: "" })
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<TouchedFields>({ fullName: false, email: false, contactNumber: false, fullAddress: false, city: false })

  const subtotal = cart.subtotal
  const total = useMemo(() => deliveryType === "pickup" ? subtotal : subtotal + deliveryFee, [subtotal, deliveryFee, deliveryType])

  // Fire GA4 begin_checkout event when cart is loaded
  useEffect(() => {
    if (itemCount > 0) {
      trackBeginCheckout({
        value: cart.subtotal,
        currency: "PKR",
        items: cart.items.map((item) => ({
          item_name: item.product.name,
          quantity: item.quantity,
          price: item.variant?.price ?? item.product.price,
        })),
      })
    }
  }, [itemCount])

  const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase())
  const validatePhone = (phone: string): boolean => phone.replace(/\D/g, "").length >= 10

  const checkCustomerEmail = async (email: string, signal?: AbortSignal): Promise<EmailCheckResult> => {
    if (!email || !validateEmail(email)) return { exists: false, hasAuth: false }
    setIsCheckingEmail(true)
    try {
      const response = await fetch("/api/check-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
        signal,
      })
      if (!response.ok) throw new Error("Failed to check email")
      const result = await response.json() as EmailCheckResult
      setEmailCheckResult(result)
      return result
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === "AbortError") {
        return { exists: false, hasAuth: false }
      }
      console.error("Email check error:", err)
      return { exists: false, hasAuth: false }
    } finally {
      setIsCheckingEmail(false)
    }
  }

  const handleEmailBlur = async () => {
    // Already signed in as this customer - /api/check-customer would report
    // hasAuth: true for their own email (that's what makes them signed in),
    // which isn't "someone else's registered account", so skip the check.
    if (signedInCustomer) return
    if (!formData.email || !validateEmail(formData.email)) {
      setEmailCheckResult(null)
      return
    }
    await checkCustomerEmail(formData.email)
  }

  const fetchProductDimensions = useCallback(async (productIds: string[], signal?: AbortSignal) => {
    if (productIds.length === 0) return
    try {
      const response = await fetch("/api/product-dimensions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds }),
        signal,
      })
      if (!response.ok) throw new Error("Failed to fetch product dimensions")
      const dimensions = await response.json() as Record<string, ProductDimensions>
      setProductDimensions(dimensions)
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === "AbortError") return
      console.error("Error fetching product dimensions:", err)
    }
  }, [])

  const calculateDeliveryFee = useCallback(async () => {
    if (deliveryType === "pickup") {
      setDeliveryFee(0)
      setDeliveryFeeError(null)
      setIsCalculatingDeliveryFee(false)
      return
    }
    if (formData.city === "Karachi") {
      setDeliveryFee(400)
      setDeliveryFeeError(null)
      setIsCalculatingDeliveryFee(false)
      return
    }
    setIsCalculatingDeliveryFee(true)
    setDeliveryFeeError(null)
    try {
      const productIds = cart.items.map(item => item.product.id)
      if (Object.keys(productDimensions).length === 0) await fetchProductDimensions(productIds)
      // Sum one chargeable weight per item and total the whole cart, so an
      // item with usable data and an item without both count toward the
      // shipment instead of the second one silently contributing nothing.
      let totalWeight = 0
      cart.items.forEach(item => {
        const dim = productDimensions[item.product.id]
        const quantity = item.quantity
        const categorySlug = dim?.categorySlug?.toLowerCase() || ""

        if (categorySlug === "equipment" || categorySlug.includes("equipment")) {
          // Equipment is charged by actual weight; assume 1kg/unit if it
          // hasn't been recorded.
          totalWeight += (dim?.weightKg || 1) * quantity
          return
        }

        const hasFullBoxDimensions = !!(dim?.boxHeightCm && dim?.boxWidthCm && dim?.boxBreadthCm)
        if (hasFullBoxDimensions) {
          const volumetricWeight = (dim!.boxHeightCm! * dim!.boxWidthCm! * dim!.boxBreadthCm!) / 5000
          const actualWeight = dim?.weightKg || 0
          // Courier convention: charge whichever is greater, volumetric or actual.
          totalWeight += Math.max(volumetricWeight, actualWeight) * quantity
        } else {
          // Box dimensions are missing or incomplete for this product - fall
          // back to its recorded actual weight if we at least have that,
          // otherwise assume a 1kg parcel per unit rather than contributing
          // zero weight (which would silently drop this item from the fee).
          totalWeight += (dim?.weightKg || 1) * quantity
        }
      })
      const calculatedFee = totalWeight <= 0.5 ? 600 : totalWeight <= 1 ? 800 : totalWeight <= 3 ? 1000 : totalWeight <= 5 ? 1400 : totalWeight <= 10 ? 1800 : 2200
      setDeliveryFee(calculatedFee)
    } catch (err) {
      console.error("Delivery fee calculation error:", err)
      setDeliveryFeeError("Failed to calculate delivery fee")
      setDeliveryFee(800)
    } finally {
      setIsCalculatingDeliveryFee(false)
    }
  }, [cart.items, formData.city, deliveryType, productDimensions, fetchProductDimensions])

  useEffect(() => {
    if (currentStep === 1 && deliveryType === "delivery" && formData.city) calculateDeliveryFee()
  }, [formData.city, deliveryType, cart.items, currentStep, calculateDeliveryFee])

  const validateField = (field: keyof CheckoutFormData, value: string): string | undefined => {
    switch (field) {
      case "fullName": return value.trim().length < 2 ? "Full name is required" : undefined
      case "email": return !validateEmail(value) ? "Valid email required" : undefined
      case "contactNumber": return !validatePhone(value) ? "Valid phone required" : undefined
      case "fullAddress": return deliveryType === "pickup" ? undefined : (value.trim().length < 10 ? "Address required" : undefined)
      case "city": return !value ? "Please select a city" : undefined
      default: return undefined
    }
  }

  const handleFieldChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (touched[field as keyof TouchedFields]) {
      const error = validateField(field, value)
      setErrors(prev => ({ ...prev, [field]: error }))
    }
    if (field === "email") setEmailCheckResult(null)
  }

  const handleFieldBlur = (field: keyof CheckoutFormData) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const error = validateField(field, formData[field])
    setErrors(prev => ({ ...prev, [field]: error }))
    if (field === "email") handleEmailBlur()
  }

  const validateForm = (): boolean => {
    const newErrors = {
      fullName: validateField("fullName", formData.fullName),
      email: validateField("email", formData.email),
      contactNumber: validateField("contactNumber", formData.contactNumber),
      fullAddress: validateField("fullAddress", formData.fullAddress),
      city: validateField("city", formData.city),
    }
    setErrors(newErrors)
    setTouched({ fullName: true, email: true, contactNumber: true, fullAddress: true, city: true })
    return !Object.values(newErrors).some(Boolean)
  }

  const handleProceedToPay = async () => {
    // Skip the "registered, please sign in" gate entirely once already
    // signed in - there's no other account to check the email against.
    if (!signedInCustomer) {
      if (emailCheckResult?.hasAuth) { toast.error("This email is registered -- please sign in"); return }
      if (!validateForm()) { toast.error("Please fix the errors"); return }
      const checkResult = await checkCustomerEmail(formData.email)
      if (checkResult.hasAuth) { toast.error("This email is registered -- please sign in"); return }
    } else if (!validateForm()) {
      toast.error("Please fix the errors")
      return
    }
    setCurrentStep(2)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleBackToDelivery = () => {
    setCurrentStep(1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true)
    try {
      const payload = {
        customerId: signedInCustomer?.id || null,
        customerEmail: formData.email,
        customerName: formData.fullName,
        customerPhone: formData.contactNumber,
        items: cart.items.map((item) => ({
          productId: item.product.id,
          variantId: item.variant?.id || null,
          quantity: item.quantity,
        })),
        deliveryType,
        addressId: deliveryType === "delivery" && selectedAddressId !== "manual" ? selectedAddressId : null,
        newAddress: deliveryType === "delivery" && selectedAddressId === "manual"
          ? { fullAddress: formData.fullAddress, city: formData.city }
          : null,
        paymentMethod: "bank_transfer" as const,
        deliveryFee,
        cartSubtotal: subtotal,
      }

      const response = await fetch("/api/checkout-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to place order")
      }

      setOrderPlaced(true)
      clearCart()
      router.push(result.redirectTo)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to place order")
    } finally {
      setIsPlacingOrder(false)
    }
  }

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: customerData } = await supabase.from("customers").select("id, name, email, phone").eq("auth_id", session.user.id).single()
        if (customerData) {
          setSignedInCustomer(customerData)
          setFormData(prev => ({ ...prev, fullName: customerData.name || "", email: customerData.email || "", contactNumber: customerData.phone || "" }))
          const { data: addresses } = await supabase.from("addresses").select("id, label, street, city, province, is_default").eq("customer_id", customerData.id).order("is_default", { ascending: false })
          if (addresses && addresses.length > 0) {
            setSavedAddresses(addresses)
            const defaultAddress = addresses.find(a => a.is_default) || addresses[0]
            if (defaultAddress) {
              setSelectedAddressId(defaultAddress.id)
              setFormData(prev => ({ ...prev, fullAddress: defaultAddress.street, city: defaultAddress.city }))
            }
          }
        }
      }
      setCheckingSession(false)
    }
    checkSession()
  }, [])

  if (checkingSession) return <div className="min-h-screen flex items-center justify-center bg-forest-50"><div className="text-center"><div className="w-8 h-8 border-4 border-sprout-500 border-t-transparent rounded-full animate-spin mx-auto"></div><p className="mt-4 text-forest-700">Loading...</p></div></div>
  if (itemCount === 0 && !orderPlaced) redirect('/shop/all')
  return (
    <div className="min-h-screen bg-forest-50">
      <div className="pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center">
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 1 ? "bg-sprout-500 text-white" : "bg-forest-200 text-forest-500"}`}>
                  {currentStep > 1 ? <Check className="w-5 h-5" /> : "1"}
                </div>
                <div className={`ml-2 text-sm font-medium ${currentStep === 1 ? "text-forest-900" : "text-forest-500"}`}>Delivery Details</div>
              </div>
              <div className={`w-16 sm:w-24 h-0.5 mx-4 ${currentStep === 2 ? "bg-sprout-500" : "bg-forest-200"}`} />
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep === 2 ? "bg-sprout-500 text-white" : "bg-forest-200 text-forest-500"}`}>2</div>
                <div className={`ml-2 text-sm font-medium ${currentStep === 2 ? "text-forest-900" : "text-forest-500"}`}>Payment</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              {currentStep === 1 ? (
                <div className="space-y-6">
                  <div>
                    <h1 className="font-serif text-2xl sm:text-3xl text-forest-900">Delivery Details</h1>
                    <p className="text-forest-500 mt-1">Enter your delivery information</p>
                  </div>

                  {/* Email Check Block */}
                  {emailCheckResult?.hasAuth && !signedInCustomer && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-amber-800">This email is registered -- please sign in</h4>
                          <p className="text-sm text-amber-700 mt-1">Sign in to access your saved addresses and checkout faster.</p>
                          <div className="mt-3 flex gap-3">
                            <Link href={`/account/login?returnTo=/checkout&email=${encodeURIComponent(formData.email)}`}>
                              <Button size="sm">Sign In</Button>
                            </Link>
                            <button type="button" onClick={() => setEmailCheckResult(null)} className="text-sm text-amber-700 hover:underline">Use different email</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Delivery Form */}
                  <div className="p-6 bg-white border border-forest-200 rounded-xl">
                    {/* Email */}
                    <div className="mb-4">
                      <label htmlFor="email" className="block text-sm font-medium text-forest-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                      <Input id="email" type="email" value={formData.email} onChange={(e) => handleFieldChange("email", e.target.value)} onBlur={() => handleFieldBlur("email")} placeholder="your@email.com" disabled={!!signedInCustomer} className={errors.email && touched.email ? "border-red-300" : ""} />
                      {errors.email && touched.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                      {isCheckingEmail && <p className="mt-1 text-sm text-forest-400">Checking email...</p>}
                    </div>

                    {/* Full Name */}
                    <div className="mb-4">
                      <label htmlFor="fullName" className="block text-sm font-medium text-forest-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                      <Input id="fullName" type="text" value={formData.fullName} onChange={(e) => handleFieldChange("fullName", e.target.value)} onBlur={() => handleFieldBlur("fullName")} placeholder="Enter your full name" className={errors.fullName && touched.fullName ? "border-red-300" : ""} />
                      {errors.fullName && touched.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
                    </div>

                    {/* Contact Number */}
                    <div className="mb-4">
                      <label htmlFor="contactNumber" className="block text-sm font-medium text-forest-700 mb-1">Contact Number <span className="text-red-500">*</span></label>
                      <Input id="contactNumber" type="tel" value={formData.contactNumber} onChange={(e) => handleFieldChange("contactNumber", e.target.value)} onBlur={() => handleFieldBlur("contactNumber")} placeholder="03XX-XXXXXXX" className={errors.contactNumber && touched.contactNumber ? "border-red-300" : ""} />
                      {errors.contactNumber && touched.contactNumber && <p className="mt-1 text-sm text-red-600">{errors.contactNumber}</p>}
                    </div>

                    {/* Saved Addresses */}
                    {savedAddresses.length > 0 && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-forest-700 mb-2">Saved Addresses</label>
                        <div className="space-y-2">
                          {savedAddresses.map((addr) => (
                            <label key={addr.id} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer ${selectedAddressId === addr.id ? "border-sprout-500 bg-sprout-50" : "border-forest-200"}`}>
                              <input type="radio" name="savedAddress" value={addr.id} checked={selectedAddressId === addr.id} onChange={() => { setSelectedAddressId(addr.id); setFormData(prev => ({ ...prev, fullAddress: addr.street, city: addr.city })) }} className="mt-1" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{addr.label}</span>
                                  {addr.is_default && <span className="text-xs bg-sprout-100 text-sprout-700 px-2 py-0.5 rounded">Default</span>}
                                </div>
                                <p className="text-sm text-forest-500">{addr.street}</p>
                                <p className="text-sm text-forest-400">{addr.city}</p>
                              </div>
                            </label>
                          ))}
                          <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${selectedAddressId === "manual" ? "border-sprout-500 bg-sprout-50" : "border-forest-200"}`}>
                            <input type="radio" name="savedAddress" value="manual" checked={selectedAddressId === "manual"} onChange={() => { setSelectedAddressId("manual"); setFormData(prev => ({ ...prev, fullAddress: "", city: "" })) }} className="mt-0.5" />
                            <span className="text-sm text-forest-600">Enter a different address</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* City */}
                    <div className="mb-4">
                      <label htmlFor="city" className="block text-sm font-medium text-forest-700 mb-1">City <span className="text-red-500">*</span></label>
                      <CitySelect value={formData.city} onChange={(value) => { handleFieldChange("city", value); setTouched(prev => ({ ...prev, city: true })); setErrors(prev => ({ ...prev, city: validateField("city", value) })) }} error={errors.city && touched.city ? true : false} className={errors.city && touched.city ? "border-red-300" : ""} />
                      {errors.city && touched.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                    </div>

                    {/* Full Address */}
                    <div className="mb-4">
                      <label htmlFor="fullAddress" className="block text-sm font-medium text-forest-700 mb-1">Delivery Address <span className="text-red-500">*</span></label>
                      <textarea id="fullAddress" rows={3} value={formData.fullAddress} onChange={(e) => handleFieldChange("fullAddress", e.target.value)} onBlur={() => handleFieldBlur("fullAddress")} placeholder="Enter your complete address" className={`w-full px-3 py-2 border rounded-md ${errors.fullAddress && touched.fullAddress ? "border-red-300" : "border-forest-200"}`} />
                      {errors.fullAddress && touched.fullAddress && <p className="mt-1 text-sm text-red-600">{errors.fullAddress}</p>}
                    </div>

                    {/* Delivery Options */}
                    <DeliveryOptionsSection city={formData.city} deliveryType={deliveryType} onSelect={setDeliveryType} />
                  </div>

                  {/* Proceed Button */}
                  <Button onClick={handleProceedToPay} disabled={isCheckingEmail || emailCheckResult?.hasAuth} className="w-full h-12 text-base">
                    {`Proceed to Pay -- ${formatPrice(total)}`}
                  </Button>
                  {emailCheckResult?.hasAuth && !signedInCustomer && <p className="text-center text-sm text-amber-600">Please sign in to continue with this email</p>}
                </div>
              ) : (
                <div className="space-y-6">
                  <button type="button" onClick={handleBackToDelivery} className="flex items-center text-sm text-forest-600 hover:text-forest-800">
                    <span className="mr-1">&#8592;</span>
                    Back to Delivery Details
                  </button>

                  {/* Review & Place Order */}
                  <div className="p-8 bg-white border border-forest-200 rounded-xl text-center">
                    <div className="w-16 h-16 bg-forest-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="w-8 h-8 text-forest-500" />
                    </div>
                    <h2 className="font-serif text-2xl text-forest-900 mb-2">Review &amp; Place Order</h2>
                    <p className="text-forest-500 mb-6">Confirm your details below, then place your order. You&apos;ll get payment instructions on the next screen.</p>
                    <div className="p-4 bg-sprout-50 rounded-lg border border-sprout-200 mb-6">
                      <p className="text-sm text-sprout-600">Total amount: <span className="font-mono font-medium text-sprout-700">{formatPrice(total)}</span></p>
                    </div>
                    <Button onClick={handlePlaceOrder} disabled={isPlacingOrder} className="w-full h-12 text-base">
                      {isPlacingOrder ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Placing Order...</> : `Place Order -- ${formatPrice(total)}`}
                    </Button>
                  </div>

                  {/* Delivery Summary */}
                  <div className="p-6 bg-white border border-forest-200 rounded-xl">
                    <h3 className="font-medium text-forest-900 mb-4">Delivery Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-forest-500">Name</span><span className="text-forest-900">{formData.fullName}</span></div>
                      <div className="flex justify-between"><span className="text-forest-500">Email</span><span className="text-forest-900">{formData.email}</span></div>
                      <div className="flex justify-between"><span className="text-forest-500">Phone</span><span className="text-forest-900">{formData.contactNumber}</span></div>
                      <div className="flex justify-between"><span className="text-forest-500">Address</span><span className="text-forest-900 text-right max-w-[200px]">{formData.fullAddress}</span></div>
                      <div className="flex justify-between"><span className="text-forest-500">City</span><span className="text-forest-900">{formData.city}</span></div>
                      <div className="flex justify-between"><span className="text-forest-500">Delivery</span><span className="text-forest-900 capitalize">{deliveryType === "pickup" ? "Self Pickup" : "Delivery"}</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-8">
                <OrderSummary items={cart.items} subtotal={subtotal} deliveryFee={deliveryFee} deliveryType={deliveryType} total={total} isCalculatingDeliveryFee={isCalculatingDeliveryFee} deliveryFeeError={deliveryFeeError} currentStep={currentStep} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Delivery Options Section Component
function DeliveryOptionsSection({ city, deliveryType, onSelect }: { city: string; deliveryType: "delivery" | "pickup"; onSelect: (type: "delivery" | "pickup") => void }) {
  const isKarachi = city === "Karachi"
  return (
    <div className="pt-4 border-t border-forest-100">
      <p className="text-sm font-medium text-forest-700 mb-3">Choose your delivery option</p>
      {isKarachi ? (
        <div className="flex flex-col gap-3">
          <button type="button" onClick={() => onSelect("pickup")} className={`p-4 border-2 rounded-xl text-left transition-all ${deliveryType === "pickup" ? "border-clay-500 bg-clay-50" : "border-forest-200"}`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${deliveryType === "pickup" ? "bg-clay-500 text-white" : "bg-forest-100 text-forest-600"}`}><Package className="w-5 h-5" /></div>
              <div className="flex-1">
                <div className="font-medium">Self Pickup</div>
                <div className="text-sm text-forest-500">No delivery charges apply. Pick-up at A-104, Block-C, Gulshan-e-Jamal, Karachi.</div>
                <div className="text-sm font-mono mt-1 text-sprout-500">Free</div>
              </div>
            </div>
          </button>
          <button type="button" onClick={() => onSelect("delivery")} className={`p-4 border-2 rounded-xl text-left transition-all ${deliveryType === "delivery" ? "border-clay-500 bg-clay-50" : "border-forest-200"}`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${deliveryType === "delivery" ? "bg-clay-500 text-white" : "bg-forest-100 text-forest-600"}`}><Truck className="w-5 h-5" /></div>
              <div className="flex-1">
                <div className="font-medium">Home Delivery</div>
                <div className="text-sm text-forest-500">Standard Karachi delivery charges apply</div>
                <div className="text-sm font-mono mt-1">{formatPrice(400)}</div>
              </div>
            </div>
          </button>
        </div>
      ) : city ? (
        <div className="flex flex-col gap-3">
          <button type="button" onClick={() => onSelect("delivery")} className={`p-4 border-2 rounded-xl text-left transition-all ${deliveryType === "delivery" ? "border-clay-500 bg-clay-50" : "border-forest-200"}`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${deliveryType === "delivery" ? "bg-clay-500 text-white" : "bg-forest-100 text-forest-600"}`}><Truck className="w-5 h-5" /></div>
              <div className="flex-1">
                <div className="font-medium">Home Delivery</div>
                <div className="text-sm text-forest-500">Order will be shipped out in 1-2 business days</div>
                <div className="text-sm font-mono mt-1 text-sprout-500">Calculated based on volumetric weight</div>
              </div>
            </div>
          </button>
          <p className="text-sm text-forest-400 text-center">Self pickup is only available for Karachi customers</p>
        </div>
      ) : (
        <p className="text-sm text-forest-400 text-center py-4">Please select a city to see delivery options</p>
      )}
    </div>
  )
}

// Order Summary Component
function OrderSummary({ items, subtotal, deliveryFee, deliveryType, total, isCalculatingDeliveryFee, deliveryFeeError, currentStep }: { items: CartItem[]; subtotal: number; deliveryFee: number; deliveryType: "delivery" | "pickup"; total: number; isCalculatingDeliveryFee?: boolean; deliveryFeeError?: string | null; currentStep?: number }) {
  return (
    <div className="p-6 bg-white border border-forest-200 rounded-xl">
      <h2 className="font-serif text-xl mb-6">Order Summary</h2>
      <div className="space-y-4 mb-6">
        {items.map((item) => {
          const price = item.variant?.price ?? item.product.price
          const lineTotal = price * item.quantity
          const imageUrl = item.product.images[0]?.url || "/placeholder-plant.png"
          const imageAlt = item.product.images[0]?.alt || item.product.name
          return (
            <div key={item.product.id} className="flex gap-4">
              <div className="relative w-16 h-16 bg-forest-100 rounded-lg overflow-hidden shrink-0">
                <Image src={imageUrl} alt={imageAlt} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm leading-tight line-clamp-1">{item.product.name}</h3>
                {item.variant && <p className="text-xs text-forest-500 mt-0.5">{item.variant.name}</p>}
                <p className="text-xs text-forest-400 mt-0.5">Qty: {item.quantity}</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm">{formatPrice(lineTotal)}</span>
              </div>
            </div>
          )
        })}
      </div>
      <div className="border-t border-forest-200 pt-6">
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-forest-500">Subtotal</span>
            <span className="font-mono">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-forest-500">Delivery</span>
            <div className="flex flex-col items-end">
              {isCalculatingDeliveryFee ? (
                <span className="text-sm text-forest-400 animate-pulse">Calculating...</span>
              ) : deliveryFeeError ? (
                <span className="text-sm text-amber-600 font-medium">{deliveryFeeError}</span>
              ) : (
                <span className="font-mono">{deliveryType === "pickup" ? "Free" : formatPrice(deliveryFee)}</span>
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-forest-200 pt-4">
          <div className="flex justify-between items-center">
            <span className="font-medium text-lg">Total</span>
            <span className="font-mono text-2xl font-medium">{formatPrice(total)}</span>
          </div>
          <p className="text-xs text-forest-400 mt-2 text-right">Including all taxes</p>
          {deliveryFeeError && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <span className="font-medium">Note:</span> We couldn&apos;t confirm the exact delivery cost right now.
                We&apos;ll reach out on WhatsApp to confirm it before shipping.
              </p>
            </div>
          )}
        </div>
        {currentStep === 2 && (
          <div className="mt-4 p-3 bg-sprout-50 border border-sprout-200 rounded-lg">
            <p className="text-sm text-sprout-700 text-center">You&apos;ll choose a payment method after placing your order</p>
          </div>
        )}
      </div>
    </div>
  )
}
