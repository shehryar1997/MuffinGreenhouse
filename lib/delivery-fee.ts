// Single source of truth for the delivery fee. Used by the checkout page (to
// show the customer a price) and by /api/checkout-submit (to charge one) -- the
// server never trusts a fee sent by the browser.

export const KARACHI_DELIVERY_FEE = 400

export interface DeliveryFeeDimensions {
  categorySlug: string | null
  boxHeightCm: number | null
  boxWidthCm: number | null
  boxBreadthCm: number | null
  weightKg: number | null
}

export interface DeliveryFeeItem {
  dim?: DeliveryFeeDimensions | null
  quantity: number
}

export function shippingFeeForWeight(totalWeightKg: number): number {
  if (totalWeightKg <= 0.5) return 600
  if (totalWeightKg <= 1) return 800
  if (totalWeightKg <= 3) return 1000
  if (totalWeightKg <= 5) return 1400
  if (totalWeightKg <= 10) return 1800
  return 2200
}

/** Courier-chargeable weight for a whole cart. */
export function chargeableWeightKg(items: DeliveryFeeItem[]): number {
  // Sum one chargeable weight per item and total the whole cart, so an item
  // with usable data and an item without both count toward the shipment.
  let totalWeight = 0
  for (const { dim, quantity } of items) {
    const categorySlug = dim?.categorySlug?.toLowerCase() || ""

    if (categorySlug.includes("equipment")) {
      // Equipment is charged by actual weight; assume 1kg/unit if unrecorded.
      totalWeight += (dim?.weightKg || 1) * quantity
      continue
    }

    if (dim?.boxHeightCm && dim.boxWidthCm && dim.boxBreadthCm) {
      const volumetricWeight = (dim.boxHeightCm * dim.boxWidthCm * dim.boxBreadthCm) / 5000
      const actualWeight = dim.weightKg || 0
      // Courier convention: charge whichever is greater, volumetric or actual.
      totalWeight += Math.max(volumetricWeight, actualWeight) * quantity
    } else {
      // Missing/incomplete box dimensions: use recorded actual weight, else
      // assume a 1kg parcel per unit rather than dropping the item from the fee.
      totalWeight += (dim?.weightKg || 1) * quantity
    }
  }
  return totalWeight
}

export function calculateDeliveryFee(params: {
  deliveryType: "delivery" | "pickup"
  city: string | null | undefined
  items: DeliveryFeeItem[]
}): number {
  if (params.deliveryType === "pickup") return 0
  if (params.city === "Karachi") return KARACHI_DELIVERY_FEE
  return shippingFeeForWeight(chargeableWeightKg(params.items))
}
