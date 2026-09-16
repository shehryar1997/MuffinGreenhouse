import { NextResponse } from "next/server"

export async function GET() {
  const password = process.env.ADMIN_PASSWORD
  return NextResponse.json({
    isSet: !!password,
    length: password?.length ?? 0,
    firstChar: password ? password[0] : null,
    lastChar: password ? password[password.length - 1] : null,
  })
}
