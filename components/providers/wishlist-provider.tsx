"use client"

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import { createBrowserClient } from "@/lib/supabase/browser-client"

interface WishlistContextType {
  isSignedIn: boolean
  isWishlisted: (productId: string) => boolean
  toggleWishlist: (productId: string) => Promise<{ ok: boolean; signedIn: boolean }>
  isLoading: boolean
  count: number
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [productIds, setProductIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const userIdRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const supabase = createBrowserClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        if (!cancelled) setIsLoading(false)
        return
      }
      userIdRef.current = session.user.id

      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_id", session.user.id)
        .single()

      if (!customer || cancelled) {
        if (!cancelled) setIsLoading(false)
        return
      }

      setCustomerId(customer.id)

      const { data: items } = await supabase
        .from("wishlist_items")
        .select("product_id")
        .eq("customer_id", customer.id)

      if (!cancelled) {
        setProductIds(new Set((items ?? []).map((i) => i.product_id as string)))
        setIsLoading(false)
      }
    }

    load()

    // The session was only read once at mount, so after a soft-navigation sign-in the hearts kept behaving as
    // signed-out, and after sign-out they kept behaving as signed-in. Follow auth changes instead.
    const {
      data: { subscription },
    } = createBrowserClient().auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        userIdRef.current = null
        setCustomerId(null)
        setProductIds(new Set())
      } else if (event === "SIGNED_IN" && session && session.user.id !== userIdRef.current) {
        void load()
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const isWishlisted = useCallback((productId: string) => productIds.has(productId), [productIds])

  const toggleWishlist = useCallback(
    async (productId: string): Promise<{ ok: boolean; signedIn: boolean }> => {
      if (!customerId) {
        return { ok: false, signedIn: false }
      }

      const supabase = createBrowserClient()
      const alreadyWishlisted = productIds.has(productId)

      if (alreadyWishlisted) {
        const { error } = await supabase
          .from("wishlist_items")
          .delete()
          .eq("customer_id", customerId)
          .eq("product_id", productId)
        if (error) return { ok: false, signedIn: true }
        setProductIds((prev) => {
          const next = new Set(prev)
          next.delete(productId)
          return next
        })
        return { ok: true, signedIn: true }
      } else {
        const { error } = await supabase
          .from("wishlist_items")
          .insert({ customer_id: customerId, product_id: productId })
        if (error) return { ok: false, signedIn: true }
        setProductIds((prev) => new Set(prev).add(productId))
        return { ok: true, signedIn: true }
      }
    },
    [customerId, productIds]
  )

  return (
    <WishlistContext.Provider
      value={{ isSignedIn: !!customerId, isWishlisted, toggleWishlist, isLoading, count: productIds.size }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider")
  }
  return context
}
