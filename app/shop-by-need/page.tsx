"use client"

import { motion } from "framer-motion"
import { useCases } from "@/data/mock-products"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export default function ShopByNeedIndexPage() {
  return (
    <div className="bg-cream-100 min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <p className="font-mono text-sm text-forest-500 mb-2">Filter</p>
          <h1 className="font-serif text-display text-forest-900 mb-4">Shop by Need</h1>
          <p className="text-forest-600 max-w-xl mx-auto">
            Not sure what you want? Browse by what matters to you.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(useCases).map(([key, data], i) => (
            <Link key={key} href={`/shop-by-need/${key}`}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group bg-cream-200 rounded-2xl p-8 hover:bg-clay-500/10 transition-colors border-2 border-transparent hover:border-clay-500"
              >
                <span className="text-4xl mb-4 block">{data.icon}</span>
                <h2 className="font-serif text-xl text-forest-900 mb-2 group-hover:text-clay-500 transition-colors">
                  {data.title}
                </h2>
                <p className="text-forest-600 mb-4">{data.desc}</p>
                <div className="flex items-center gap-2 text-clay-500 font-medium">
                  <span className="text-sm">Browse</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
