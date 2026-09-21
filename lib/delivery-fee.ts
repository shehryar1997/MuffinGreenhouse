// Single source of truth for the delivery fee. Used by the checkout page (to
// show the customer a price) and by /api/checkout-submit (to charge one) -- the
// server never trusts a fee sent by the browser.
//
// Two independent parts, added together for a mixed cart:
//  * Plants: flat Karachi rate (higher for larger orders), otherwise a courier weight tier.
//  * Tools & Equipment (Fertilizer, Other Equipment, Pots, Planting Media): a flat
//    rate per kg of the actual product weight x quantity, in every city.

import { isNonPlantCategorySlug } from "./product-categories"

export const KARACHI_DELIVERY_FEE = 400

/** Karachi plant orders with MORE than this many cart lines pay the higher flat rate. */
export const KARACHI_LARGE_ORDER_ITEM_THRESHOLD = 4
export const KARACHI_LARGE_ORDER_DELIVERY_FEE = 1000

/** PKR per kg for Tools & Equipment: e.g. 5 x 1kg gravel = 1 x 5 x 120 = 600. */
export const EQUIPMENT_FEE_PER_KG = 120

/** Weight assumed for an equipment item whose weight was never recorded (legacy rows). */
const EQUIPMENT_FALLBACK_WEIGHT_KG = 1

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

export function isEquipmentItem(item: DeliveryFeeItem): boolean {
  return isNonPlantCategorySlug(item.dim?.categorySlug)
}

/** Delivery fee for the Tools & Equipment lines of a cart: 120 PKR x kg x quantity. */
export function equipmentDeliveryFee(items: DeliveryFeeItem[]): number {
  const totalKg = items.reduce((sum, { dim, quantity }) => {
    const unitKg = dim?.weightKg && dim.weightKg > 0 ? dim.weightKg : EQUIPMENT_FALLBACK_WEIGHT_KG
    return sum + unitKg * quantity
  }, 0)
  return Math.round(totalKg * EQUIPMENT_FEE_PER_KG)
}

/** Flat Karachi fee for a plant order, by number of cart lines (distinct products). */
export function karachiDeliveryFee(plantLineCount: number): number {
  return plantLineCount > KARACHI_LARGE_ORDER_ITEM_THRESHOLD ? KARACHI_LARGE_ORDER_DELIVERY_FEE : KARACHI_DELIVERY_FEE
}

/** Delivery fee for the plant lines of a cart. */
export function plantDeliveryFee(city: string | null | undefined, plantItems: DeliveryFeeItem[]): number {
  if (plantItems.length === 0) return 0
  if (city === "Karachi") return karachiDeliveryFee(plantItems.length)
  return shippingFeeForWeight(chargeableWeightKg(plantItems))
}

export function calculateDeliveryFee(params: {
  deliveryType: "delivery" | "pickup"
  city: string | null | undefined
  items: DeliveryFeeItem[]
}): number {
  if (params.deliveryType === "pickup") return 0
  const equipmentItems = params.items.filter(isEquipmentItem)
  const plantItems = params.items.filter((item) => !isEquipmentItem(item))
  return plantDeliveryFee(params.city, plantItems) + equipmentDeliveryFee(equipmentItems)
}

// ---------------------------------------------------------------------------
// Free delivery: orders of FREE_DELIVERY_THRESHOLD or more, but only small ones
// (fewer than 4 units), because big orders cost far more to ship.
// ---------------------------------------------------------------------------
export const FREE_DELIVERY_THRESHOLD = 10_000
export const FREE_DELIVERY_MAX_ITEMS = 3

/** `itemCount` is the total number of units in the cart (quantities added up). */
export function qualifiesForFreeDelivery(subtotal: number, itemCount: number): boolean {
  return subtotal >= FREE_DELIVERY_THRESHOLD && itemCount > 0 && itemCount <= FREE_DELIVERY_MAX_ITEMS
}
