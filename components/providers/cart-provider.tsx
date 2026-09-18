"use client"

import React, { createContext, useContext, useReducer, useCallback, useEffect, useState } from "react"
import { Cart, CartItem, Product, ProductVariant } from "@/types"

const CART_STORAGE_KEY = "muffin_cart_v1"

interface CartState extends Cart {
  isOpen: boolean
}

type CartAction =
  | { type: "ADD_ITEM"; payload: { product: Product; variant?: ProductVariant; quantity: number } }
  | { type: "REMOVE_ITEM"; payload: { productId: string; variantId?: string } }
  | { type: "UPDATE_QUANTITY"; payload: { productId: string; variantId?: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "TOGGLE_CART"; payload: boolean }
  | { type: "SET_DELIVERY_FEE"; payload: number }
  | { type: "HYDRATE"; payload: { items: CartItem[]; deliveryFee: number } }

const initialState: CartState = {
  items: [],
  subtotal: 0,
  deliveryFee: 0,
  total: 0,
  isOpen: false,
}

function calculateTotals(items: CartItem[], deliveryFee: number): { subtotal: number; total: number } {
  const subtotal = items.reduce((sum, item) => {
    const price = item.variant?.price ?? item.product.price
    return sum + price * item.quantity
  }, 0)
  return { subtotal, total: subtotal + (items.length > 0 ? deliveryFee : 0) }
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const { product, variant, quantity } = action.payload
      const stockCount = variant?.stockCount ?? product.stockCount
      const existingItemIndex = state.items.findIndex(
        (item) => item.product.id === product.id && item.variant?.id === variant?.id
      )

      let newItems: CartItem[]
      if (existingItemIndex >= 0) {
        newItems = [...state.items]
        const nextQuantity = Math.min(newItems[existingItemIndex].quantity + quantity, stockCount)
        newItems[existingItemIndex] = { ...newItems[existingItemIndex], quantity: nextQuantity }
      } else {
        newItems = [...state.items, { product, variant, quantity: Math.min(quantity, stockCount) }]
      }

      const { subtotal, total } = calculateTotals(newItems, state.deliveryFee)
      return { ...state, items: newItems, subtotal, total, isOpen: true }
    }
    
    case "REMOVE_ITEM": {
      const newItems = state.items.filter(
        (item) => !(item.product.id === action.payload.productId && item.variant?.id === action.payload.variantId)
      )
      const { subtotal, total } = calculateTotals(newItems, state.deliveryFee)
      return { ...state, items: newItems, subtotal, total }
    }
    
    case "UPDATE_QUANTITY": {
      const { productId, variantId, quantity } = action.payload
      const newItems = state.items.map((item) => {
        if (item.product.id !== productId || item.variant?.id !== variantId) return item
        const stockCount = item.variant?.stockCount ?? item.product.stockCount
        return { ...item, quantity: Math.min(Math.max(0, quantity), stockCount) }
      }).filter((item) => item.quantity > 0)
      
      const { subtotal, total } = calculateTotals(newItems, state.deliveryFee)
      return { ...state, items: newItems, subtotal, total }
    }
    
    case "CLEAR_CART":
      return { ...initialState }
      
    case "TOGGLE_CART":
      return { ...state, isOpen: action.payload }
      
    case "SET_DELIVERY_FEE": {
      const { subtotal, total } = calculateTotals(state.items, action.payload)
      return { ...state, deliveryFee: action.payload, subtotal, total }
    }

    case "HYDRATE": {
      const { items, deliveryFee } = action.payload
      const { subtotal, total } = calculateTotals(items, deliveryFee)
      return { ...state, items, deliveryFee, subtotal, total }
    }

    default:
      return state
  }
}

interface CartContextType {
  cart: CartState
  addItem: (product: Product, variant: ProductVariant | undefined, quantity: number) => void
  removeItem: (productId: string, variantId?: string) => void
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void
  clearCart: () => void
  toggleCart: (isOpen: boolean) => void
  setDeliveryFee: (fee: number) => void
  itemCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, initialState)
  // State (not a ref) so setting it true is batched with the HYDRATE dispatch
  // below into the same re-render - otherwise the persist effect could run,
  // on the initial commit, after this flag flips but before the hydrated
  // items have actually landed in `cart`, and overwrite storage with the
  // still-empty initialState.
  const [isHydrated, setIsHydrated] = useState(false)

  // Load the cart from localStorage once on mount. This runs client-only
  // (after the initial render, which must match the server's empty state to
  // avoid a hydration mismatch) so a page navigation/reload - e.g. going to
  // /account/login and back - doesn't wipe items that were only ever held in
  // memory before.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as { items?: CartItem[]; deliveryFee?: number }
        if (Array.isArray(parsed.items) && parsed.items.length > 0) {
          dispatch({ type: "HYDRATE", payload: { items: parsed.items, deliveryFee: parsed.deliveryFee ?? 0 } })
        }
      }
    } catch (err) {
      console.error("Failed to load cart from storage:", err)
    } finally {
      setIsHydrated(true)
    }
  }, [])

  // Persist on every change, but only after the initial load above has run -
  // otherwise the first render's empty initialState would overwrite whatever
  // was already saved before hydration gets a chance to read it.
  useEffect(() => {
    if (!isHydrated) return
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items: cart.items, deliveryFee: cart.deliveryFee }))
    } catch (err) {
      console.error("Failed to save cart to storage:", err)
    }
  }, [cart.items, cart.deliveryFee, isHydrated])

  const addItem = useCallback((product: Product, variant: ProductVariant | undefined, quantity: number) => {
    dispatch({ type: "ADD_ITEM", payload: { product, variant, quantity } })
  }, [])
  
  const removeItem = useCallback((productId: string, variantId?: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: { productId, variantId } })
  }, [])
  
  const updateQuantity = useCallback((productId: string, variantId: string | undefined, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { productId, variantId, quantity } })
  }, [])
  
  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" })
  }, [])
  
  const toggleCart = useCallback((isOpen: boolean) => {
    dispatch({ type: "TOGGLE_CART", payload: isOpen })
  }, [])
  
  const setDeliveryFee = useCallback((fee: number) => {
    dispatch({ type: "SET_DELIVERY_FEE", payload: fee })
  }, [])
  
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)
  
  return (
    <CartContext.Provider value={{ cart, addItem, removeItem, updateQuantity, clearCart, toggleCart, setDeliveryFee, itemCount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
