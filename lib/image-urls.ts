// URL conventions for photos uploaded through the admin panel (app/api/admin/upload-image). Every upload is stored as
//   <folder>/<uuid>.avif            the full photo (up to 2000px)
//   <folder>/<uuid>.w400.avif       400 / 800 / 1200px-wide copies, served straight from R2 so Vercel's image
//   <folder>/<uuid>.w800.avif       optimiser (and its monthly quota) isn't needed for them
//   <folder>/<uuid>.w1200.avif
//   <folder>/<uuid>.og.jpg          1200px JPEG for WhatsApp/Facebook previews, which don't read AVIF
// Files uploaded before this convention (or on other hosts) don't match, and fall back to next/image's optimiser.
import { PUBLIC_BASE_URL } from "@/lib/r2-url"

export const SIZED_WIDTHS = [400, 800, 1200] as const

const UPLOADED = new RegExp(
  `^${PUBLIC_BASE_URL.replace(/[.]/g, "\\.")}/(products|events|journal)/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\\.avif$`,
  "i"
)

/** The folder and id of an admin upload, or null for any other URL. */
export function parseUploadedUrl(url: string | null | undefined): { folder: string; id: string } | null {
  const match = (url ?? "").trim().match(UPLOADED)
  return match ? { folder: match[1].toLowerCase(), id: match[2].toLowerCase() } : null
}

/** A copy of an uploaded photo at least `width` pixels wide (the original when none is that big). */
export function sizedImageUrl(url: string, width: number): string {
  const parsed = parseUploadedUrl(url)
  if (!parsed) return url
  const size = SIZED_WIDTHS.find((w) => w >= width)
  return size ? `${PUBLIC_BASE_URL}/${parsed.folder}/${parsed.id}.w${size}.avif` : url
}

/** The JPEG social-preview copy of an uploaded photo, or null when the photo has none. */
export function socialImageUrl(url: string | null | undefined): string | null {
  const parsed = parseUploadedUrl(url)
  return parsed ? `${PUBLIC_BASE_URL}/${parsed.folder}/${parsed.id}.og.jpg` : null
}

/** Every R2 key that belongs to one upload (the original plus its copies). */
export function uploadSiblingKeys(key: string): string[] {
  const match = key.match(/^(products|events|journal)\/([0-9a-f-]{36})\.avif$/i)
  if (!match) return [key]
  const base = `${match[1]}/${match[2]}`
  return [key, ...SIZED_WIDTHS.map((w) => `${base}.w${w}.avif`), `${base}.og.jpg`]
}
