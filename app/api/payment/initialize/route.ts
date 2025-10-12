import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { iyzicoClient } from "@/lib/iyzico"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Create payment with iyzico
    const paymentResponse = await iyzicoClient.createSubscriptionPayment(
      user.id,
      profile.email || user.email || "",
      profile.first_name || "Kullanıcı",
      profile.last_name || "Adı",
    )

    if (paymentResponse.status !== "success") {
      return NextResponse.json(
        {
          error: paymentResponse.errorMessage || "Payment initialization failed",
        },
        { status: 400 },
      )
    }

    // Save transaction to database
    await supabase.from("payment_transactions").insert({
      user_id: user.id,
      amount: 199.0,
      currency: "TRY",
      status: "pending",
      iyzico_payment_id: paymentResponse.paymentId,
      iyzico_conversation_id: paymentResponse.conversationId,
    })

    return NextResponse.json({
      success: true,
      checkoutFormContent: paymentResponse.checkoutFormContent,
      token: paymentResponse.token,
      tokenExpireTime: paymentResponse.tokenExpireTime,
    })
  } catch (error) {
    console.error("Payment initialization error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
