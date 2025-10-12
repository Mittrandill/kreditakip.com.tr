import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { iyzicoClient } from "@/lib/iyzico"

export async function POST() {
  try {
    console.log("[v0] Payment initialization started")

    const supabase = await createServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[v0] Auth error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] User authenticated:", user.id)

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("[v0] Profile error:", profileError)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    console.log("[v0] Profile loaded for:", profile.email)

    if (!process.env.IYZICO_API_KEY || !process.env.IYZICO_SECRET_KEY) {
      console.error("[v0] iyzico credentials missing")
      return NextResponse.json(
        {
          error:
            "Payment system not configured. Please add IYZICO_API_KEY and IYZICO_SECRET_KEY environment variables.",
        },
        { status: 500 },
      )
    }

    // Create payment request
    const paymentRequest = iyzicoClient.createPremiumSubscriptionRequest(
      user.id,
      profile.email || user.email || "",
      profile.first_name || "Kullanıcı",
      profile.last_name || "Adı",
    )

    console.log("[v0] Payment request created")

    // Initialize payment with iyzico
    const paymentResponse = await iyzicoClient.initializeCheckoutForm(paymentRequest)

    if (paymentResponse.status !== "success") {
      console.error("[v0] iyzico initialization failed:", paymentResponse)
      return NextResponse.json(
        { error: paymentResponse.errorMessage || "Payment initialization failed" },
        { status: 400 },
      )
    }

    console.log("[v0] Payment initialized successfully")

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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
