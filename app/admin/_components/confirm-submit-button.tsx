"use client"

import { useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import { Loader2 } from "lucide-react"
import { ConfirmDialog } from "./confirm-dialog"

// A submit button that asks "are you sure?" first, for irreversible / customer-facing actions (e.g. cancelling an
// order sends the customer an e-mail). The button lives inside the <form>; confirming submits that form.
export function ConfirmSubmitButton({
  message,
  title = "Are you sure?",
  confirmLabel = "Confirm",
  cancelLabel,
  tone = "default",
  className,
  children,
}: {
  message: string
  title?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: "default" | "danger"
  className?: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { pending } = useFormStatus()

  return (
    <>
      <button ref={buttonRef} type="button" className={className} disabled={pending} onClick={() => setOpen(true)}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {children}
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={message}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        tone={tone}
        onConfirm={() => {
          setOpen(false)
          buttonRef.current?.form?.requestSubmit()
        }}
      />
    </>
  )
}
