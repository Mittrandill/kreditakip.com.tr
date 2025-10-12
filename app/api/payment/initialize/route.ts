import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { iyzicoClient } from "@/lib/iyzico"

export async function POST() {
  try {
    const supabase = await createServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Create payment request
    const paymentRequest = iyzicoClient.createPremiumSubscriptionRequest(
      user.id,
      profile.email || user.email || "",
      profile.first_name || "Kullanıcı",
      profile.last_name || "Adı",
    )

    // Initialize payment with iyzico
    const paymentResponse = await iyzicoClient.initializeCheckoutForm(paymentRequest)

    if (paymentResponse.status !== "success") {
      console.error("[v0] iyzico initialization failed:", paymentResponse)
      return NextResponse.json(
        { error: paymentResponse.errorMessage || "Payment initialization failed" },
        { status: 400 },
      )
    }

    // Create payment transaction record
    const { error: transactionError } = await supabase.from("payment_transactions").insert({
      user_id: user.id,
      amount: 199.0,
      currency: "TRY",
      status: "pending",
      iyzico_conversation_id: paymentRequest.conversationId,
    })

    if (transactionError) {
      console.error("[v0] Transaction record error:", transactionError)
    }

    return NextResponse.json({
      token: paymentResponse.token,
      checkoutFormContent: paymentResponse.checkoutFormContent,
      paymentPageUrl: paymentResponse.paymentPageUrl,
    })
  } catch (error) {
    console.error("[v0] Payment initialization error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
