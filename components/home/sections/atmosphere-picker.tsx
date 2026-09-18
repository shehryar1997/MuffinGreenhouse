"use client"

import { useState } from "react"
import { Product } from "@/types"
import { moodThemes, Mood } from "@/lib/mood-utils"
import { FadeIn, KineticHeading, AnimatedHeading } from "@/components/home/shared/animations"
import { MoodPlantsGrid } from "@/components/home/shared/mood-plants-grid"

interface AtmospherePickerProps {
  products: Product[]
}

export function AtmospherePicker({ products }: AtmospherePickerProps) {
  const [selectedMood, setSelectedMood] = useState<Mood>("soft")
  const theme = moodThemes[selectedMood]

  return (
    <section className={`py-24 lg:py-32 transition-colors duration-500 ${theme.bg}`}>
      <div className="container mx-auto px-6 lg:px-12">
        <FadeIn>
          <div className="mb-16">
            <span className={`font-mono text-xs ${theme.textMuted}`}>003</span>
            <span className={`mx-3 ${theme.textSecondary}`}>/</span>
            <span className={`font-mono text-xs tracking-widest ${theme.textMuted}`}>THE COLLECTION</span>
          </div>
        </FadeIn>
        <FadeIn delay={0.1}>
          <h2 className="font-serif leading-[0.9] tracking-tight mb-16">
            <AnimatedHeading
              lines={["Pick your", "atmosphere."]}
              className={`text-[clamp(2.5rem,8vw,5.5rem)] ${theme.textPrimary}`}
            />
          </h2>
        </FadeIn>
        <FadeIn delay={0.2}>
          <p className={`text-sm mb-8 ${theme.textSecondary}`}>Not every plant belongs in every room.</p>
        </FadeIn>
        <FadeIn delay={0.3}>
          <div className="flex items-center gap-3 mb-12 flex-wrap">
            <span className={`font-mono text-xs uppercase mr-4 ${theme.textMuted}`}>My room feels</span>
            {(["soft", "bright", "moody"] as Mood[]).map((m) => {
              const mTheme = moodThemes[m]
              const isSelected = selectedMood === m
              const currentTheme = theme
              return (
                <button
                  key={m}
                  onClick={() => {
                    setSelectedMood(m)
                    const grid = document.getElementById('mood-products-grid')
                    if (grid) {
                      grid.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }}
                  className={`px-5 py-2 rounded-full text-xs font-medium tracking-wide border transition-all duration-300 ${isSelected ? mTheme.buttonActive : `${mTheme.buttonInactive} ${mTheme.accent ?? mTheme.buttonInactiveText} hover:${mTheme.borderHover}`}`}
                >
                  {m.toUpperCase()}
                </button>
              )
            })}
          </div>
        </FadeIn>
        <FadeIn delay={0.4}>
          <div id="mood-products-grid">
            <MoodPlantsGrid products={products} mood={selectedMood} theme={theme} />
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
