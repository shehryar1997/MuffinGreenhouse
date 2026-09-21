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
// ponytail: care info, category, and tags are now flat columns directly on
// products (mirrors the old Airtable Products table 1:1) -- no more nested
// joined objects for those. Only images/variants remain separate linked tables.
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
  is_imported: boolean
  is_featured: boolean
  category_id: string
  category_name: string
  category_slug: string
  published_at: string | null
  created_at: string
  updated_at: string

  // Shipping box dimensions for volumetric weight calculation (in centimeters)
  box_height_cm: number | null
  box_width_cm: number | null
  box_breadth_cm: number | null

  // Care info -- flat, was previously a joined care_info object
  light: string | null
  water: string | null
  humidity: string | null
  temperature: string | null
  soil: string | null
  fertilizer: string | null
  toxicity: string | null
  light_summary: string | null
  water_summary: string | null
  pet_safe_note: string | null

  // Tags -- flat text[], was previously joined junction tables
  use_case_tags: string[]

  // Still separate linked tables, same as Airtable
  images?: SupabaseProductImage[]
  variants?: SupabaseProductVariant[]
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
  // false = retired: removed in the admin panel but kept because past orders reference it
  is_active?: boolean
}

export interface SearchFilters {
  query?: string
  category?: string
  useCases?: string[]
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
