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
            "Ödeme sistemi yapılandırılmamış. Lütfen IYZICO_API_KEY ve IYZICO_SECRET_KEY environment variable'larını ekleyin.",
        },
        { status: 500 },
      )
    }

    // Create payment request
    let paymentRequest
    try {
      paymentRequest = iyzicoClient.createPremiumSubscriptionRequest(
        user.id,
        profile.email || user.email || "",
        profile.first_name || "Kullanıcı",
        profile.last_name || "Adı",
      )

      console.log("[v0] Payment request created:", {
        conversationId: paymentRequest.conversationId,
        price: paymentRequest.price,
      })
    } catch (requestError) {
      console.error("[v0] Payment request creation error:", requestError)
      return NextResponse.json(
        {
          error: requestError instanceof Error ? requestError.message : "Ödeme isteği oluşturulamadı",
        },
        { status: 500 },
      )
    }

    let paymentResponse
    try {
      paymentResponse = await iyzicoClient.initializeCheckoutForm(paymentRequest)
      console.log("[v0] iyzico response:", {
        status: paymentResponse.status,
        hasToken: !!paymentResponse.token,
        hasUrl: !!paymentResponse.paymentPageUrl,
      })
    } catch (iyzicoError) {
      console.error("[v0] iyzico API error:", iyzicoError)
      return NextResponse.json(
        {
          error:
            iyzicoError instanceof Error
              ? iyzicoError.message
              : "iyzico ödeme sistemi ile bağlantı kurulamadı. Lütfen daha sonra tekrar deneyin.",
        },
        { status: 500 },
      )
    }

    if (paymentResponse.status !== "success") {
      console.error("[v0] iyzico initialization failed:", {
        status: paymentResponse.status,
        errorCode: paymentResponse.errorCode,
        errorMessage: paymentResponse.errorMessage,
      })
      return NextResponse.json(
        {
          error: paymentResponse.errorMessage || "Ödeme başlatılamadı. Lütfen bilgilerinizi kontrol edin.",
        },
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
    console.error("[v0] Payment initialization error (top-level catch):", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Ödeme işlemi başlatılırken bir hata oluştu",
      },
      { status: 500 },
    )
  }
}
