// Hosts `next/image` may load from (must match `images.remotePatterns` in next.config.mjs).
// A product/event/journal image on any other host would make next/image throw and blank the page,
// so the admin actions refuse those URLs up front.
export const ALLOWED_IMAGE_HOSTS = [
  "images.muffinplants.com",
  "pub-81f46d28c378411d9acc02aef58b2bee.r2.dev",
  "images.unsplash.com",
  "res.cloudinary.com",
  "ik.imagekit.io",
  "images.pexels.com",
] as const

/** True for an https URL on an allowed image host. */
export function isAllowedImageUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "https:" && (ALLOWED_IMAGE_HOSTS as readonly string[]).includes(url.hostname)
  } catch {
    return false
  }
}
