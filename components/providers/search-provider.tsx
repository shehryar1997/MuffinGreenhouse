"use client"

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react"
import { Product } from "@/types"
import { getAllProducts } from "@/lib/data/products"

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

  const setQuery = useCallback((query: string) => {
    const trimmedQuery = query.trim().toLowerCase()

    if (trimmedQuery === "") {
      setState((prev) => ({ ...prev, query: "", results: [] }))
      return
    }

    // Search products by name (case-insensitive) from cached products
    const results = products.filter((product) =>
      product.name.toLowerCase().includes(trimmedQuery)
    )

    setState((prev) => ({ ...prev, query, results }))
  }, [products])

  const clearSearch = useCallback(() => {
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
