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
    "name": "Muffin Plants",
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
    "name": "Muffin Plants",
    "inLanguage": "en-PK",
    "publisher": { "@id": `${BASE_URL}/#business` }
  }
}

/**
 * Product schema for a product page. One Offer per size (inside an AggregateOffer when prices differ), each with its
 * own SKU, price and availability, so search results show the real "from" price and stock.
 *
 * Not included on purpose: shippingDetails (the fee depends on the city and parcel weight, which schema.org can't
 * express per city; a single number would be wrong for most customers) and hasMerchantReturnPolicy (the real policy,
 * a damage claim within 2 hours for a replacement or store credit, has no schema.org equivalent). Search Console
 * lists both as optional "missing field" notes, which don't stop the product appearing.
 */
export function generateProductSchema(product: Product, rating?: { average: number; count: number }) {
  const url = `${BASE_URL}/shop/product/${product.slug}`
  const availabilityMap = {
    "in_stock": "https://schema.org/InStock",
    "low_stock": "https://schema.org/LimitedAvailability",
    "out_of_stock": "https://schema.org/OutOfStock"
  } as const

  // Every size's own photos, card photo first. Google rejects an empty image, so the field is omitted without one.
  const images = [...new Set([...product.images, ...product.variants.flatMap((v) => v.images ?? [])].map((img) => img.url))]

  const sizes = product.variants.length > 0
    ? product.variants
    : [{ id: product.id, name: product.name, price: product.price, stockStatus: product.stockStatus, sku: product.id }]
  const offers = sizes.map((v) => ({
    "@type": "Offer",
    ...(product.variants.length > 1 ? { "name": `${product.name}, ${v.name}` } : {}),
    "sku": v.sku,
    "price": v.price,
    "priceCurrency": "PKR",
    "availability": availabilityMap[v.stockStatus],
    "url": url,
    "itemCondition": "https://schema.org/NewCondition",
    "seller": { "@id": `${BASE_URL}/#business` },
  }))
  const prices = sizes.map((v) => v.price)
  const bestAvailability = sizes.some((v) => v.stockStatus !== "out_of_stock")
    ? (sizes.some((v) => v.stockStatus === "in_stock") ? availabilityMap.in_stock : availabilityMap.low_stock)
    : availabilityMap.out_of_stock

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    ...(product.description ? { "description": product.description } : {}),
    ...(images.length > 0 ? { "image": images } : {}),
    "sku": sizes[0].sku,
    "brand": {
      "@type": "Brand",
      "name": "Muffin Plants"
    },
    "offers": offers.length === 1
      ? offers[0]
      : {
          "@type": "AggregateOffer",
          "priceCurrency": "PKR",
          "lowPrice": Math.min(...prices),
          "highPrice": Math.max(...prices),
          "offerCount": offers.length,
          "availability": bestAvailability,
          "offers": offers,
        },
    "category": product.category.name,
    "url": url,
    ...(rating && rating.count > 0
      ? { "aggregateRating": { "@type": "AggregateRating", "ratingValue": rating.average.toFixed(1), "reviewCount": rating.count } }
      : {})
  }
}

/** Breadcrumb for a product page: Home > Shop > Category > Product. */
export function generateProductBreadcrumb(product: Pick<Product, "name" | "slug" | "category">) {
  return generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Shop", url: "/shop/all" },
    ...(product.category.slug ? [{ name: product.category.name, url: `/shop/${product.category.slug}` }] : []),
    { name: product.name, url: `/shop/product/${product.slug}` },
  ])
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

/** Breadcrumb for the Discount Sale page. */
export function generateDiscountSaleBreadcrumb(pageNumber?: number) {
  const paths = [
    { name: "Home", url: "/" },
    { name: "Shop All", url: "/shop/all" },
    { name: "Discount Sale", url: "/shop/discount-sale" },
  ]
  if (pageNumber && pageNumber > 1) paths.push({ name: `Page ${pageNumber}`, url: `/shop/discount-sale?page=${pageNumber}` })
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