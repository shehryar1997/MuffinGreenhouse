"use client"

import { DeleteButton } from "../_components/delete-button"
import type { ProductActionResult } from "./actions"

export function DeleteProductButton({
  productName,
  action,
  label = "Delete",
}: {
  productName: string
  action: () => Promise<ProductActionResult>
  label?: string
}) {
  return (
    <DeleteButton
      title={`Delete “${productName}”?`}
      description="This can't be undone."
      action={action}
      label={label}
      fallbackError="Couldn't delete the product. Check your connection and try again."
    />
  )
}
