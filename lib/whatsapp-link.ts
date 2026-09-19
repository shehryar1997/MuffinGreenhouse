// Click-to-chat helpers. These only build a wa.me link that opens WhatsApp with a pre-filled
// message -- nothing is sent automatically (that needs the WhatsApp Business API).

/** Digits-only international number for a Pakistani mobile ("0300 1234567", "+92 300 1234567", "3001234567"). */
export function toWhatsAppNumber(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "")
  if (!digits) return null
  if (digits.startsWith("92") && digits.length >= 11) return digits
  if (digits.startsWith("0") && digits.length >= 10) return "92" + digits.slice(1)
  if (digits.startsWith("3") && digits.length === 10) return "92" + digits
  return digits.length >= 10 ? digits : null
}

export function whatsAppLink(phone: string | null | undefined, message: string): string | null {
  const number = toWhatsAppNumber(phone)
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : null
}
