"use client"

import { DeleteButton } from "../_components/delete-button"
import type { EventActionResult } from "./actions"

export function DeleteEventButton({ title, action }: { title: string; action: () => Promise<EventActionResult> }) {
  return (
    <DeleteButton
      title={`Delete “${title}”?`}
      description={"This can't be undone.\n\nEvents that already have bookings can't be deleted; cancel them instead."}
      action={action}
      size="md"
      fallbackError="Couldn't delete the event. Check your connection and try again."
    />
  )
}
