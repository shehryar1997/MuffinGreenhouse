// Pieces every customer e-mail shares: sender, sign-off and the "need help?" line.
import { siteConfig } from "@/config/nav.config"

export const FROM_EMAIL = "Muffin Plants <support@muffinplants.com>"

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.muffinplants.com").replace(/\/$/, "")

export const SHOP_URL = `${SITE_URL}/shop/all`
export const ASK_MUFFIN_URL = `${SITE_URL}/muffin`
export const WHATSAPP_NUMBER = siteConfig.whatsappNumber

export function formatEmailPrice(price: number): string {
  return "PKR " + Number(price).toLocaleString("en-PK")
}

/** Closing lines used by every e-mail: where to get help, then the team sign-off. */
export function emailSignOff(): string {
  return [
    `Have a question? Ask Muffin on our website (${ASK_MUFFIN_URL}) or reach our team on WhatsApp at ${WHATSAPP_NUMBER}.`,
    "",
    "— The Muffin Plants Team",
  ].join("\n")
}

/** Returns a tracking URL for common Pakistan couriers. */
export function getCourierTrackingUrl(courier: string, trackingNumber: string): string {
  const lower = courier.toLowerCase()
  if (lower.includes("leopard")) return `https://track.codcallcourier.com/tracking/?tracking_numbers=${encodeURIComponent(trackingNumber)}`
  if (lower.includes("trax")) return `https://trax.pk/track/${encodeURIComponent(trackingNumber)}`
  if (lower.includes("tcs")) return `https://www.tcsexpress.com/track/${encodeURIComponent(trackingNumber)}`
  if (lower.includes("dhl")) return `https://www.dhl.com/pk-en/home/tracking/tracking-parcel.html?submit=1&tracking-id=${encodeURIComponent(trackingNumber)}`
  // Generic fallback - ponytail: one day add more couriers; logging helps find them
  return `https://www.google.com/search?q=${encodeURIComponent(courier + " " + trackingNumber)}`
}

interface EmailTemplateData {
  heading: string
  previewText?: string
  sections: Array<{ title?: string; content: string }>
  primaryButton?: { text: string; url: string }
}

/** Branded HTML email template with Muffin Plants styling. */
export function renderEmailTemplate(data: EmailTemplateData): string {
  const logoUrl = `${SITE_URL}/logo-email.png` // ponytail: fallback works if logo missing; images-off shows alt text
  const supportEmail = "support@muffinplants.com"

  const sectionsHtml = data.sections
    .map(
      (s) => `
    <tr>
      <td style="padding:16px 24px;">
        ${s.title ? `<h2 style="margin:0 0 12px;font-size:18px;line-height:1.3;color:#1a1a1a;font-weight:600;">${escapeHtml(s.title)}</h2>` : ""}
        <div style="margin:0;font-size:16px;line-height:1.5;color:#333;">${s.content}</div>
      </td>
    </tr>`
    )
    .join("")

  const buttonHtml = data.primaryButton
    ? `
    <tr>
      <td style="padding:8px 24px 24px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="text-align:center;">
              <a href="${data.primaryButton.url}" style="display:inline-block;padding:14px 28px;background:#166534;color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;">${escapeHtml(data.primaryButton.text)}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
    : ""

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.heading)}</title>
  ${data.previewText ? `<meta name="description" content="${escapeHtml(data.previewText)}">` : ""}
</head>
<body style="margin:0;padding:0;background:#f6fdf8;color:#1a1a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6fdf8;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);max-width:600px;width:100%;">
          <!-- Logo -->
          <tr>
            <td style="padding:32px 24px 16px;text-align:center;border-bottom:1px solid #e7f5eb;">
              <img src="${logoUrl}" alt="Muffin Plants" width="160" style="display:block;margin:0 auto;" onerror="this.style.display='none'">
              <div style="font-size:20px;font-weight:700;color:#166534;margin-top:8px;">Muffin Plants</div>
            </td>
          </tr>
          <!-- Heading -->
          <tr>
            <td style="padding:24px 24px 8px;">
              <h1 style="margin:0;font-size:22px;line-height:1.3;color:#166534;font-weight:600;">${escapeHtml(data.heading)}</h1>
            </td>
          </tr>
          <!-- Content Sections -->
          ${sectionsHtml}
          ${buttonHtml}
          <!-- Footer -->
          <tr>
            <td style="padding:24px;background:#f0fdf4;text-align:center;border-top:1px solid #e7f5eb;">
              <p style="margin:0 0 8px;font-size:14px;color:#333;line-height:1.5;">
                Need help? Email us at <a href="mailto:${supportEmail}" style="color:#166534;text-decoration:underline;">${supportEmail}</a>
              </p>
              <p style="margin:16px 0 0;font-size:13px;color:#666;line-height:1.4;">
                — The Muffin Plants Team
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/** Escape HTML special characters for safe email rendering. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
