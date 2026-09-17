"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CitySelect } from "@/components/ui/city-select"
import { useCart } from "@/components/providers/cart-provider"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"
import { redirect } from "next/navigation"
import { ChevronDown, ChevronUp, Check, Package, Truck } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/browser-client"
import { resolveEmailOrPhone } from "@/app/account/login/actions"

interface SavedAddress {
  id: string
  label: string
  street: string
  city: string
  province: string
  is_default: boolean
}

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

export default function CheckoutPage() {
  const { cart, itemCount } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery")
  const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "jazzcash" | "easypaisa" | "nayapay" | "zindigi" | "raast" | null>("bank_transfer")

  // Guest / Sign-in toggle state
  const [authMode, setAuthMode] = useState<"guest" | "signin">("guest")
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [signInEmail, setSignInEmail] = useState("")
  const [signInPassword, setSignInPassword] = useState("")

  // Real signed-in session + saved addresses
  const [checkingSession, setCheckingSession] = useState(true)
  const [signedInCustomer, setSignedInCustomer] = useState<{ id: string; name: string | null; email: string; phone: string | null } | null>(null)
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | "manual">("manual")

  // Delivery fee calculation state
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [isCalculatingDeliveryFee, setIsCalculatingDeliveryFee] = useState(false)
  const [deliveryFeeError, setDeliveryFeeError] = useState<string | null>(null)
  const [productDimensions, setProductDimensions] = useState<Record<string, {
    boxHeightCm: number | null
    boxWidthCm: number | null
    boxBreadthCm: number | null
  }>>({})

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

  // Load saved addresses for a signed-in customer and pre-fill the form
  const loadCustomerIntoForm = useCallback((
    customer: { id: string; name: string | null; email: string; phone: string | null },
    addresses: SavedAddress[]
  ) => {
    setSignedInCustomer(customer)
    setSavedAddresses(addresses)
    const defaultAddress = addresses.find((a) => a.is_default) || addresses[0]
    setFormData({
      fullName: customer.name || "",
      email: customer.email,
      contactNumber: customer.phone || "",
      fullAddress: defaultAddress?.street || "",
      city: defaultAddress?.city || "",
    })
    setSelectedAddressId(defaultAddress ? defaultAddress.id : "manual")
    setTouched({ fullName: true, email: true, contactNumber: true, fullAddress: true, city: true })
  }, [])

  // On mount, check for a real, already-active Supabase Auth session
  // (e.g. the person signed in earlier via the header/account page).
  useEffect(() => {
    let cancelled = false
    async function checkSession() {
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || cancelled) {
        if (!cancelled) setCheckingSession(false)
        return
      }
      const { data: customer } = await supabase
        .from("customers")
        .select("id, name, email, phone")
        .eq("auth_id", session.user.id)
        .single()
      if (!customer || cancelled) {
        if (!cancelled) setCheckingSession(false)
        return
      }
      const { data: addresses } = await supabase
        .from("addresses")
        .select("id, label, street, city, province, is_default")
        .eq("customer_id", customer.id)
        .eq("is_active", true)
        .order("is_default", { ascending: false })
      if (!cancelled) {
        loadCustomerIntoForm(customer, addresses || [])
        setCheckingSession(false)
      }
    }
    checkSession()
    return () => { cancelled = true }
  }, [loadCustomerIntoForm])

  // Real sign-in, used from the checkout page's own sign-in tab
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signInEmail || !signInPassword) {
      toast.error("Please enter your email and password")
      return
    }
    setIsSigningIn(true)
    const email = await resolveEmailOrPhone(signInEmail)
    if (!email) {
      toast.error("Incorrect email/phone or password")
      setIsSigningIn(false)
      return
    }

    const supabase = createBrowserClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: signInPassword,
    })

    if (error || !data.session) {
      toast.error("Incorrect email/phone or password")
      setIsSigningIn(false)
      return
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("id, name, email, phone")
      .eq("auth_id", data.session.user.id)
      .single()

    if (!customer) {
      toast.error("Couldn't load your account — try again")
      setIsSigningIn(false)
      return
    }

    const { data: addresses } = await supabase
      .from("addresses")
      .select("id, label, street, city, province, is_default")
      .eq("customer_id", customer.id)
      .eq("is_active", true)
      .order("is_default", { ascending: false })

    loadCustomerIntoForm(customer, addresses || [])
    setIsSigningIn(false)
    toast.success(`Welcome back, ${customer.name || customer.email}!`)
  }

  const handleSelectSavedAddress = (id: string) => {
    setSelectedAddressId(id)
    if (id === "manual") {
      setFormData((prev) => ({ ...prev, fullAddress: "", city: "" }))
      return
    }
    const address = savedAddresses.find((a) => a.id === id)
    if (address) {
      setFormData((prev) => ({ ...prev, fullAddress: address.street, city: address.city }))
      setTouched((prev) => ({ ...prev, fullAddress: true, city: true }))
    }
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

    // Validate payment method
    if (!paymentMethod) {
      toast.error("Please select a payment method")
      return
    }

    // For out-of-city deliveries, check if all product dimensions are available
    if (deliveryType === "delivery" && formData.city !== "Karachi" && formData.city.trim() !== "") {
      if (deliveryFeeError) {
        toast.error("Please wait while we calculate your delivery cost")
        return
      }
      
      if (isCalculatingDeliveryFee) {
        toast.error("Delivery cost calculation in progress. Please wait.")
        return
      }

      // Check if any products are missing dimensions
      const missingDimensions: string[] = []
      cart.items.forEach(item => {
        const dimensions = productDimensions[item.product.id]
        if (!dimensions || 
            dimensions.boxHeightCm === null || 
            dimensions.boxWidthCm === null || 
            dimensions.boxBreadthCm === null) {
          missingDimensions.push(item.product.name)
        }
      })
      
      if (missingDimensions.length > 0) {
        toast.error(
          `Cannot proceed: ${missingDimensions.length} product(s) missing shipping dimensions. ` +
          `We'll contact you via WhatsApp to confirm delivery cost.`
        )
        return
      }
    }

    setIsSubmitting(true)
    
    try {
      // Prepare cart items for API
      const itemsForApi = cart.items.map(item => ({
        productId: item.product.id,
        variantId: item.variant?.id || null,
        quantity: item.quantity
      }))
      
      // Prepare customer information
      const customerEmail = signedInCustomer?.email || formData.email
      const customerName = signedInCustomer?.name || formData.fullName
      const customerPhone = signedInCustomer?.phone || formData.contactNumber
      
      // Determine address ID (if using saved address)
      const addressId = selectedAddressId !== "manual" && selectedAddressId !== null 
        ? selectedAddressId 
        : null
      
      // Call the checkout API
      const response = await fetch('/api/checkout-submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Customer information
          customerId: signedInCustomer?.id || null,
          customerEmail,
          customerName,
          customerPhone,
          
          // Order items
          items: itemsForApi,
          
          // Delivery information
          deliveryType,
          addressId,
          
          // Payment and pricing
          paymentMethod,
          deliveryFee,
          discountAmount: 0, // No discounts for now
          customerNotes: null, // TODO: Add notes field if needed
          
          // Cart validation
          cartSubtotal: cart.subtotal
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        // Show specific error message from API
        throw new Error(result.error || `HTTP error! status: ${response.status}`)
      }
      
      if (!result.success) {
        throw new Error(result.error || "Failed to create order")
      }
      
      // Order created successfully
      toast.success("Order placed successfully!")
      
      // Redirect to confirmation page
      if (result.redirectTo) {
        window.location.href = result.redirectTo
      } else {
        // Fallback redirect
        window.location.href = `/checkout/confirmation/${result.order?.order_id || result.order?.order_number || 'success'}`
      }
      
    } catch (error) {
      console.error("Checkout submission error:", error)
      
      // Show user-friendly error message
      if (error instanceof Error) {
        // Check for stock-related errors
        if (error.message.includes("stock") || error.message.includes("available")) {
          toast.error(error.message)
        } else {
          toast.error(`Failed to place order: ${error.message}`)
        }
      } else {
        toast.error("An unexpected error occurred. Please try again.")
      }
      
      setIsSubmitting(false)
    }
    // Note: We don't set setIsSubmitting(false) on success because we're redirecting
  }

  // Calculate delivery fee based on city and delivery type
  useEffect(() => {
    const calculateDeliveryFee = async () => {
      if (deliveryType === "pickup") {
        // Self pickup is always free
        setDeliveryFee(0)
        setDeliveryFeeError(null)
        return
      }
      
      if (deliveryType === "delivery") {
        if (formData.city === "Karachi") {
          // Bykea charges for Karachi delivery
          setDeliveryFee(400)
          setDeliveryFeeError(null)
          return
        }
        
        // Out-of-city shipping calculation
        if (!formData.city || formData.city.trim() === "") {
          // No city selected yet
          setDeliveryFee(0)
          setDeliveryFeeError(null)
          return
        }

        // For out-of-city delivery, we need to calculate based on product dimensions
        setIsCalculatingDeliveryFee(true)
        setDeliveryFeeError(null)
        
        try {
          // First, check if we have all product dimensions
          const missingDimensions: string[] = []
          const productIdsWithMissingDims: string[] = []
          
          cart.items.forEach(item => {
            const dimensions = productDimensions[item.product.id]
            if (!dimensions || 
                dimensions.boxHeightCm === null || 
                dimensions.boxWidthCm === null || 
                dimensions.boxBreadthCm === null) {
              missingDimensions.push(item.product.name)
              productIdsWithMissingDims.push(item.product.id)
            }
          })
          
          if (missingDimensions.length > 0) {
            // We need to fetch dimensions for products that are missing them
            if (Object.keys(productDimensions).length === 0) {
              // First time calculation, fetch all dimensions
              await fetchProductDimensions(cart.items.map(item => item.product.id))
              // Re-run calculation after fetching dimensions
              await calculateDeliveryFee()
              return
            } else {
              // Some products are missing dimensions even after fetching
              setDeliveryFeeError(`We'll confirm your delivery cost by WhatsApp`)
              setDeliveryFee(0)
              // Log the problematic products for debugging
              console.error('Products missing shipping dimensions:', {
                productIds: productIdsWithMissingDims,
                productNames: missingDimensions
              })
              return
            }
          }
          
          // Calculate volumetric weight delivery fee
          let totalVolumetricFee = 0
          cart.items.forEach(item => {
            const dimensions = productDimensions[item.product.id]
            if (dimensions && 
                dimensions.boxHeightCm !== null && 
                dimensions.boxWidthCm !== null && 
                dimensions.boxBreadthCm !== null) {
              
              // Formula: ((H × W × B) / 5000) × 480 × quantity
              const volumetricWeight = (dimensions.boxHeightCm * dimensions.boxWidthCm * dimensions.boxBreadthCm) / 5000
              const itemFee = volumetricWeight * 480 * item.quantity
              totalVolumetricFee += itemFee
            }
          })
          
          setDeliveryFee(Math.round(totalVolumetricFee))
          setDeliveryFeeError(null)
        } catch (error) {
          console.error('Error calculating delivery fee:', error)
          setDeliveryFeeError(`We'll confirm your delivery cost by WhatsApp`)
          setDeliveryFee(0)
        } finally {
          setIsCalculatingDeliveryFee(false)
        }
      }
    }
    
    calculateDeliveryFee()
  }, [deliveryType, formData.city, cart.items, productDimensions])

  // Helper function to fetch product dimensions
  const fetchProductDimensions = async (productIds: string[]) => {
    if (productIds.length === 0) return
    
    try {
      const response = await fetch('/api/product-dimensions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dimensions: ${response.status}`)
      }
      
      const data = await response.json()
      setProductDimensions(data.dimensions || {})
    } catch (error) {
      console.error('Error fetching product dimensions:', error)
      throw error
    }
  }

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
            {signedInCustomer ? (
              <div className="bg-white border border-forest-200 rounded-xl p-4 flex items-center justify-between">
                <p className="text-sm text-forest-700">
                  Signed in as <span className="font-medium">{signedInCustomer.name || signedInCustomer.email}</span>
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    const supabase = createBrowserClient()
                    await supabase.auth.signOut()
                    setSignedInCustomer(null)
                    setSavedAddresses([])
                    setSelectedAddressId("manual")
                    setFormData({ fullName: "", email: "", contactNumber: "", fullAddress: "", city: "" })
                    setTouched({ fullName: false, email: false, contactNumber: false, fullAddress: false, city: false })
                  }}
                  className="text-sm text-forest-500 hover:text-forest-800 underline"
                >
                  Not you?
                </button>
              </div>
            ) : !checkingSession ? (
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
                          Email or phone
                        </label>
                        <Input
                          id="signInEmail"
                          type="text"
                          placeholder="you@example.com"
                          value={signInEmail}
                          onChange={(e) => setSignInEmail(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="signInPassword" className="text-sm font-medium text-forest-700">
                          Password
                        </label>
                        <Input
                          id="signInPassword"
                          type="password"
                          value={signInPassword}
                          onChange={(e) => setSignInPassword(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isSigningIn}
                      >
                        {isSigningIn ? "Signing in..." : "Enter your Green World 🌱"}
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            ) : null}

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
                {/* Saved address picker - only for signed-in customers with saved addresses */}
                {signedInCustomer && savedAddresses.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-forest-700">Delivery address</label>
                    <div className="space-y-2">
                      {savedAddresses.map((address) => (
                        <button
                          key={address.id}
                          type="button"
                          onClick={() => handleSelectSavedAddress(address.id)}
                          className={`w-full p-3 border-2 rounded-lg text-left transition-all ${
                            selectedAddressId === address.id
                              ? "border-clay-500 bg-clay-50"
                              : "border-forest-200 hover:border-forest-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{address.label}</span>
                            {address.is_default && (
                              <span className="text-xs bg-forest-100 text-forest-700 px-2 py-0.5 rounded">Default</span>
                            )}
                          </div>
                          <p className="text-sm text-forest-600">{address.street}</p>
                          <p className="text-xs text-forest-500">{address.city}, {address.province}</p>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleSelectSavedAddress("manual")}
                        className={`w-full p-3 border-2 rounded-lg text-left text-sm transition-all ${
                          selectedAddressId === "manual"
                            ? "border-clay-500 bg-clay-50"
                            : "border-forest-200 hover:border-forest-300"
                        }`}
                      >
                        + Enter a different address
                      </button>
                    </div>
                  </div>
                )}

                {/* City - manual entry, shown when not using a saved address */}
                {(!signedInCustomer || savedAddresses.length === 0 || selectedAddressId === "manual") && (
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
                )}

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

                {/* Full Address - only for delivery, and only when not using a saved address */}
                {deliveryType === "delivery" && (!signedInCustomer || savedAddresses.length === 0 || selectedAddressId === "manual") && (
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
                  onClick={() => setPaymentMethod("bank_transfer")}
                  className={`w-full p-4 border-2 rounded-xl text-left transition-all flex items-center gap-3 ${
                    paymentMethod === "bank_transfer" ? "border-clay-500 bg-clay-50" : "border-forest-200 hover:border-forest-300"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === "bank_transfer" ? "bg-clay-500 border-clay-500" : "border-forest-300"
                  }`}>
                    {paymentMethod === "bank_transfer" && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <div className="font-medium">Bank Transfer + WhatsApp</div>
                    <div className="text-sm text-forest-500">Transfer to account and share screenshot</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("jazzcash")}
                  className={`w-full p-4 border-2 rounded-xl text-left transition-all flex items-center gap-3 ${
                    paymentMethod === "jazzcash" ? "border-clay-500 bg-clay-50" : "border-forest-200 hover:border-forest-300"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === "jazzcash" ? "bg-clay-500 border-clay-500" : "border-forest-300"
                  }`}>
                    {paymentMethod === "jazzcash" && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <div className="font-medium">JazzCash</div>
                    <div className="text-sm text-forest-500">Pay via JazzCash mobile wallet</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("easypaisa")}
                  className={`w-full p-4 border-2 rounded-xl text-left transition-all flex items-center gap-3 ${
                    paymentMethod === "easypaisa" ? "border-clay-500 bg-clay-50" : "border-forest-200 hover:border-forest-300"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === "easypaisa" ? "bg-clay-500 border-clay-500" : "border-forest-300"
                  }`}>
                    {paymentMethod === "easypaisa" && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <div className="font-medium">Easypaisa</div>
                    <div className="text-sm text-forest-500">Pay via Easypaisa mobile wallet</div>
                  </div>
                </button>
                {/* Note for other payment methods */}
                <div className="text-xs text-forest-400 pt-2 border-t border-forest-100 mt-3">
                  For Nayapay, Zindigi, or Raast payments, please select Bank Transfer and mention your preferred method in the order notes.
                </div>
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
                isCalculatingDeliveryFee={isCalculatingDeliveryFee}
                deliveryFeeError={deliveryFeeError}
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
                {/* Out-of-city delivery fee is calculated based on product box dimensions */}
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
  isCalculatingDeliveryFee?: boolean
  deliveryFeeError?: string | null
}

function OrderSummary({ 
  items, 
  subtotal, 
  deliveryFee, 
  deliveryType, 
  total,
  isCalculatingDeliveryFee = false,
  deliveryFeeError = null
}: OrderSummaryProps) {
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
          <div className="flex justify-between text-sm items-center">
            <span className="text-forest-500">Delivery</span>
            <div className="flex flex-col items-end">
              {isCalculatingDeliveryFee ? (
                <span className="text-sm text-forest-400 animate-pulse">Calculating...</span>
              ) : deliveryFeeError ? (
                <span className="text-sm text-amber-600 font-medium">{deliveryFeeError}</span>
              ) : (
                <span className="font-mono">
                  {deliveryType === "delivery" ? formatPrice(deliveryFee) : "Free"}
                </span>
              )}
              {deliveryType === "delivery" && deliveryFee > 0 && !deliveryFeeError && (
                <span className="text-xs text-forest-400 mt-0.5">Volumetric weight calculation</span>
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
                <span className="font-medium">Note:</span> Some products are missing shipping dimensions. 
                We&apos;ll contact you via WhatsApp to confirm the exact delivery cost before shipping.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
