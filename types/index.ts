// Muffin Nursery — Core Type Definitions

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
  price: number
  compareAtPrice?: number
  currency: string
  stockStatus: "in_stock" | "low_stock" | "out_of_stock"
  stockCount: number
  images: ProductImage[]
  careInfo: CareInfo
  variants: ProductVariant[]
  useCaseTags: string[]
  isNewArrival: boolean
  isPetSafe: boolean
  difficulty: "beginner" | "intermediate" | "expert"
  lightRequirement: "low" | "medium" | "bright" | "full_sun"
  waterRequirement: "low" | "medium" | "high"
  size: "small" | "medium" | "large"
  moodTags: string[]
  createdAt: string
  updatedAt: string
}

export interface ProductImage {
  id: string
  url: string
  alt: string
  sortOrder: number
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
  stockStatus: "in_stock" | "low_stock" | "out_of_stock"
  stockCount: number
  sku: string
}

export interface Review {
  id: string
  productId: string
  customerName: string
  rating: number
  text: string
  verifiedPurchase: boolean
  createdAt: string
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
  paymentMethod: "card" | "bank_transfer" | "jazzcash" | "easypaisa"
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  deliveryType: "delivery" | "pickup"
  address?: Address
  createdAt: string
  updatedAt: string
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

export interface Event {
  id: string
  slug: string
  title: string
  description: string
  type: "workshop" | "tour" | "market"
  datetime: string
  location: string
  price: number
  spotsTotal: number
  spotsRemaining: number
  image: string
  isUpcoming: boolean
}
export interface JournalPost {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  author: string
  coverImage: string
  tags: string[]
  publishedAt: string
}

// Muffin Intelligence types
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
}

export interface MegaMenuSection {
  id: string
  title: string
  items: NavItem[]
}

export interface MegaMenuItem extends NavItem {
  sections: MegaMenuSection[]
}
