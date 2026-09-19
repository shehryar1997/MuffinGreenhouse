import type { Metadata } from "next"
import { ForgotPasswordClient } from "./forgot-password-client"

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your Muffin Greenhouse account password.",
  robots: { index: false, follow: false },
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />
}
