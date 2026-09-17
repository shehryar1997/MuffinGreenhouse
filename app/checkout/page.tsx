"use client"

import { useState, useMemo, useCallback } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CitySelect } from "@/components/ui/city-select"
import { useCart } from "@/components/providers/cart-provider"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"
import { redirect } from "next/navigation"
import { ChevronDown, ChevronUp, Check, Package, Truck } from "lucide-react"

// Form state interface - ready for Supabase
interface CheckoutFormData {
  fullName: string
  email: string
  contactNumber: string
  fullAddress: string
  city: string
}

// Validation errors interface
interface FormErrors {
  fullName?: string
  email?: string
  contactNumber?: string
  fullAddress?: string
  city?: string
}

// Touched fields tracking
interface TouchedFields {
  fullName: boolean
  email: boolean
  contactNumber: boolean
  fullAddress: boolean
  city: boolean
}

// TODO: replace with real Supabase Auth session + saved address once backend is wired.
const DEMO_USER = {
  id: "demo-user-123",
  fullName: "Ahmed Khan",
  email: "ahmed.khan@example.com",
  contactNumber: "03001234567",
  fullAddress: "House 142, Street 45, F-8/3, Islamabad",
  city: "Islamabad",
}

export default function CheckoutPage() {
  const { cart, itemCount } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery")
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "wallet" | null>("bank")

  // Guest / Sign-in toggle state
  const [authMode, setAuthMode] = useState<"guest" | "signin">("guest")
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [signInEmail, setSignInEmail] = useState("")

  // Form state
  const [formData, setFormData] = useState<CheckoutFormData>({
    fullName: "",
    email: "",
    contactNumber: "",
    fullAddress: "",
    city: "",
  })

  // Validation errors
  const [errors, setErrors] = useState<FormErrors>({})

  // Touched fields (show error on blur or submit)
  const [touched, setTouched] = useState<TouchedFields>({
    fullName: false,
    email: false,
    contactNumber: false,
    fullAddress: false,
    city: false,
  })

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string): boolean => {
    // Pakistani mobile number: starts with 03, followed by 9 digits (11 total)
    const phoneRegex = /^03\d{9}$/
    return phoneRegex.test(phone.replace(/\D/g, ""))
  }

  // Compute validation errors
  const computeErrors = useCallback((): FormErrors => {
    const newErrors: FormErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required"
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Name must be at least 2 characters"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = "Contact number is required"
    } else if (!validatePhone(formData.contactNumber)) {
      newErrors.contactNumber = "Please enter a valid Pakistani mobile number (e.g., 03001234567)"
    }

    if (deliveryType === "delivery") {
      if (!formData.fullAddress.trim()) {
        newErrors.fullAddress = "Full address is required for delivery"
      } else if (formData.fullAddress.trim().length < 5) {
        newErrors.fullAddress = "Please enter a complete address"
      }

      if (!formData.city) {
        newErrors.city = "City is required for delivery"
      }
    }

    return newErrors
  }, [formData, deliveryType])

  // Update errors when form changes
  const validationErrors = useMemo(() => computeErrors(), [computeErrors])

  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleBlur = (field: keyof TouchedFields) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    // Update errors for this field
    setErrors(prev => ({ ...prev, [field]: validationErrors[field] }))
  }

  const handleCityChange = (city: string) => {
    setFormData(prev => ({ ...prev, city }))
    setTouched(prev => ({ ...prev, city: true }))
    setErrors(prev => ({ ...prev, city: validationErrors.city }))
  }

  // Handle sign-in (demo only - no real auth)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signInEmail) {
      toast.error("Please enter your email")
      return
    }
    setIsSigningIn(true)
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1000))
    // Auto-populate with demo user data
    setFormData({
      fullName: DEMO_USER.fullName,
      email: DEMO_USER.email,
      contactNumber: DEMO_USER.contactNumber,
      fullAddress: DEMO_USER.fullAddress,
      city: DEMO_USER.city,
    })
    setTouched({
      fullName: true,
      email: true,
      contactNumber: true,
      fullAddress: true,
      city: true,
    })
    // Clear errors since demo data is valid
    setErrors(computeErrors())
    setIsSigningIn(false)
    setAuthMode("guest") // Stay in guest mode visually, but with populated data
    toast.success(`Welcome back, ${DEMO_USER.fullName}!`)
  }

  // Section collapse states
  const [sections, setSections] = useState({
    contact: false,
    delivery: false,
    payment: false,
  })

  const toggleSection = (section: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  if (itemCount === 0) { redirect("/shop/all") }

  const handleSubmit = async () => {
    // Touch all fields to show errors
    setTouched({
      fullName: true,
      email: true,
      contactNumber: true,
      fullAddress: true,
      city: true,
    })

    // Update all errors
    const allErrors = computeErrors()
    setErrors(allErrors)

    if (Object.keys(allErrors).length > 0) {
      toast.error("Please fill in all required fields correctly")
      return
    }

    setIsSubmitting(true)
    await new Promise(r => setTimeout(r, 1500))
    toast.success("Order placed!")
    setIsSubmitting(false)
  }

  // Calculate delivery fee based on city and delivery type
  const deliveryFee = useMemo(() => {
    if (deliveryType === "pickup") {
      // Self pickup is always free
      return 0
    }
    if (deliveryType === "delivery") {
      if (formData.city === "Karachi") {
        // Bykea charges for Karachi delivery
        return 400
      }
      // TODO: out-of-city shipping rate not yet decided, don't invent a number
      return 0
    }
    return 0
  }, [deliveryType, formData.city])

  const total = cart.subtotal + deliveryFee

  // Section completion status
  const contactComplete = formData.fullName && formData.email && !errors.fullName && !errors.email
  const deliveryComplete = !validationErrors.contactNumber && 
    (deliveryType === "pickup" || (formData.fullAddress && formData.city && !validationErrors.fullAddress && !validationErrors.city))

  return (
    <div className="bg-cream-100 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="font-serif text-3xl mb-8">Checkout</h1>
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Main Form - 3 columns */}
          <div className="lg:col-span-3 space-y-4">
            {/* Guest / Sign-in Toggle */}
            <div className="bg-white border border-forest-200 rounded-xl overflow-hidden">
              <div className="flex border-b border-forest-200">
                <button
                  type="button"
                  onClick={() => setAuthMode("guest")}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                    authMode === "guest"
                      ? "bg-forest-50 text-forest-900 border-b-2 border-clay-500"
                      : "text-forest-600 hover:bg-forest-50/50"
                  }`}
                >
                  Continue as Guest
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("signin")}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                    authMode === "signin"
                      ? "bg-forest-50 text-forest-900 border-b-2 border-clay-500"
                      : "text-forest-600 hover:bg-forest-50/50"
                  }`}
                >
                  Already have an account? Sign in
                </button>
              </div>
              {authMode === "signin" && (
                <div className="p-6">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <p className="text-sm text-forest-600">
                      Sign in to auto-fill your saved details
                    </p>
                    <div className="space-y-1.5">
                      <label htmlFor="signInEmail" className="text-sm font-medium text-forest-700">
                        Email
                      </label>
                      <Input
                        id="signInEmail"
                        type="email"
                        placeholder="you@example.com"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSigningIn}
                    >
                      {isSigningIn ? "Signing in..." : "Sign in (Demo)"}
                    </Button>
                    <p className="text-xs text-forest-400 text-center">
                      Any email will work for demo. This uses hardcoded data.
                    </p>
                  </form>
                </div>
              )}
            </div>

            <SectionCard
              title="Contact Information"
              isComplete={!!contactComplete}
              isCollapsed={sections.contact}
              onToggle={() => toggleSection("contact")}
              stepNumber={1}
            >
              <div className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label htmlFor="fullName" className="text-sm font-medium text-forest-700">
                    Full Name <span className="text-clay-500">*</span>
                  </label>
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    onBlur={() => handleBlur("fullName")}
                    className={touched.fullName && errors.fullName ? "border-destructive" : ""}
                  />
                  {touched.fullName && errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-forest-700">
                    Email <span className="text-clay-500">*</span>
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    onBlur={() => handleBlur("email")}
                    className={touched.email && errors.email ? "border-destructive" : ""}
                  />
                  {touched.email && errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
              </div>
            </SectionCard>
            <SectionCard
              title="Delivery Method"
              isComplete={!!deliveryComplete}
              isCollapsed={sections.delivery}
              onToggle={() => toggleSection("delivery")}
              stepNumber={2}
            >
              <div className="space-y-4">
                {/* City - shown first, required for all */}
                <div className="space-y-1.5">
                  <label htmlFor="city" className="text-sm font-medium text-forest-700">
                    City <span className="text-clay-500">*</span>
                  </label>
                  <CitySelect
                    value={formData.city}
                    onChange={handleCityChange}
                    placeholder="Select your city"
                    error={touched.city && !!errors.city}
                  />
                  {touched.city && errors.city && (
                    <p className="text-sm text-destructive">{errors.city}</p>
                  )}
                </div>

                {/* Contact Number - always shown */}
                <div className="space-y-1.5">
                  <label htmlFor="contactNumber" className="text-sm font-medium text-forest-700">
                    Contact Number (WhatsApp) <span className="text-clay-500">*</span>
                  </label>
                  <Input
                    id="contactNumber"
                    type="tel"
                    placeholder="03001234567"
                    value={formData.contactNumber}
                    onChange={(e) => handleInputChange("contactNumber", e.target.value)}
                    onBlur={() => handleBlur("contactNumber")}
                    className={touched.contactNumber && errors.contactNumber ? "border-destructive" : ""}
                  />
                  {touched.contactNumber && errors.contactNumber && (
                    <p className="text-sm text-destructive">{errors.contactNumber}</p>
                  )}
                  <p className="text-xs text-forest-400">Enter your Pakistani mobile number (e.g., 03001234567)</p>
                </div>

                {/* Full Address - only for delivery */}
                {deliveryType === "delivery" && (
                  <div className="space-y-1.5">
                    <label htmlFor="fullAddress" className="text-sm font-medium text-forest-700">
                      Full Address <span className="text-clay-500">*</span>
                    </label>
                    <textarea
                      id="fullAddress"
                      placeholder="House/Building number, Street, Area, Landmark"
                      value={formData.fullAddress}
                      onChange={(e) => handleInputChange("fullAddress", e.target.value)}
                      onBlur={() => handleBlur("fullAddress")}
                      className={`flex min-h-[80px] w-full rounded-md border px-3 py-2 text-base md:text-sm ring-offset-background placeholder:text-forest-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-500 focus-visible:ring-offset-2 ${
                        touched.fullAddress && errors.fullAddress ? "border-destructive" : "border-forest-200"
                      }`}
                    />
                    {touched.fullAddress && errors.fullAddress && (
                      <p className="text-sm text-destructive">{errors.fullAddress}</p>
                    )}
                  </div>
                )}

                {/* Delivery/Pickup Options - only shown when city is selected */}
                {formData.city && (
                  <DeliveryOptionsSection
                    city={formData.city}
                    deliveryType={deliveryType}
                    onSelect={setDeliveryType}
                  />
                )}
              </div>
            </SectionCard>
            <SectionCard
              title="Payment Method"
              isComplete={!!paymentMethod}
              isCollapsed={sections.payment}
              onToggle={() => toggleSection("payment")}
              stepNumber={3}
            >
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bank")}
                  className={`w-full p-4 border-2 rounded-xl text-left transition-all flex items-center gap-3 ${
                    paymentMethod === "bank" ? "border-clay-500 bg-clay-50" : "border-forest-200 hover:border-forest-300"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === "bank" ? "bg-clay-500 border-clay-500" : "border-forest-300"
                  }`}>
                    {paymentMethod === "bank" && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <div className="font-medium">Bank Transfer + WhatsApp</div>
                    <div className="text-sm text-forest-500">Transfer to account and share screenshot</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("wallet")}
                  className={`w-full p-4 border-2 rounded-xl text-left transition-all flex items-center gap-3 ${
                    paymentMethod === "wallet" ? "border-clay-500 bg-clay-50" : "border-forest-200 hover:border-forest-300"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === "wallet" ? "bg-clay-500 border-clay-500" : "border-forest-300"
                  }`}>
                    {paymentMethod === "wallet" && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <div className="font-medium">JazzCash / Easypaisa</div>
                    <div className="text-sm text-forest-500">Pay via mobile wallet</div>
                  </div>
                </button>
              </div>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full mt-6 h-12 text-base">
                {isSubmitting ? "Processing..." : `Complete Order • ${formatPrice(total)}`}
              </Button>
            </SectionCard>
          </div>
          {/* Order Summary - 2 columns */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-8">
              <OrderSummary
                items={cart.items}
                subtotal={cart.subtotal}
                deliveryFee={deliveryFee}
                deliveryType={deliveryType}
                total={total}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Delivery Options Section Component
interface DeliveryOptionsSectionProps {
  city: string
  deliveryType: "delivery" | "pickup"
  onSelect: (type: "delivery" | "pickup") => void
}

function DeliveryOptionsSection({ city, deliveryType, onSelect }: DeliveryOptionsSectionProps) {
  const isKarachi = city === "Karachi"

  return (
    <div className="pt-4 border-t border-forest-100">
      <p className="text-sm font-medium text-forest-700 mb-3">Choose your delivery option</p>

      {isKarachi ? (
        /* Karachi: Self Pickup + Proceed to Checkout (Bykea) */
        <div className="flex flex-col gap-3">
          {/* Self Pickup Option */}
          <button
            type="button"
            onClick={() => onSelect("pickup")}
            className={`p-4 border-2 rounded-xl text-left transition-all ${
              deliveryType === "pickup"
                ? "border-clay-500 bg-clay-50"
                : "border-forest-200 hover:border-forest-300"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg ${
                  deliveryType === "pickup"
                    ? "bg-clay-500 text-white"
                    : "bg-forest-100 text-forest-600"
                }`}
              >
                <Package className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Self Pickup</div>
                <div className="text-sm text-forest-500">
                  No delivery charges apply. Pick-up at A-104, Block-C, Gulshan-e-Jamal, Karachi.
                  Here&apos;s the google location:{" "}
                  <a
                    href="https://maps.app.goo.gl/RR6spoLDEkdZ5JUG8"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-clay-500 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    https://maps.app.goo.gl/RR6spoLDEkdZ5JUG8
                  </a>
                </div>
                <div className="text-sm font-mono mt-1 text-sprout-500">Free</div>
              </div>
            </div>
          </button>

          {/* Proceed to Checkout (Bykea) Option */}
          <button
            type="button"
            onClick={() => onSelect("delivery")}
            className={`p-4 border-2 rounded-xl text-left transition-all ${
              deliveryType === "delivery"
                ? "border-clay-500 bg-clay-50"
                : "border-forest-200 hover:border-forest-300"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg ${
                  deliveryType === "delivery"
                    ? "bg-clay-500 text-white"
                    : "bg-forest-100 text-forest-600"
                }`}
              >
                <Truck className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Proceed to Checkout</div>
                <div className="text-sm text-forest-500">
                  Standard 400 PKR Bykea Charges Apply
                </div>
                <div className="text-sm font-mono mt-1">{formatPrice(400)}</div>
              </div>
            </div>
          </button>
        </div>
      ) : (
        /* Non-Karachi: Only Proceed to Checkout */
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => onSelect("delivery")}
            className={`p-4 border-2 rounded-xl text-left transition-all ${
              deliveryType === "delivery"
                ? "border-clay-500 bg-clay-50"
                : "border-forest-200 hover:border-forest-300"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg ${
                  deliveryType === "delivery"
                    ? "bg-clay-500 text-white"
                    : "bg-forest-100 text-forest-600"
                }`}
              >
                <Truck className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Proceed to Checkout</div>
                <div className="text-sm text-forest-500">
                  Order will be shipped out in 1-2 business days
                </div>
                {/* TODO: out-of-city shipping rate not yet decided, don&apos;t invent a number */}
                <div className="text-sm font-mono mt-1 text-sprout-500">Free</div>
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}

// Section Card Component
interface SectionCardProps {
  title: string
  children: React.ReactNode
  isComplete: boolean
  isCollapsed: boolean
  onToggle: () => void
  stepNumber: number
}

function SectionCard({ title, children, isComplete, isCollapsed, onToggle, stepNumber }: SectionCardProps) {
  return (
    <div className={`border border-forest-200 rounded-xl bg-white overflow-hidden transition-all ${isCollapsed ? "opacity-75" : ""}`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between text-left hover:bg-forest-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            isComplete ? "bg-sprout-500 text-forest-900" : "bg-forest-100 text-forest-700"
          }`}>
            {isComplete ? <Check className="w-4 h-4" /> : stepNumber}
          </div>
          <div>
            <h2 className="font-medium text-lg">{title}</h2>
            {isCollapsed && isComplete && <span className="text-sm text-forest-400">Completed</span>}
          </div>
        </div>
        {isCollapsed ? <ChevronDown className="w-5 h-5 text-forest-400" /> : <ChevronUp className="w-5 h-5 text-forest-400" />}
      </button>
      {!isCollapsed && <div className="px-6 pb-6 border-t border-forest-100 pt-4">{children}</div>}
    </div>
  )
}

// Order Summary Component
interface OrderSummaryProps {
  items: Array<{
    product: {
      id: string
      name: string
      images: { url: string; alt?: string }[]
      price: number
    }
    quantity: number
    variant?: { name: string; price: number } | null
  }>
  subtotal: number
  deliveryFee: number
  deliveryType: "delivery" | "pickup"
  total: number
}

function OrderSummary({ items, subtotal, deliveryFee, deliveryType, total }: OrderSummaryProps) {
  return (
    <div className="p-6 bg-white border border-forest-200 rounded-xl">
      <h2 className="font-serif text-xl mb-6">Order Summary</h2>
      <div className="space-y-4 mb-6">
        {items.map((item) => {
          const price = item.variant?.price ?? item.product.price
          const lineTotal = price * item.quantity
          const imageUrl = item.product.images[0]?.url || "/placeholder-plant.jpg"
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
          <div className="flex justify-between text-sm">
            <span className="text-forest-500">Delivery</span>
            <span className="font-mono">{deliveryType === "delivery" ? formatPrice(deliveryFee) : "Free"}</span>
          </div>
        </div>
        <div className="border-t border-forest-200 pt-4">
          <div className="flex justify-between items-center">
            <span className="font-medium text-lg">Total</span>
            <span className="font-mono text-2xl font-medium">{formatPrice(total)}</span>
          </div>
          <p className="text-xs text-forest-400 mt-2 text-right">Including all taxes</p>
        </div>
      </div>
    </div>
  )
}
