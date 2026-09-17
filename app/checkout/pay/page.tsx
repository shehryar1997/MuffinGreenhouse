"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"
import { Upload, CheckCircle, AlertCircle, Loader2, MessageCircle } from "lucide-react"
import { siteConfig } from "@/config/nav.config"

interface PaymentDetails {
  orderId: string
  orderNumber: string
  total: number
  paymentMethod: string
}

export default function CheckoutPayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-forest-50">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-sprout-500" />
            <p className="mt-4 text-forest-700">Loading payment details...</p>
          </div>
        </div>
      }
    >
      <CheckoutPayContent />
    </Suspense>
  )
}

function CheckoutPayContent() {
  const searchParams = useSearchParams()
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verifyComplete, setVerifyComplete] = useState(false)

  // Get order details from URL parameters
  useEffect(() => {
    const orderId = searchParams.get("orderId")
    const orderNumber = searchParams.get("orderNumber")
    const total = searchParams.get("total")
    const paymentMethod = searchParams.get("paymentMethod")

    if (orderId && orderNumber && total && paymentMethod) {
      setPaymentDetails({
        orderId,
        orderNumber,
        total: parseFloat(total),
        paymentMethod
      })
    } else {
      toast.error("Missing order information")
      setTimeout(() => {
        window.location.href = "/checkout"
      }, 2000)
    }
    setLoading(false)
  }, [searchParams])

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB")
      return
    }

    setSelectedFile(file)
  }

  // Upload file and update order
  const handleUploadAndVerify = async () => {
    if (!selectedFile || !paymentDetails) {
      toast.error("Please select a file first")
      return
    }

    setUploading(true)

    try {
      // First, get signed upload URL
      const uploadResponse = await fetch("/api/generate-upload-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderNumber: paymentDetails.orderNumber }),
      })

      if (!uploadResponse.ok) {
        throw new Error("Failed to generate upload URL")
      }

      const uploadData = await uploadResponse.json()

      // Upload file to signed URL
      const xhr = new XMLHttpRequest()
      xhr.open("POST", uploadData.signedUrl)
      xhr.setRequestHeader("Authorization", `Bearer ${uploadData.token}`)
      xhr.setRequestHeader("Content-Type", selectedFile.type)

      const uploadPromise = new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        }
        xhr.onerror = () => reject(new Error("Upload failed"))
        xhr.send(selectedFile)
      })

      await uploadPromise
      setUploading(false)
      
      // Now update the order with receipt URL
      setVerifying(true)
      
      const updateResponse = await fetch("/api/update-order-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: paymentDetails.orderId,
          receiptUrl: uploadData.path,
        }),
      })

      if (!updateResponse.ok) {
        throw new Error("Failed to update order")
      }

      setVerifying(false)
      setVerifyComplete(true)
      toast.success("Payment under review!")

    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to upload receipt")
      setUploading(false)
      setVerifying(false)
    }
  }

  // Get payment method details
  const getPaymentDetails = () => {
    if (!paymentDetails) return { title: "", details: [] }

    const { paymentMethod, total } = paymentDetails

    switch (paymentMethod) {
      case "bank_transfer":
        return {
          title: "Bank Transfer - Habib Bank Ltd (HBL)",
          details: [
            "Account No. 09107902577803",
            "IBAN: PK66HABB00009107902577803",
            "Account Title: Shehryar Ahmad"
          ]
        }
      case "jazzcash":
        return {
          title: "JazzCash",
          details: [
            "03202065474",
            "Account Title: Shehryar Ahmad"
          ]
        }
      case "easypaisa":
        return {
          title: "Easypaisa",
          details: [
            "03202065474",
            "Account Title: Shehryar Ahmad"
          ]
        }
      case "nayapay":
      case "zindigi":
      case "raast":
        return {
          title: `Payment via ${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}`,
          details: [
            `Pay ${formatPrice(total)} using ${paymentMethod}`,
            "Payment instructions will follow via WhatsApp"
          ]
        }
      default:
        return {
          title: "Payment",
          details: [`Please pay ${formatPrice(total)}`]
        }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-forest-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-sprout-500" />
          <p className="mt-4 text-forest-700">Loading payment details...</p>
        </div>
      </div>
    )
  }

  if (!paymentDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-forest-50">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto text-destructive mb-3" />
          <p className="text-forest-700">No payment details found</p>
          <p className="text-sm text-forest-500 mt-2">Redirecting to checkout...</p>
        </div>
      </div>
    )
  }

  const paymentInfo = getPaymentDetails()

  return (
    <div className="min-h-screen bg-forest-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl md:text-4xl text-forest-900 mb-3">
            Complete Your Payment
          </h1>
          <p className="text-forest-600">
            Order #{paymentDetails.orderNumber}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-forest-200 overflow-hidden">
          {/* Payment Amount */}
          <div className="p-8 border-b border-forest-100">
            <div className="text-center">
              <p className="text-sm text-forest-500 mb-2">Total Amount</p>
              <p className="font-mono text-4xl font-bold text-forest-900">
                {formatPrice(paymentDetails.total)}
              </p>
              <p className="text-sm text-forest-400 mt-1">PKR</p>
            </div>
          </div>

          {/* Payment Instructions */}
          <div className="p-8 border-b border-forest-100">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-clay-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-lg text-forest-900 mb-2">
                  {paymentInfo.title}
                </h3>
                <ul className="space-y-2">
                  {paymentInfo.details.map((detail, index) => (
                    <li key={index} className="text-forest-700">
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-sprout-50 border border-sprout-200 rounded-lg">
              <p className="text-sm text-forest-700">
                <strong>Important:</strong> Please make the payment using the account details above.
                We&apos;ll confirm your payment within a few hours after you upload the receipt.
              </p>
            </div>
          </div>

          {/* Receipt Upload */}
          <div className="p-8">
            <h3 className="font-medium text-lg text-forest-900 mb-4">
              Upload Payment Receipt
            </h3>
            
            <div className="space-y-4">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploading || verifying || verifyComplete}
                className="cursor-pointer"
              />
              
              {selectedFile && (
                <p className="text-sm text-forest-600">
                  Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                </p>
              )}

              <Button
                onClick={handleUploadAndVerify}
                disabled={!selectedFile || uploading || verifying || verifyComplete}
                className="w-full bg-clay-500 hover:bg-clay-600"
                size="lg"
              >
                {uploading || verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {uploading ? "Uploading..." : "Verifying..."}
                  </>
                ) : verifyComplete ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verified
                  </>
                ) : (
                  "Upload & Verify"
                )}
              </Button>

              <p className="text-xs text-forest-400">
                Accepts image files (JPEG, PNG, WebP, GIF) - Max 5MB
              </p>

              {/* WhatsApp Payment Option */}
              <div className="pt-4 border-t border-forest-100">
                <p className="text-sm text-forest-500 mb-3">Prefer to pay via WhatsApp?</p>
                <a
                  href={(() => {
                    if (!paymentDetails) return "#"
                    const message = encodeURIComponent(
                      `Hi! I would like to pay for my order:\n\n` +
                      `Order Number: ${paymentDetails.orderNumber}\n` +
                      `Order ID: ${paymentDetails.orderId}\n` +
                      `Total Amount: ${formatPrice(paymentDetails.total)}\n` +
                      `Payment Method: ${paymentDetails.paymentMethod}\n\n` +
                      `Please confirm my payment.`
                    )
                    return `https://wa.me/${siteConfig.whatsappNumber.replace(/\D/g, "")}?text=${message}`
                  })()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-medium rounded-lg transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Pay via WhatsApp instead
                </a>
              </div>
            </div>

            {/* Completion Message */}
            {verifyComplete && (
              <div className="mt-8 p-6 bg-sprout-50 border border-sprout-200 rounded-xl">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-sprout-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-medium text-lg text-forest-900 mb-2">
                      Payment Under Review
                    </h4>
                    <p className="text-forest-700 mb-3">
                      Thank you! Your payment receipt has been submitted for verification.
                      We&apos;ll review it and confirm your order within a few hours.
                    </p>
                    <div className="bg-white p-4 rounded-lg border border-sprout-100">
                      <p className="text-sm font-medium text-forest-900 mb-1">
                        Order #{paymentDetails.orderNumber}
                      </p>
                      <p className="text-sm text-forest-600">
                        You&apos;ll receive a confirmation email/SMS once verified.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-forest-500">
            Need help? Contact us on WhatsApp or call 03202065474
          </p>
        </div>
      </div>
    </div>
  )
}