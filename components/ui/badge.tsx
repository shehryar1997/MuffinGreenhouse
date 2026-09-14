import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-clay-500 text-white hover:bg-clay-600",
        secondary:
          "border-transparent bg-sprout-300 text-forest-900 hover:bg-sprout-400",
        outline: "text-forest-900",
        success: "border-transparent bg-[#D4F542] text-[#1A1A1A] hover:bg-[#D4F542]/90",
        lowStock: "border-transparent bg-orange-100 text-orange-800",
        outOfStock: "border-transparent bg-forest-200/50 text-forest-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
