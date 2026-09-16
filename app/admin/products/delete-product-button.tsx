"use client"

export function DeleteProductButton({
  productName,
  action,
}: {
  productName: string
  action: () => void
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Delete "${productName}"? This can't be undone.`)) {
          e.preventDefault()
        }
      }}
    >
      <button type="submit" className="text-sm text-red-600 hover:underline">
        Delete product
      </button>
    </form>
  )
}
