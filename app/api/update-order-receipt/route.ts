import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/supabase/admin-client"

export async function POST(request: NextRequest) {
  try {
    const { orderId, receiptUrl } = await request.json()

    if (!orderId || !receiptUrl) {
      return NextResponse.json(
        { error: "Order ID and receipt URL are required" },
        { status: 400 }
      )
    }

    // Update the order with receipt URL and upload timestamp
    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({
        receipt_url: receiptUrl,
        receipt_uploaded_at: new Date().toISOString()
        // Note: payment_status should stay 'pending' as per requirements
      })
      .eq("id", orderId)
      .select()

    if (error) {
      console.error("Error updating order with receipt:", error)
      return NextResponse.json(
        { error: "Failed to update order" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      order: data[0]
    })

  } catch (error) {
    console.error("Error in update-order-receipt:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}