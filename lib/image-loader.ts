import type { ImageLoaderProps } from "next/image"
import { parseUploadedUrl, sizedImageUrl } from "@/lib/image-urls"

/** Serves an admin-uploaded photo's pre-sized R2 copy instead of running it through Vercel's image optimiser. */
export function r2SizedLoader({ src, width }: ImageLoaderProps): string {
  return sizedImageUrl(src, width)
}

/** The loader for a photo URL: the R2 copies for admin uploads, next/image's default for everything else. */
export function loaderFor(src: string | null | undefined) {
  return parseUploadedUrl(src) ? r2SizedLoader : undefined
}
