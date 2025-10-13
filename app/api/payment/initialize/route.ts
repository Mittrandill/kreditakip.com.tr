import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: Request) {
  try {
    console.log("[v0] Payment initialization started")

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      console.error("[v0] No user ID provided in request")
      return NextResponse.json({ error: "Kullanıcı bilgisi eksik" }, { status: 400 })
    }

    console.log("[v0] Processing payment for user:", userId)

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (profileError || !profile) {
      console.error("[v0] Profile not found:", profileError)
      return NextResponse.json({ error: "Kullanıcı profili bulunamadı" }, { status: 404 })
    }

    console.log("[v0] Profile loaded for:", profile.email)

    if (!process.env.IYZICO_API_KEY || !process.env.IYZICO_SECRET_KEY || !process.env.IYZICO_BASE_URL) {
      console.error("[v0] iyzico credentials missing")
      return NextResponse.json(
        {
          error: "Ödeme sistemi yapılandırılmamış. Lütfen environment variable'ları kontrol edin.",
        },
        { status: 500 },
      )
    }

    const { iyzicoClient } = await import("@/lib/iyzico")

    // Create payment request
    const paymentRequest = iyzicoClient.createPremiumSubscriptionRequest(
      userId,
      profile.email || "",
      profile.first_name || "Kullanıcı",
      profile.last_name || "Adı",
    )

    console.log("[v0] Payment request created:", {
      conversationId: paymentRequest.conversationId,
      price: paymentRequest.price,
      buyerEmail: paymentRequest.buyer.email,
    })

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
          error: "Ödeme sistemi ile bağlantı kurulamadı. Lütfen daha sonra tekrar deneyin.",
        },
        { status: 500 },
      )
    }

    if (paymentResponse.status !== "success") {
      console.error("[v0] iyzico initialization failed:", paymentResponse.errorMessage)
      return NextResponse.json(
        {
          error: paymentResponse.errorMessage || "Ödeme başlatılamadı",
        },
        { status: 400 },
      )
    }

    console.log("[v0] Payment initialized successfully")

    // Create payment transaction record
    const { error: transactionError } = await supabaseAdmin.from("payment_transactions").insert({
      user_id: userId,
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
      {
        error: error instanceof Error ? error.message : "Ödeme işlemi başlatılırken bir hata oluştu",
      },
      { status: 500 },
    )
  }
}
