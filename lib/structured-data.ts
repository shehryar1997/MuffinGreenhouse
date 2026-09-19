// Structured data utilities for JSON-LD schema.org markup
import { Product } from "@/types"
import { siteConfig } from "@/config/nav.config"

// Base URL from environment
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.muffinplants.com"

/**
 * Generates Organization schema for the site
 * Used in the root layout
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Muffin Greenhouse",
    "url": BASE_URL,
    "logo": `${BASE_URL}/logo-nav.png`, // /images/logo.svg never existed (404)
    "sameAs": [
      "https://www.instagram.com/muffinsgreenhouse/"
    ],
    "description": siteConfig.description,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": siteConfig.address.city,
      "addressRegion": "Sindh",
      "addressCountry": "PK"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": siteConfig.email,
      "telephone": siteConfig.whatsappNumber.replace("+", "")
    }
  }
}

/**
 * Generates Product schema for a single product
 */
export function generateProductSchema(product: Product) {
  const mainImage = product.images.length > 0 ? product.images[0].url : ""
  
  // Map stockStatus to schema.org availability
  const availabilityMap = {
    "in_stock": "https://schema.org/InStock",
    "low_stock": "https://schema.org/LimitedAvailability",
    "out_of_stock": "https://schema.org/OutOfStock"
  } as const
  
  const offers = {
    "@type": "Offer",
    "price": product.price,
    "priceCurrency": "PKR",
    "availability": availabilityMap[product.stockStatus],
    "url": `${BASE_URL}/shop/product/${product.slug}`,
    "itemCondition": "https://schema.org/NewCondition"
    // ponytail: shippingDetails removed. It declared a 0 PKR shipping rate, i.e. "free delivery" in search
    // results, but delivery costs Rs 400+ (see lib/delivery-fee.ts). Re-add with real rates if wanted.
  }
  
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": mainImage,
    "sku": product.variants.length > 0 ? product.variants[0].sku : product.id,
    "brand": {
      "@type": "Brand",
      "name": "Muffin Greenhouse"
    },
    "offers": offers,
    "category": product.category.name,
    "url": `${BASE_URL}/shop/product/${product.slug}`
  }
}

/**
 * Generates BreadcrumbList schema for category/listing pages
 */
export function generateBreadcrumbSchema(paths: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": paths.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `${BASE_URL}${item.url}`
    }))
  }
}

/**
 * Generates breadcrumb for shop category page
 */
export function generateCategoryBreadcrumb(categoryName: string, categorySlug: string, pageNumber?: number) {
  const paths = [
    { name: "Home", url: "/" },
    { name: "Shop", url: "/shop/all" },
    { name: categoryName, url: `/shop/${categorySlug}` }
  ]
  
  if (pageNumber && pageNumber > 1) {
    paths.push({ name: `Page ${pageNumber}`, url: `/shop/${categorySlug}?page=${pageNumber}` })
  }
  
  return generateBreadcrumbSchema(paths)
}

/**
 * Generates breadcrumb for shop all page
 */
export function generateShopAllBreadcrumb(pageNumber?: number) {
  const paths = [
    { name: "Home", url: "/" },
    { name: "Shop All", url: "/shop/all" }
  ]
  
  if (pageNumber && pageNumber > 1) {
    paths.push({ name: `Page ${pageNumber}`, url: `/shop/all?page=${pageNumber}` })
  }
  
  return generateBreadcrumbSchema(paths)
}

/**
 * Serialises JSON-LD for use inside a <script> tag. Escapes "<" so that text
 * from the database (product names/descriptions) can never contain a literal
 * "</script>" and break out of the tag.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data, null, 2).replace(/</g, "\\u003c")
}

/**
 * Renders JSON-LD script tag as a string
 */
export function renderJsonLdScript(data: unknown): string {
  return `<script type="application/ld+json">${serializeJsonLd(data)}</script>`
}