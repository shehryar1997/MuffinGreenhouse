"use client"

import { DeleteButton } from "../_components/delete-button"
import type { JournalActionResult } from "./actions"

export function DeletePostButton({ title, action }: { title: string; action: () => Promise<JournalActionResult> }) {
  return (
    <DeleteButton
      title={`Delete “${title}”?`}
      description={"This can't be undone.\n\nTo hide it without deleting, untick “Publish” and save instead."}
      action={action}
      size="md"
      fallbackError="Couldn't delete the post. Check your connection and try again."
    />
  )
}
