"use client"

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from "react"
import { Product } from "@/types"
import { getAllProducts } from "@/lib/data/products"
import { debounceWithAbort } from "@/lib/utils"

interface SearchState {
  isOpen: boolean
  query: string
  results: Product[]
}

interface SearchContextType {
  isOpen: boolean
  query: string
  results: Product[]
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
  })
  const [products, setProducts] = useState<Product[]>([])

  // Fetch products once on mount
  useEffect(() => {
    async function loadProducts() {
      try {
        const allProducts = await getAllProducts()
        setProducts(allProducts)
      } catch {
        // Silently fail - empty results until products load
        setProducts([])
      }
    }
    loadProducts()
  }, [])

  const openSearch = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: true }))
  }, [])

  const closeSearch = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }))
  }, [])

  // Abort controllers ref for search filtering
  const abortControllerRef = useRef<AbortController | null>(null)

  // Debounced filter function with abort capability
  const debouncedFilter = useMemo(() => 
    debounceWithAbort((signal: AbortSignal, trimmedQuery: string) => {
      // Skip if signal is already aborted
      if (signal.aborted) return
      
      const results = products.filter((product) =>
        product.name.toLowerCase().includes(trimmedQuery)
      )
      
      // Only update state if not aborted
      if (!signal.aborted) {
        setState((prev) => ({ ...prev, results }))
      }
    }, 300),
  [products])

  const setQuery = useCallback((query: string) => {
    const trimmedQuery = query.trim().toLowerCase()

    if (trimmedQuery === "") {
      // Clear any pending search
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      setState((prev) => ({ ...prev, query: "", results: [] }))
      return
    }

    // Update query immediately for UI responsiveness
    setState((prev) => ({ ...prev, query }))

    // Abort previous search request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Trigger debounced filtering with abort capability
    abortControllerRef.current = debouncedFilter(trimmedQuery)
  }, [debouncedFilter])

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
    })
  }, [])

  const value = useMemo(
    () => ({
      isOpen: state.isOpen,
      query: state.query,
      results: state.results,
      openSearch,
      closeSearch,
      setQuery,
      clearSearch,
    }),
    [state.isOpen, state.query, state.results, openSearch, closeSearch, setQuery, clearSearch]
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
