// Bank / wallet details shown to customers on the payment page and in the booking e-mail.
// Single source of truth: change an account here and both places update.

export interface PaymentAccount {
  title: string
  icon: string
  details: Array<{ label: string; value: string }>
}

export const PAYMENT_ACCOUNTS: Record<string, PaymentAccount> = {
  hbl: {
    title: "HBL Bank Transfer",
    icon: "🏦",
    details: [
      { label: "Bank", value: "Habib Bank Limited (HBL)" },
      { label: "Account Title", value: "Muffin Greenhouse" },
      { label: "Account Number", value: "03239533242" },
      { label: "IBAN", value: "PK93HABB0028807901590001" },
    ],
  },
  jazzcash: {
    title: "JazzCash",
    icon: "📱",
    details: [
      { label: "Account Title", value: "Shehryar Ahmad" },
      { label: "Mobile Number", value: "03202065474" },
    ],
  },
  easypaisa: {
    title: "Easypaisa",
    icon: "💳",
    details: [
      { label: "Account Title", value: "Shehryar Ahmad" },
      { label: "Mobile Number", value: "03202065474" },
    ],
  },
}

/** The accounts as plain text, for e-mails. */
export function paymentAccountsAsText(): string {
  return Object.values(PAYMENT_ACCOUNTS)
    .map((account) => [account.title, ...account.details.map((d) => `  ${d.label}: ${d.value}`)].join("\n"))
    .join("\n\n")
}
