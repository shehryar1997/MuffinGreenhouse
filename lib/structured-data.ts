// Structured data utilities for JSON-LD schema.org markup
import { Product } from "@/types"
import { siteConfig } from "@/config/nav.config"

// Base URL from environment
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.muffinplants.com"

/**
 * Generates the business schema for the site (Store = a LocalBusiness subtype). Used in the root layout.
 * No streetAddress/geo/openingHours on purpose: there is no public street address (pickups are arranged over
 * WhatsApp, see siteConfig). Add them here once a public address or Google Business Profile exists.
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["Store", "LocalBusiness"],
    "@id": `${BASE_URL}/#business`,
    "name": "Muffin Greenhouse",
    "url": BASE_URL,
    "logo": `${BASE_URL}/logo-nav.png`, // /images/logo.svg never existed (404)
    "image": `${BASE_URL}/opengraph-image.png`,
    "sameAs": [
      siteConfig.social.instagram
    ],
    "description": siteConfig.description,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": siteConfig.address.city,
      "addressRegion": "Sindh",
      "addressCountry": "PK"
    },
    "areaServed": [
      { "@type": "City", "name": siteConfig.address.city },
      { "@type": "Country", "name": "Pakistan" }
    ],
    "currenciesAccepted": "PKR",
    "email": siteConfig.email,
    // E.164 ("+92..."): schema.org and Google expect the leading "+", which the old code stripped.
    "telephone": siteConfig.whatsappNumber,
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": siteConfig.email,
      "telephone": siteConfig.whatsappNumber,
      "areaServed": "PK",
      "availableLanguage": ["English", "Urdu"]
    }
  }
}

/**
 * Generates WebSite schema (site name for search results). No SearchAction: the on-site search is a drawer
 * without a crawlable results URL for that to point at.
 */
export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    "url": BASE_URL,
    "name": "Muffin Greenhouse",
    "inLanguage": "en-PK",
    "publisher": { "@id": `${BASE_URL}/#business` }
  }
}

/**
 * Generates Product schema for a single product
 */
export function generateProductSchema(product: Product, rating?: { average: number; count: number }) {
  // Google rejects an empty image: omit the field entirely when the product has no photo yet.
  const mainImage = product.images.length > 0 ? product.images[0].url : undefined
  
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
    ...(product.description ? { "description": product.description } : {}),
    ...(mainImage ? { "image": product.images.map((img) => img.url) } : {}),
    "sku": product.variants.length > 0 ? product.variants[0].sku : product.id,
    "brand": {
      "@type": "Brand",
      "name": "Muffin Greenhouse"
    },
    "offers": offers,
    "category": product.category.name,
    "url": `${BASE_URL}/shop/product/${product.slug}`,
    ...(rating && rating.count > 0
      ? { "aggregateRating": { "@type": "AggregateRating", "ratingValue": rating.average.toFixed(1), "reviewCount": rating.count } }
      : {})
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