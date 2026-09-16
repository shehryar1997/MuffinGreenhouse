"use client"

import { motion } from "framer-motion"

interface UseCaseHeaderProps {
  icon: string
  title: string
  desc: string
  count: number
}

export function UseCaseHeader({ icon, title, desc, count }: UseCaseHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-12"
    >
      <span className="text-4xl mb-4 block">{icon}</span>
      <h1 className="font-serif text-heading-1 text-forest-900 mb-2">{title}</h1>
      <p className="text-forest-600">{desc}</p>
      <p className="text-forest-500 text-sm mt-2">{count} plants match</p>
    </motion.div>
  )
}
