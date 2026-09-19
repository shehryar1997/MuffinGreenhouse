"use client"

// A submit button that asks "are you sure?" first -- for irreversible / customer-facing
// actions (e.g. cancelling an order sends the customer an e-mail).
export function ConfirmSubmitButton({
  message,
  className,
  children,
}: {
  message: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault()
      }}
    >
      {children}
    </button>
  )
}
