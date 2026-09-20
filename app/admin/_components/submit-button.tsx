"use client"

import { useFormStatus } from "react-dom"
import { Loader2 } from "lucide-react"
import { buttonClass, type ButtonSize, type ButtonVariant } from "./ui"

// Submit button for <form action={serverAction}> forms: disables itself and shows a spinner while the action runs.
export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  size = "md",
  className,
}: {
  children: React.ReactNode
  pendingLabel?: string
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={buttonClass({ variant, size, className })}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  )
}
