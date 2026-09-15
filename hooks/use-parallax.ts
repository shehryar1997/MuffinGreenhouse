"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface ParallaxOffset {
  x: number
  y: number
}

interface UseParallaxOptions {
  maxOffset?: number
}

/**
 * Hook for cursor-reactive parallax effect.
 * 
 * Returns offset values that subtly drift toward cursor position.
 * Disabled on touch devices and when prefers-reduced-motion is set.
 * 
 * @param maxOffset Maximum pixels to move (default: 8)
 * @returns Object with x/y offset values and ref to attach to container
 */
export function useParallax(
  options: UseParallaxOptions = {}
): { offset: ParallaxOffset; containerRef: React.RefObject<HTMLDivElement | null> } {
  const { maxOffset = 8 } = options
  const [offset, setOffset] = useState<ParallaxOffset>({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      const container = containerRef.current
      if (!container) return

      // Cancel any pending RAF
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }

      rafRef.current = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        // Calculate distance from center as -1 to 1
        const percentX = (event.clientX - centerX) / (rect.width / 2)
        const percentY = (event.clientY - centerY) / (rect.height / 2)

        // Clamp to -1 to 1 and apply max offset
        const clampedX = Math.max(-1, Math.min(1, percentX))
        const clampedY = Math.max(-1, Math.min(1, percentY))

        setOffset({
          x: clampedX * maxOffset,
          y: clampedY * maxOffset,
        })
      })
    },
    [maxOffset]
  )

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }
    // Smoothly reset to center
    setOffset({ x: 0, y: 0 })
  }, [])

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) {
      return
    }

    // Check for touch device - disable on coarse pointer devices
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches
    if (isTouchDevice) {
      return
    }

    const container = containerRef.current
    if (!container) return

    container.addEventListener("mousemove", handleMouseMove, { passive: true })
    container.addEventListener("mouseleave", handleMouseLeave, { passive: true })

    return () => {
      container.removeEventListener("mousemove", handleMouseMove)
      container.removeEventListener("mouseleave", handleMouseLeave)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [handleMouseMove, handleMouseLeave])

  return { offset, containerRef }
}
