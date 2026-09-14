"use client"

import { useState } from "react"
import { mockProducts } from "@/data/mock-products"
import { ProductCard } from "@/components/ui/product-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, SlidersHorizontal } from "lucide-react"

export default function ShopAllPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  
  const filteredProducts = mockProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="bg-cream-100 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <p className="font-mono text-sm text-forest-500 mb-2">Shop</p>
          <h1 className="font-serif text-heading-1 text-forest-900">All Plants</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-400" />
            <Input 
              placeholder="Search plants..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="w-4 h-4 mr-2" /> Filters
          </Button>
        </div>
        
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-forest-600 text-lg">No plants found. Try a different search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
