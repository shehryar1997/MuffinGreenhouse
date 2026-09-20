"use client"

import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { useState } from "react"
import React from "react"

export function FadeIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const prefersReducedMotion = useReducedMotion()
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  )
}

export function KineticHeading({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const prefersReducedMotion = useReducedMotion()
  if (prefersReducedMotion) {
    return <div>{children}</div>
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay }}
    >
      {children}
    </motion.div>
  )
}

export function KineticLine({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const prefersReducedMotion = useReducedMotion()
  if (prefersReducedMotion) {
    return <span className={className}>{children}</span>
  }
  return (
    <motion.span
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.35,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={`block ${className}`}
    >
      {children}
    </motion.span>
  )
}

export function LiftText({ children, className = "" }: { children: string; className?: string }) {
  const prefersReducedMotion = useReducedMotion()
  const [isHovered, setIsHovered] = useState(false)
  if (prefersReducedMotion) {
    return <span className={className}>{children}</span>
  }
  // Letters are separate blocks so they can lift one by one, but each word is kept whole and the spaces stay real
  // spaces: a long line wraps between words (it used to break in the middle of a word on phones).
  const words = children.split(" ")
  let index = 0
  return (
    <span
      className={`inline-block ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {words.map((word, w) => (
        <span key={w}>
          <span className="inline-block whitespace-nowrap">
            {word.split("").map((letter) => {
              const i = index++
              return (
                <motion.span
                  key={i}
                  className="inline-block"
                  animate={isHovered ? { y: -3 } : { y: 0 }}
                  transition={{
                    duration: 0.25,
                    delay: i * 0.02,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {letter}
                </motion.span>
              )
            })}
          </span>
          {w < words.length - 1 && " "}
        </span>
      ))}
    </span>
  )
}

interface AnimatedHeadingProps {
  lines: string[]
  className?: string | string[]
  stagger?: number
  delay?: number
}

export function AnimatedHeading({ lines, className = "", stagger = 0.08, delay = 0 }: AnimatedHeadingProps) {
  const prefersReducedMotion = useReducedMotion()
  const getLineClass = (index: number): string => {
    if (Array.isArray(className)) {
      return className[index] || className[className.length - 1] || ""
    }
    return className
  }
  if (prefersReducedMotion) {
    return (
      <>
        {lines.map((line, i) => (
          <span key={i} className={`block ${getLineClass(i)}`}>
            {line}
          </span>
        ))}
      </>
    )
  }
  return (
    <>
      {lines.map((line, i) => (
        <KineticLine key={i} className={getLineClass(i)} delay={delay + i * stagger}>
          <LiftText>{line}</LiftText>
        </KineticLine>
      ))}
    </>
  )
}
