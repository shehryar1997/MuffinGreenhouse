import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:brightness-110",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:brightness-110",
        outline: "text-foreground border-border hover:bg-muted/50",
        success: "border-transparent bg-sprout dark:bg-sprout-500 text-ink hover:brightness-110",
        lowStock: "border-transparent bg-orange-100 dark:bg-orange-950/30 text-orange-900 dark:text-orange-200",
        outOfStock: "border-transparent bg-muted text-muted-foreground italic",
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
