"use client"

import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from "react"
import { getAllProducts } from "@/lib/data/products"
import { debounce } from "@/lib/utils"

// Fuzzy search result with match positions for highlighting
export interface SearchResult {
  id: string
  name: string
  slug: string
  price: number
  primary_image: string | null
  category_name: string
  matchScore: number
  nameMatches: number[] // indices of matched characters
  categoryMatches: number[] // indices of matched characters in category
}

interface SearchState {
  isOpen: boolean
  query: string
  results: SearchResult[]
  isLoading: boolean
  hasLoadedProducts: boolean
}

interface SearchContextType {
  isOpen: boolean
  query: string
  results: SearchResult[]
  isLoading: boolean
  openSearch: () => void
  closeSearch: () => void
  setQuery: (query: string) => void
  clearSearch: () => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

// Simple fuzzy matching algorithm - scores based on consecutive matches and start of word matches
function fuzzyMatch(text: string, query: string): { score: number; matches: number[] } | null {
  if (!query) return { score: 0, matches: [] }
  
  const textLower = text.toLowerCase()
  const queryLower = query.toLowerCase()
  const matches: number[] = []
  let score = 0
  let textIdx = 0
  let queryIdx = 0
  let consecutiveBonus = 0
  
  while (textIdx < textLower.length && queryIdx < queryLower.length) {
    if (textLower[textIdx] === queryLower[queryIdx]) {
      matches.push(textIdx)
      
      // Base score for matching
      score += 10
      
      // Bonus for consecutive matches
      if (matches.length > 1 && textIdx === matches[matches.length - 2] + 1) {
        consecutiveBonus += 5
        score += consecutiveBonus
      } else {
        consecutiveBonus = 0
      }
      
      // Bonus for matching at word start
      if (textIdx === 0 || textLower[textIdx - 1] === ' ') {
        score += 15
      }
      
      queryIdx++
    }
    textIdx++
  }
  
  // If we matched all query characters, return the result
  if (queryIdx === queryLower.length) {
    // Penalty for longer strings (more specific matches are better)
    score -= (textLower.length - queryLower.length) * 0.5
    return { score: Math.max(1, score), matches }
  }
  
  return null
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SearchState>({
    isOpen: false,
    query: "",
    results: [],
    isLoading: false,
    hasLoadedProducts: false,
  })
  
  // Store all products in a ref for client-side filtering
  const allProductsRef = useRef<SearchResult[]>([])
  
  // Load products on mount
  useEffect(() => {
    if (allProductsRef.current.length === 0) {
      getAllProducts().then(products => {
        allProductsRef.current = products.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          primary_image: p.images[0]?.url || null,
          category_name: p.category?.name || '',
          matchScore: 0,
          nameMatches: [],
          categoryMatches: [],
        }))
      })
    }
  }, [])

  const openSearch = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: true }))
  }, [])

  const closeSearch = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }))
  }, [])

  // Client-side fuzzy search
  const performSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setState((prev) => ({ ...prev, results: [], isLoading: false }))
      return
    }
    
    const queryLower = query.toLowerCase().trim()
    const results: SearchResult[] = []
    
    for (const product of allProductsRef.current) {
      // Try matching name
      const nameMatch = fuzzyMatch(product.name, queryLower)
      // Try matching category
      const categoryMatch = product.category_name 
        ? fuzzyMatch(product.category_name, queryLower) 
        : null
      
      if (nameMatch || categoryMatch) {
        const totalScore = (nameMatch?.score || 0) + (categoryMatch?.score || 0) * 0.5
        results.push({
          ...product,
          matchScore: totalScore,
          nameMatches: nameMatch?.matches || [],
          categoryMatches: categoryMatch?.matches || [],
        })
      }
    }
    
    // Sort by score descending (best matches first), then by name
    results.sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore
      return a.name.localeCompare(b.name)
    })
    
    // Limit to top 8 results
    setState((prev) => ({ ...prev, results: results.slice(0, 8), isLoading: false }))
  }, [])

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce(performSearch, 80),
    [performSearch]
  )

  const setQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, query, isLoading: query.length > 0 }))
    debouncedSearch(query)
  }, [debouncedSearch])

  const clearSearch = useCallback(() => {
    setState({
      isOpen: false,
      query: "",
      results: [],
      isLoading: false,
      hasLoadedProducts: true,
    })
  }, [])

  const value = useMemo(
    () => ({
      isOpen: state.isOpen,
      query: state.query,
      results: state.results,
      isLoading: state.isLoading,
      openSearch,
      closeSearch,
      setQuery,
      clearSearch,
    }),
    [state.isOpen, state.query, state.results, state.isLoading, openSearch, closeSearch, setQuery, clearSearch]
  )

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider")
  }
  return context
}
