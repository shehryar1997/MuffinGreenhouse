"use client"

import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { useState } from "react"
import React from "react"

export function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const prefersReducedMotion = useReducedMotion()
  if (prefersReducedMotion) {
    return <div>{children}</div>
  }
  return (
    <motion.div
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
  const letters = children.split("")
  return (
    <span
      className={`inline-block ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          className="inline-block"
          animate={isHovered ? { y: -3 } : { y: 0 }}
          transition={{
            duration: 0.25,
            delay: index * 0.02,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
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
