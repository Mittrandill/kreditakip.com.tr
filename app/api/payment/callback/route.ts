import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
import { createServerClient } from "@/lib/supabase/server"
import { iyzicoClient } from "@/lib/iyzico"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const token = formData.get("token") as string

    if (!token) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/uygulama/premium?error=no_token`)
    }

    // Retrieve payment details from iyzico
    const paymentResult = await iyzicoClient.retrieveCheckoutForm(token)

    if (paymentResult.status !== "success" || paymentResult.paymentStatus !== "SUCCESS") {
      console.error("[v0] Payment failed:", paymentResult)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/uygulama/premium?error=payment_failed`)
    }

    const supabase = await createServerClient()

    // Get user from conversation ID
    const conversationId = paymentResult.conversationId
    const userId = conversationId.split("_")[1]

    // Update payment transaction
    const { error: transactionError } = await supabase
      .from("payment_transactions")
      .update({
        status: "completed",
        iyzico_payment_id: paymentResult.paymentId,
        updated_at: new Date().toISOString(),
      })
      .eq("iyzico_conversation_id", conversationId)

    if (transactionError) {
      console.error("[v0] Transaction update error:", transactionError)
    }

    // Update or create premium subscription
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 1) // 1 month subscription

    const { error: subscriptionError } = await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        plan_type: "premium",
        status: "active",
        expires_at: expiresAt.toISOString(),
        payment_method: "iyzico",
        iyzico_subscription_id: paymentResult.paymentId,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    )

    if (subscriptionError) {
      console.error("[v0] Subscription update error:", subscriptionError)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/uygulama/premium?error=subscription_failed`)
    }

    // Update usage limits to unlimited for premium
    await supabase
      .from("usage_tracking")
      .update({
        limit_count: 999999,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/uygulama/premium?success=true`)
  } catch (error) {
    console.error("[v0] Payment callback error:", error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/uygulama/premium?error=callback_failed`)
  }
}
