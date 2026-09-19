'use client'

import { Suspense, useMemo, useState, useSyncExternalStore } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { trackPurchase } from '@/lib/analytics'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'
import { CheckCircle, Loader2, MessageCircle, Clock, AlertCircle, Copy, Check } from 'lucide-react'
import { siteConfig } from '@/config/nav.config'
import { PAYMENT_ACCOUNTS } from '@/config/payment-accounts'
import { PAYMENT_SUMMARY_KEY_PREFIX, type PaymentSummary } from '@/lib/checkout-summary'

export default function CheckoutPayPage() {
  return (
    <Suspense fallback={<div className='min-h-screen flex items-center justify-center bg-forest-50'><div className='text-center'><Loader2 className='w-8 h-8 animate-spin mx-auto text-sprout-500' /><p className='mt-4 text-forest-700'>Loading...</p></div></div>}>
      <CheckoutPayContent />
    </Suspense>
  )
}

const noopSubscribe = () => () => {}

function CheckoutPayContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderNumber = searchParams.get('orderNumber')

  // The order summary is handed over by /checkout through sessionStorage (never
  // the URL, which would leak name/email into history, logs and analytics).
  // 'loading' covers the server render / hydration pass, where storage isn't readable.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false)
  const storedSummary = useSyncExternalStore(
    noopSubscribe,
    () => {
      try {
        return orderNumber ? sessionStorage.getItem(PAYMENT_SUMMARY_KEY_PREFIX + orderNumber) : null
      } catch {
        return null
      }
    },
    () => null
  )
  const paymentDetails = useMemo<PaymentSummary | null>(() => {
    if (!storedSummary) return null
    try {
      const parsed = JSON.parse(storedSummary) as PaymentSummary
      return parsed.orderNumber === orderNumber ? parsed : null
    } catch {
      return null
    }
  }, [storedSummary, orderNumber])
  const loading = !hydrated
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleCopy = async (value: string, fieldId: string) => {
    try { await navigator.clipboard.writeText(value); setCopiedField(fieldId); setTimeout(() => setCopiedField(null), 2000); toast.success('Copied') } catch { toast.error('Failed to copy') }
  }

  const handleConfirmBooking = async () => {
    if (!paymentDetails) return
    setConfirming(true)
    try {
      const res = await fetch('/api/checkout-confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: paymentDetails.orderId, orderNumber: paymentDetails.orderNumber }) })
      if (!res.ok) { const err = await res.json().catch(() => ({ error: 'Unknown' })); throw new Error(err.error || 'Failed') }
      
      // Fire GA4 purchase event after successful booking
      trackPurchase({
        transaction_id: paymentDetails.orderNumber,
        value: paymentDetails.total,
        currency: 'PKR',
        items: paymentDetails.items.map((item) => ({
          item_name: item.productName,
          quantity: item.quantity,
          price: item.price,
        })),
      })
      
      setConfirmed(true); toast.success('Booking confirmed!')
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') } finally { setConfirming(false) }
  }

  const getWhatsAppUrl = () => {
    if (!paymentDetails) return '#'
    const msg = encodeURIComponent('Hi! I would like to pay for my order:\n\nOrder Number: ' + paymentDetails.orderNumber + '\nTotal Amount: ' + formatPrice(paymentDetails.total) + '\n\nPlease confirm my payment.')
    return 'https://wa.me/' + siteConfig.whatsappNumber.replace(/\D/g, '') + '?text=' + msg
  }

  if (loading) return <div className='min-h-screen flex items-center justify-center bg-forest-50'><Loader2 className='w-8 h-8 animate-spin' /></div>
  if (!paymentDetails) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-forest-50 px-4'>
        <div className='max-w-md text-center'>
          <AlertCircle className='w-12 h-12 text-amber-500 mx-auto mb-4' />
          <h1 className='text-xl font-serif text-forest-900 mb-2'>We couldn&apos;t load your order details</h1>
          <p className='text-forest-600 mb-6'>
            {orderNumber ? <>Order #{orderNumber} was placed, but its payment details are only available in the browser tab where you checked out. </> : null}
            Please check your confirmation email, or message us on WhatsApp at {siteConfig.whatsappNumber} and we&apos;ll help right away.
          </p>
          <Button variant='outline' onClick={() => router.push('/')}>Back to home</Button>
        </div>
      </div>
    )
  }

  if (confirmed) {
    return (
      <div className='min-h-screen bg-forest-50 py-12'>
        <div className='max-w-2xl mx-auto px-4'>
          <div className='bg-white rounded-2xl border border-forest-200 p-8 text-center'>
            <CheckCircle className='w-10 h-10 text-forest-600 mx-auto mb-4' />
            <h1 className='text-2xl font-serif text-forest-900 mb-2'>Booking Confirmed!</h1>
            <p className='text-forest-600 mb-6'>Your order is held for 24 hours.</p>
            <div className='bg-sprout-50 border border-sprout-200 rounded-xl p-6 mb-6'>
              <p className='text-sm font-medium text-forest-900'>Order #{paymentDetails.orderNumber}</p>
              <p className='text-sm text-forest-600'>Total: {formatPrice(paymentDetails.total)}</p>
            </div>
            <a href={getWhatsAppUrl()} target='_blank' rel='noopener noreferrer' className='inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-medium rounded-lg transition-colors'>
              <MessageCircle className='w-5 h-5' /> Share Receipt on WhatsApp
            </a>
            <Button variant='outline' onClick={() => router.push('/')} className='w-full mt-3'>Continue Shopping</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-forest-50 py-12'>
      <div className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-serif text-forest-900 mb-2'>Complete Your Payment</h1>
          <p className='text-forest-600'>Order #{paymentDetails.orderNumber}</p>
        </div>
        <div className='bg-white rounded-xl border border-forest-200 p-6 mb-6'>
          <div className='flex items-center justify-between'>
            <span className='text-forest-600'>Total Amount to Pay</span>
            <span className='text-3xl font-mono font-medium text-forest-900'>{formatPrice(paymentDetails.total)}</span>
          </div>
        </div>
        <div className='bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6'>
          <div className='flex items-start gap-3'>
            <Clock className='w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5' />
            <div>
              <h3 className='font-medium text-amber-900 mb-1'>24-Hour Payment Window</h3>
              <p className='text-sm text-amber-800'>Pay the total amount to any of the accounts below and share your payment receipt on WhatsApp within 24 hours. Your order is held for 24 hours. If payment is not confirmed within that window, it will be automatically cancelled.</p>
            </div>
          </div>
        </div>
        <div className='bg-white rounded-xl border border-forest-200 overflow-hidden mb-6'>
          <div className='px-6 py-4 border-b border-forest-200 bg-forest-50'>
            <h2 className='font-medium text-forest-900'>Payment Options</h2>
            <p className='text-sm text-forest-500'>Pay to any of the following accounts</p>
          </div>
          <div className='divide-y divide-forest-100'>
            {Object.entries(PAYMENT_ACCOUNTS).map(([key, account]) => (
              <div key={key} className='p-6'>
                <div className='flex items-center gap-3 mb-4'>
                  <span className='text-2xl'>{account.icon}</span>
                  <h3 className='font-medium text-forest-900'>{account.title}</h3>
                </div>
                <div className='space-y-2'>
                  {account.details.map((detail) => (
                    <div key={detail.label} className='flex items-center justify-between py-2 px-3 bg-forest-50 rounded-lg'>
                      <span className='text-sm text-forest-500'>{detail.label}</span>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm font-mono text-forest-900'>{detail.value}</span>
                        <button onClick={() => handleCopy(detail.value, key + '-' + detail.label)} className='p-1 hover:bg-forest-200 rounded' title='Copy' type='button' aria-label={'Copy ' + detail.label}>
                          {copiedField === key + '-' + detail.label ? <Check className='w-4 h-4 text-forest-600' /> : <Copy className='w-4 h-4 text-forest-500' />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className='bg-white rounded-xl border border-forest-200 p-6 mb-6'>
          <h3 className='font-medium text-forest-900 mb-2'>Prefer to pay via WhatsApp?</h3>
          <p className='text-sm text-forest-600 mb-4'>You can also complete your payment directly through WhatsApp.</p>
          <a href={getWhatsAppUrl()} target='_blank' rel='noopener noreferrer' className='inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-medium rounded-lg transition-colors'>
            <MessageCircle className='w-5 h-5' /> Pay via WhatsApp instead
          </a>
        </div>
        <div className='bg-white rounded-xl border border-forest-200 p-6 mb-6'>
          <p className='text-sm text-forest-600 mb-4'>By clicking Confirm Booking, you agree to complete payment within 24 hours.</p>
          <Button onClick={handleConfirmBooking} disabled={confirming} className='w-full h-12 text-base bg-forest-700 hover:bg-forest-800'>
            {confirming ? <><Loader2 className='w-5 h-5 mr-2 animate-spin' />Confirming...</> : <>Confirm Booking - {formatPrice(paymentDetails.total)}</>}
          </Button>
        </div>
        <div className='bg-white rounded-xl border border-forest-200 p-6'>
          <h3 className='font-medium text-forest-900 mb-4'>Order Summary</h3>
          {paymentDetails.items.length > 0 && (
            <div className='space-y-2 mb-4'>
              {paymentDetails.items.map((item, index) => (
                <div key={index} className='flex justify-between text-sm'>
                  <span className='text-forest-600'>{item.productName} x {item.quantity}</span>
                  <span className='font-mono'>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          )}
          <div className='border-t border-forest-100 pt-4 space-y-2'>
            <div className='flex justify-between text-sm'><span className='text-forest-500'>Subtotal</span><span className='font-mono'>{formatPrice(paymentDetails.subtotal)}</span></div>
            <div className='flex justify-between text-sm'><span className='text-forest-500'>Delivery</span><span className='font-mono'>{paymentDetails.deliveryType === 'pickup' ? 'Free' : formatPrice(paymentDetails.deliveryFee)}</span></div>
            <div className='flex justify-between text-base font-medium pt-2 border-t border-forest-100'><span className='text-forest-900'>Total</span><span className='font-mono'>{formatPrice(paymentDetails.total)}</span></div>
          </div>
        </div>
        <div className='mt-8 text-center'>
          <p className='text-sm text-forest-500'>Need help? Contact us on WhatsApp at {siteConfig.whatsappNumber}</p>
        </div>
      </div>
    </div>
  )
}
