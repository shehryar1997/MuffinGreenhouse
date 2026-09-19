"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-cream-100 group-[.toaster]:text-forest-900 group-[.toaster]:border-forest-200 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-forest-600",
          actionButton:
            "group-[.toast]:bg-clay-500 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-forest-500",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
