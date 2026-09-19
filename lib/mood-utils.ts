// Mood theme utilities for the atmosphere section
// ponytail: This module can be swapped to query Supabase directly without changing UI components

import { Product } from "@/types"

export type Mood = "soft" | "bright" | "moody"

export interface MoodTheme {
  bg: string
  bgSecondary: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  accent: string
  accentText: string
  border: string
  borderHover: string
  buttonActive: string
  buttonInactive: string
  buttonInactiveText: string
}

export const moodThemes: Record<Mood, MoodTheme> = {
  soft: {
    bg: "bg-cream-200",           // Darker shade of cream
    bgSecondary: "bg-cream-300",
    textPrimary: "text-forest-900",
    textSecondary: "text-forest-700",
    textMuted: "text-forest-500",
    accent: "text-clay-500",
    accentText: "text-clay-600",
    border: "border-cream-400",
    borderHover: "border-clay-500",
    buttonActive: "bg-clay-500 text-white border-clay-500",
    buttonInactive: "bg-transparent border-forest-400",
    buttonInactiveText: "text-forest-700",
  },
  bright: {
    bg: "bg-sprout-300",
    bgSecondary: "bg-sprout-200",
    textPrimary: "text-ink",
    textSecondary: "text-ink-soft",
    textMuted: "text-ink-muted",
    accent: "text-clay-600",
    accentText: "text-clay-600",
    border: "border-ink/30",
    borderHover: "border-ink",
    buttonActive: "bg-clay-500 text-white border-clay-500",  // Orange bg, white text like SOFT
    buttonInactive: "bg-transparent border-ink-soft",
    buttonInactiveText: "text-ink-soft",
  },
  moody: {
    bg: "bg-ink",
    bgSecondary: "bg-ink-soft",
    textPrimary: "text-paper",
    textSecondary: "text-white",    // White for "Not every plant belongs in every room."
    textMuted: "text-white",        // White for "003/THE COLLECTION", etc.
    accent: "text-sprout-300",
    accentText: "text-sprout-300",
    border: "border-ink-muted",
    borderHover: "border-sprout-300",
    buttonActive: "bg-sprout-300 text-ink border-sprout-300",
    buttonInactive: "bg-transparent border-ink-muted",
    buttonInactiveText: "text-[#A9C09B]",
  },
}

export function filterProductsByMood(products: Product[], mood: Mood): Product[] {
  return products.filter((product) => product.moodTags.includes(mood))
}

export function getMoodTheme(mood: Mood) {
  return moodThemes[mood]
}
