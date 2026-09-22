"use client"

import Image, { type ImageProps } from "next/image"
import { loaderFor } from "@/lib/image-loader"

/**
 * next/image that serves admin-uploaded photos from their pre-sized copies in R2 (see lib/image-urls.ts), so the
 * catalogue's photos don't use up Vercel's image-optimisation quota. Any other image is optimised as usual.
 * A client component, so server components can use it too (a loader function can't cross that boundary).
 */
export function SmartImage({ loader, ...props }: ImageProps) {
  // eslint-disable-next-line jsx-a11y/alt-text -- alt is part of props
  return <Image {...props} loader={loader ?? loaderFor(typeof props.src === "string" ? props.src : undefined)} />
}
