// Orders that the admin records by hand (the customer ordered on WhatsApp). The `customers` table
// requires a unique e-mail, but WhatsApp customers usually don't give one, so they get a stand-in
// address on a domain that can never receive mail. Nothing may ever be e-mailed to it.

const PLACEHOLDER_DOMAIN = "whatsapp.muffinplants.invalid"

/** "+92 300 1234567", "0300-1234567" and "923001234567" all become "03001234567". */
export function normalizePkPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "")
  if (digits.startsWith("0092")) digits = digits.slice(4)
  else if (digits.startsWith("92")) digits = digits.slice(2)
  return digits.startsWith("0") ? digits : `0${digits}`
}

export function placeholderEmailForPhone(phone: string): string {
  return `wa-${normalizePkPhone(phone)}@${PLACEHOLDER_DOMAIN}`
}

export function isPlaceholderEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase().endsWith(`@${PLACEHOLDER_DOMAIN}`)
}

/** The e-mail to show in the admin: nothing for a stand-in address. */
export function realEmail(email: string | null | undefined): string | null {
  return email && !isPlaceholderEmail(email) ? email : null
}

/** First line of internal_notes on an order recorded by hand; the only marker of where it came from. */
export const MANUAL_ORDER_NOTE = "Recorded manually — customer ordered on WhatsApp."

export function isManualOrder(internalNotes: string | null | undefined): boolean {
  return !!internalNotes && internalNotes.startsWith(MANUAL_ORDER_NOTE)
}

/** internal_notes without the marker line, for places the note is printed. */
export function visibleInternalNotes(internalNotes: string | null | undefined): string {
  return (internalNotes ?? "").replace(MANUAL_ORDER_NOTE, "").trim()
}
