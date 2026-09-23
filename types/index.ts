// Muffin Plants — Core Type Definitions

export interface Category {
  id: string
  slug: string
  name: string
  description?: string
  image?: string
  parentId?: string
  sortOrder: number
  isActive: boolean
}

export interface Product {
  id: string
  name: string
  slug: string
  category: Category
  description: string
  /** One-line summary shown under the product name and used as the fallback search snippet. */
  shortDescription?: string
  /** Admin-written search listing; the page falls back to the name / short description. */
  metaTitle?: string
  metaDescription?: string
  price: number
  currency: string
  stockStatus: "in_stock" | "low_stock" | "out_of_stock"
  stockCount: number
  images: ProductImage[]
  careInfo: CareInfo
  variants: ProductVariant[]
  /** The variant whose photo represents the product on cards and lists; also the one preselected on its page. */
  cardVariantId?: string | null
  useCaseTags: string[]
  isNewArrival: boolean
  /** Pinned to the top of the homepage and the shop's "Recommended" order. */
  isFeatured?: boolean
  isPetSafe: boolean
  isImported: boolean
  /** Mangaves only: stiff, easily-broken leaves, so it ships bare-root instead of potted. See lib/shipping.ts. */
  isHardLeaf: boolean
  difficulty: "beginner" | "intermediate" | "expert"
  lightRequirement: "low" | "medium" | "bright" | "full_sun"
  waterRequirement: "low" | "medium" | "high"
  createdAt: string
  updatedAt: string
  // Shipping box dimensions for volumetric weight calculation (in centimeters)
  boxHeightCm?: number
  boxWidthCm?: number
  boxBreadthCm?: number
}

export interface ProductImage {
  id: string
  url: string
  alt: string
  sortOrder: number
  /** The variant this photo belongs to. */
  variantId?: string | null
  isPrimary?: boolean
}

export interface CareInfo {
  light: string
  water: string
  humidity: string
  temperature: string
  soil: string
  fertilizer: string
  toxicity: string
}

export interface ProductVariant {
  id: string
  name: string
  price: number
  /** Original price for this size, shown struck through when higher than `price`. */
  compareAtPrice?: number
  stockStatus: "in_stock" | "low_stock" | "out_of_stock"
  stockCount: number
  sku: string
  /** Photos tagged to this variant, in display order. Empty when the variant has none. */
  images?: ProductImage[]
}

export interface Review {
  id: string
  productId: string
  customerName: string
  rating: number
  text: string
  verifiedPurchase: boolean
  createdAt: string
  productName?: string
  imageUrl?: string | null
}

export interface CartItem {
  product: Product
  variant?: ProductVariant
  quantity: number
}

export interface Cart {
  items: CartItem[]
  subtotal: number
  deliveryFee: number
  total: number
}

export interface User {
  id: string
  email: string
  phone?: string
  name?: string
  avatarUrl?: string
  addresses: Address[]
  orders: Order[]
  myPlants: MyPlant[]
  badges: Badge[]
  createdAt: string
}

export interface Address {
  id: string
  label: string
  street: string
  city: string
  province: string
  postalCode: string
  phone: string
  isDefault: boolean
}

export interface Order {
  id: string
  orderNumber: string
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
  paymentStatus: "pending" | "paid" | "failed" | "refunded"
  paymentMethod: "card" | "bank_transfer" | "jazzcash" | "easypaisa" | "nayapay" | "zindigi" | "raast"
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  deliveryType: "delivery" | "pickup"
  address?: Address
  createdAt: string
  updatedAt: string
  receiptUrl?: string
  receiptUploadedAt?: string
}

export interface OrderItem {
  id: string
  product: Product
  variant?: ProductVariant
  quantity: number
  price: number
}

export interface MyPlant {
  id: string
  product: Product
  purchasedAt: string
  careReminders: CareReminder[]
  lastWatered?: string
  streak: number
}

export interface CareReminder {
  id: string
  type: "water" | "fertilize" | "repot" | "prune"
  frequencyDays: number
  nextDue: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt?: string
}

export type EventType = "workshop" | "tour" | "market"
export type EventStatus = "draft" | "published" | "cancelled"

export interface Event {
  id: string
  slug: string
  title: string
  description: string
  type: EventType
  status: EventStatus
  datetime: string
  endDatetime: string | null
  location: string
  price: number
  spotsTotal: number
  spotsRemaining: number
  maxSpotsPerBooking: number
  whatToExpect: string[]
  image: string | null
  /** Derived: still in the future and not cancelled. */
  isUpcoming: boolean
}

export interface JournalPost {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  author: string
  coverImage: string | null
  tags: string[]
  isFeatured: boolean
  metaTitle: string | null
  metaDescription: string | null
  /** null while the post is a draft. */
  publishedAt: string | null
}

// Ask Muffin (plant assistant) types
export interface QuizAnswer {
  questionId: string
  answer: string
}

export interface QuizResult {
  heroMatch: Product
  alternatives: Product[]
  reasoning: string
}

export interface NavItem {
  id: string
  label: string
  href: string
  icon?: string
  children?: NavItem[]
  featured?: boolean
  hasMegaMenu?: boolean
  isAi?: boolean
}

export interface MegaMenuSection {
  id: string
  title: string
  /** When set, the section heading links here (e.g. Plants -> /shop/all, Tools & Equipment -> its overview page). */
  href?: string
  items: NavItem[]
}

export interface MegaMenuItem extends NavItem {
  sections: MegaMenuSection[]
}
