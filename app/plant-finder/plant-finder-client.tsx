'use client'

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { findMatchingPlants } from "@/lib/muffin-engine"
import { getAllProducts } from "@/lib/data/products"
import type { Product } from "@/types"
import Link from "next/link"
import Image from "next/image"

const questions = [
  { id: "light", question: "Your light situation?", options: ["Low light", "Medium", "Bright"], values: ["low", "medium", "bright"] },
  { id: "water", question: "Watering habits?", options: ["Forgetful", "Weekly", "Daily"], values: ["low", "medium", "high"] },
  { id: "pets", question: "Pets or kids?", options: ["Yes", "No"], values: ["yes", "no"] },
]

export function PlantFinderClient() {
  const [step, setStep] = useState(-1)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [matches, setMatches] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [, setIsLoading] = useState(false)

  // Fetch products on mount with abort capability
  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal
    
    async function loadProducts() {
      if (signal.aborted) return
      
      try {
        const products = await getAllProducts()
        if (!signal.aborted) {
          setAllProducts(products)
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return
        console.error("Error fetching products:", err)
      }
    }
    
    loadProducts()
    
    return () => {
      controller.abort()
    }
  }, [])

  function findPlants(answers: Record<string, string>): Product[] {
    return findMatchingPlants(allProducts, answers).slice(0, 3)
  }

  const start = () => { setStep(0); setAnswers({}); setMatches([]) }
  const select = async (val: string) => {
    setIsLoading(true)
    const newAns = { ...answers, [questions[step].id]: val }
    setAnswers(newAns)
    if (step < questions.length - 1) {
      setStep(step + 1)
    } else {
      const matched = findPlants(newAns)
      setMatches(matched.length > 0 ? matched : allProducts.slice(0, 3))
      setStep(questions.length)
    }
    setIsLoading(false)
  }

  return (
    <div className="bg-cream-100 min-h-screen py-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <AnimatePresence mode="wait">
          {step === -1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <p className="font-mono text-sm text-forest-500">Plant Finder</p>
              <h1 className="font-serif text-display text-forest-900 my-6">Find your plant</h1>
              <Button size="lg" onClick={start}>Start Quiz</Button>
            </motion.div>
          )}
          {step >= 0 && step < questions.length && (
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="text-center">
              <div className="flex justify-center gap-2 mb-6">{questions.map((_, i) => <div key={i} className={`h-1 w-12 rounded-full ${i <= step ? "bg-clay-500" : "bg-forest-200"}`} />)}</div>
              <h2 className="font-serif text-heading-2 text-forest-900 mb-6">{questions[step].question}</h2>
              <div className="grid gap-3">{questions[step].options.map((o, i) => <button key={i} onClick={() => select(questions[step].values[i])} className="p-6 text-left border-2 border-forest-200 rounded-xl hover:border-clay-500"><span className="font-medium text-lg">{o}</span></button>)}</div>
            </motion.div>
          )}
          {step === questions.length && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
              <p className="font-mono text-sm text-forest-500">Your Matches</p>
              <h2 className="font-serif text-heading-1 text-forest-900 my-6">{matches.length} plants</h2>
              <div className="grid gap-4 mb-8">
                {matches.map((p, i) => (
                  <div key={p.id} className={`p-6 border-2 rounded-xl flex gap-6 text-left ${i === 0 ? "border-clay-500" : "border-forest-200"}`}>
                    <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-forest-50"><Image src={p.images[0]?.url} alt={p.name} fill className="object-cover" /></div>
                    <div className="flex-1">
                      {i === 0 && <Badge variant="secondary" className="mb-2">Best Match</Badge>}
                      <h3 className="font-serif text-xl mb-2">{p.name}</h3>
                      <p className="text-forest-600 text-sm mb-2">{p.description.substring(0, 60)}...</p>
                      <p className="font-mono mb-3">PKR {p.price}</p>
                      <Button size="sm" asChild><Link href={`/shop/product/${p.slug}`}>View Details</Link></Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" onClick={() => setStep(-1)}>Start Over</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}