"use client"

import { useSyncExternalStore } from "react"

/**
 * Hook to detect if user prefers reduced motion.
 * Returns `false` on the server to avoid hydration mismatch,
 * then updates to the actual preference on the client.
 */
const QUERY = "(prefers-reduced-motion: reduce)"

function subscribe(onChange: () => void) {
  const mediaQuery = window.matchMedia(QUERY)
  mediaQuery.addEventListener("change", onChange)
  return () => mediaQuery.removeEventListener("change", onChange)
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  )
}
