import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/supabase/admin-client"

export async function POST(request: NextRequest) {
  try {
    const { orderNumber } = await request.json()

    if (!orderNumber) {
      return NextResponse.json(
        { error: "Order number is required" },
        { status: 400 }
      )
    }

    // Generate a unique path for the receipt
    const path = `${orderNumber}/receipt-${Date.now()}.jpg`

    // Create signed upload URL for the payment-receipts bucket
    const { data, error } = await supabaseAdmin.storage
      .from("payment-receipts")
      .createSignedUploadUrl(path)

    if (error) {
      console.error("Error creating signed upload URL:", error)
      return NextResponse.json(
        { error: "Failed to generate upload URL" },
        { status: 500 }
      )
    }

    // Return the signed URL, token, and path
    // Use type assertion since Supabase types might not be perfect
    const uploadData = data as { signedUrl: string; token: string; path?: string }
    return NextResponse.json({
      signedUrl: uploadData.signedUrl,
      token: uploadData.token,
      path: uploadData.path || path
    })

  } catch (error) {
    console.error("Error in generate-upload-url:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}