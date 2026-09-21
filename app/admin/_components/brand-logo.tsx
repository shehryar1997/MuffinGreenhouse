import Image from "next/image"
import { cn } from "@/lib/utils"

/**
 * The Muffin Plants logo for the admin. The artwork has a dark-green outline, so on the dark sidebar it
 * sits on a light chip (same approach as the storefront's Ask Muffin widget); on light pages use it bare.
 */
export function BrandLogo({ chip = false, className }: { chip?: boolean; className?: string }) {
  const image = (
    <Image
      src="/logo-nav.png"
      alt=""
      width={473}
      height={512}
      className={cn("w-auto object-contain", chip ? "h-[78%]" : "h-full")}
      priority
    />
  )
  if (!chip) return <span className={cn("inline-flex", className)}>{image}</span>
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-lg bg-paper ring-1 ring-white/10", className)}>{image}</span>
  )
}
