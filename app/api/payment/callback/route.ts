import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { iyzicoClient } from "@/lib/iyzico"
import { upgradeToPremium } from "@/lib/api/subscriptions"

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    // Retrieve payment details from iyzico
    const paymentResult = await iyzicoClient.retrieveCheckoutForm(token)

    if (paymentResult.status !== "success" || paymentResult.paymentStatus !== "SUCCESS") {
      // Update transaction as failed
      const supabase = await createClient()
      await supabase
        .from("payment_transactions")
        .update({
          status: "failed",
          error_message: paymentResult.errorMessage,
        })
        .eq("iyzico_payment_id", paymentResult.paymentId)

      return NextResponse.json(
        {
          success: false,
          error: paymentResult.errorMessage || "Payment failed",
        },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    // Get transaction
    const { data: transaction } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("iyzico_payment_id", paymentResult.paymentId)
      .single()

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Update transaction as completed
    await supabase
      .from("payment_transactions")
      .update({
        status: "completed",
        payment_method: "iyzico",
      })
      .eq("id", transaction.id)

    // Upgrade user to premium
    await upgradeToPremium(transaction.user_id, paymentResult.paymentId, "iyzico")

    return NextResponse.json({
      success: true,
      message: "Payment completed successfully",
    })
  } catch (error) {
    console.error("Payment callback error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
