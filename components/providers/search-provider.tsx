"use client"

import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from "react"
import { searchProductsSuggestions } from "@/lib/data/products"
import { debounceWithAbort } from "@/lib/utils"
import { sanitizeSearchTerm } from "@/lib/search-term"

interface SearchState {
  isOpen: boolean
  query: string
  results: Array<{
    id: string
    name: string
    slug: string
    price: number
    primary_image: string | null
    category_name: string
  }>
  /** Full match count from the search RPC, not just the (max 6) suggestions above. */
  totalCount: number
}

interface SearchContextType {
  isOpen: boolean
  query: string
  results: SearchState['results']
  totalCount: number
  openSearch: () => void
  closeSearch: () => void
  setQuery: (query: string) => void
  clearSearch: () => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SearchState>({
    isOpen: false,
    query: "",
    results: [],
    totalCount: 0,
  })

  const openSearch = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: true }))
  }, [])

  const closeSearch = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }))
  }, [])

  // Abort controllers ref for search filtering
  const abortControllerRef = useRef<AbortController | null>(null)

  // Debounced search function with abort capability
  const debouncedSearch = useMemo(() => 
    debounceWithAbort(async (signal: AbortSignal, query: string) => {
      // Skip if signal is already aborted
      if (signal.aborted) return
      
      const sanitizedQuery = sanitizeSearchTerm(query)
      if (sanitizedQuery.length < 2) {
        if (!signal.aborted) {
          setState((prev) => ({ ...prev, results: [], totalCount: 0 }))
        }
        return
      }

      try {
        const { results: suggestions, totalCount } = await searchProductsSuggestions(sanitizedQuery)
        // Only update state if not aborted
        if (!signal.aborted) {
          setState((prev) => ({
            ...prev,
            results: suggestions.map(s => ({
              id: s.id,
              name: s.name,
              slug: s.slug,
              price: s.price,
              primary_image: s.primary_image,
              category_name: '' // Will be populated if needed
            })),
            totalCount,
          }))
        }
      } catch {
        // Silently fail - empty results on error
        if (!signal.aborted) {
          setState((prev) => ({ ...prev, results: [], totalCount: 0 }))
        }
      }
    }, 250), // 250ms debounce as specified
  [])

  const setQuery = useCallback((query: string) => {
    if (query.trim() === "") {
      // Clear any pending search
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      setState((prev) => ({ ...prev, query: "", results: [], totalCount: 0 }))
      return
    }

    // Update query immediately for UI responsiveness
    setState((prev) => ({ ...prev, query }))

    // Abort previous search request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Trigger debounced search with abort capability
    abortControllerRef.current = debouncedSearch(query)
  }, [debouncedSearch])

  const clearSearch = useCallback(() => {
    // Abort any pending search request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    
    setState({
      isOpen: false,
      query: "",
      results: [],
      totalCount: 0,
    })
  }, [])

  const value = useMemo(
    () => ({
      isOpen: state.isOpen,
      query: state.query,
      results: state.results,
      totalCount: state.totalCount,
      openSearch,
      closeSearch,
      setQuery,
      clearSearch,
    }),
    [state.isOpen, state.query, state.results, state.totalCount, openSearch, closeSearch, setQuery, clearSearch]
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
