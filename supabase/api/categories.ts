// ============================================================================
// CATEGORIES API - All category and tag operations
// ============================================================================
import { supabase } from '../client'

export interface Category {
  id: string
  slug: string
  name: string
  description: string | null
  image_url: string | null
  parent_id: string | null
  sort_order: number
  is_active: boolean
}

export interface UseCaseTag {
  id: string
  slug: string
  name: string
  description: string | null
  icon: string | null
}

export interface MoodTag {
  id: string
  slug: string
  name: string
  description: string | null
}

// ============================================================================
// GET ALL CATEGORIES
// ============================================================================
export async function getAllCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  if (error) throw error
  return data || []
}

// ============================================================================
// GET CATEGORY BY SLUG
// ============================================================================
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) return null
  return data
}

// ============================================================================
// GET USE CASE TAGS (Shop by Need)
// ============================================================================
// Maps to: Low-Light Survivors, Pet-Safe, Beginner-Proof, etc.
export async function getUseCaseTags(): Promise<UseCaseTag[]> {
  const { data, error } = await supabase
    .from('use_case_tags')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  if (error) throw error
  return data || []
}

export async function getUseCaseBySlug(slug: string): Promise<UseCaseTag | null> {
  const { data, error } = await supabase
    .from('use_case_tags')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) return null
  return data
}

// ============================================================================
// GET MOOD TAGS (Shop by Atmosphere)
// ============================================================================
// Maps to: Soft, Bright, Moody
export async function getMoodTags(): Promise<MoodTag[]> {
  const { data, error } = await supabase
    .from('mood_tags')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  if (error) throw error
  return data || []
}

export async function getMoodBySlug(slug: string): Promise<MoodTag | null> {
  const { data, error } = await supabase
    .from('mood_tags')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) return null
  return data
}
