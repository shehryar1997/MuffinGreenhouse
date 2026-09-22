import type { Metadata } from "next"

export const SITE_NAME = "Muffin Plants"
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.muffinplants.com"
export const DEFAULT_OG_IMAGE = { url: "/og-default.png", width: 1200, height: 630, alt: "Muffin Plants" }

type OgImage = { url: string; width?: number; height?: number; alt?: string }

/**
 * Page metadata with a matching social preview. Without this every page inherited the root layout's Open Graph
 * title, so a plant shared on WhatsApp showed the homepage's title and picture.
 *
 * `title` is the page's own title; the root layout's template adds " - Muffin Plants" to the <title> tag, and the
 * social title gets the same suffix here (social cards don't use the template). Pass `absoluteTitle` for pages
 * whose title already names the brand.
 */
export function pageMetadata({
  title,
  description,
  path,
  images,
  noindex = false,
  type = "website",
  absoluteTitle = false,
}: {
  title: string
  description: string
  path?: string
  images?: OgImage[]
  noindex?: boolean
  type?: "website" | "article"
  absoluteTitle?: boolean
}): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} - ${SITE_NAME}`
  const ogImages = images && images.length > 0 ? images : [DEFAULT_OG_IMAGE]
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    ...(path ? { alternates: { canonical: path } } : {}),
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title: fullTitle,
      description,
      ...(path ? { url: path } : {}),
      siteName: SITE_NAME,
      locale: "en_PK",
      type,
      images: ogImages,
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: ogImages.map((i) => i.url) },
  }
}

/** Trims text to a search-snippet length on a word boundary. */
export function snippet(text: string | null | undefined, max = 155): string {
  const clean = (text ?? "").replace(/[#*_>`\[\]]/g, "").replace(/\s+/g, " ").trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(" ")
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,.;:\s-]+$/, "")}…`
}
