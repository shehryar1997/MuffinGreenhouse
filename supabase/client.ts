// ============================================================================
// MUFFIN NURSERY - SUPABASE CLIENT
// ============================================================================
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================================================
// TYPES (match your existing @/types)
// ============================================================================
export interface SupabaseProduct {
  id: string
  sku: string
  name: string
  slug: string
  description: string
  short_description: string | null
  price: number
  compare_at_price: number | null
  currency: string
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock'
  stock_count: number
  difficulty: 'beginner' | 'intermediate' | 'expert'
  light_requirement: 'low' | 'medium' | 'bright' | 'full_sun'
  water_requirement: 'low' | 'medium' | 'high'
  size: 'small' | 'medium' | 'large'
  is_new_arrival: boolean
  is_pet_safe: boolean
  is_featured: boolean
  category_id: string
  published_at: string | null
  created_at: string
  category?: { id: string; name: string; slug: string }
  images?: SupabaseProductImage[]
  variants?: SupabaseProductVariant[]
  care_info?: SupabaseCareInfo
  use_cases?: string[]
  moods?: string[]
}

export interface SupabaseProductImage {
  id: string
  url: string
  alt_text: string
  sort_order: number
  is_primary: boolean
}

export interface SupabaseProductVariant {
  id: string
  sku: string
  name: string
  price: number
  stock_status: string
  stock_count: number
  is_default: boolean
}

export interface SupabaseCareInfo {
  light: string
  water: string
  humidity: string
  temperature: string
  soil: string
  fertilizer: string
  toxicity: string
}

export interface SearchFilters {
  query?: string
  category?: string
  useCases?: string[]
  moods?: string[]
  lightLevels?: ('low' | 'medium' | 'bright' | 'full_sun')[]
  difficulties?: ('beginner' | 'intermediate' | 'expert')[]
  minPrice?: number
  maxPrice?: number
  isPetSafe?: boolean
  isNewArrival?: boolean
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'name' | 'newest'
  page?: number
  pageSize?: number
}

export interface PaginatedResult<T> {
  data: T[]
  count: number
  hasMore: boolean
}
