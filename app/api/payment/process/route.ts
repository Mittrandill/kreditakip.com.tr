import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  console.log("[v0] Payment process started")

  try {
    const body = await request.json()
    const { userId, billingInfo } = body

    console.log("[v0] Processing payment for user:", userId)

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify user exists
    const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (profileError || !profile) {
      console.error("[v0] Profile not found:", profileError)
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 })
    }

    console.log("[v0] Profile verified:", profile.email)

    // Save billing information first
    if (billingInfo) {
      console.log("[v0] Saving billing information")
      const { error: billingError } = await supabase.from("billing_info").upsert(
        {
          user_id: userId,
          full_name: billingInfo.fullName,
          email: billingInfo.email,
          phone: billingInfo.phone,
          address: billingInfo.address,
          city: billingInfo.city,
          postal_code: billingInfo.zipCode,
          country: "Türkiye",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      )

      if (billingError) {
        console.error("[v0] Billing info save error:", billingError)
        return NextResponse.json({ error: "Fatura bilgileri kaydedilemedi: " + billingError.message }, { status: 500 })
      }
      console.log("[v0] Billing information saved successfully")
    }

    // Check iyzico credentials
    if (!process.env.IYZICO_API_KEY || !process.env.IYZICO_SECRET_KEY || !process.env.IYZICO_BASE_URL) {
      console.error("[v0] iyzico credentials missing")
      return NextResponse.json(
        {
          error: "Ödeme sistemi yapılandırılmamış",
        },
        { status: 500 },
      )
    }

    // Initialize iyzico payment
    const { iyzicoClient } = await import("@/lib/iyzico")

    const paymentRequest = iyzicoClient.createPremiumSubscriptionRequest(
      userId,
      billingInfo?.email || profile.email || "",
      billingInfo?.fullName?.split(" ")[0] || profile.first_name || "Kullanıcı",
      billingInfo?.fullName?.split(" ").slice(1).join(" ") || profile.last_name || "Adı",
    )

    console.log("[v0] Initializing iyzico payment")

    let paymentResponse
    try {
      paymentResponse = await iyzicoClient.initializeCheckoutForm(paymentRequest)
      console.log("[v0] iyzico response:", {
        status: paymentResponse.status,
        hasToken: !!paymentResponse.token,
      })
    } catch (iyzicoError) {
      console.error("[v0] iyzico API error:", iyzicoError)
      return NextResponse.json(
        {
          error: "Ödeme sistemi ile bağlantı kurulamadı",
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

    // Create payment transaction record
    const { error: transactionError } = await supabase.from("payment_transactions").insert({
      user_id: userId,
      amount: 199.0,
      currency: "TRY",
      status: "pending",
      payment_method: "credit_card",
      iyzico_conversation_id: paymentRequest.conversationId,
    })

    if (transactionError) {
      console.error("[v0] Transaction record error:", transactionError)
    }

    console.log("[v0] Payment initialized successfully")

    return NextResponse.json({
      success: true,
      token: paymentResponse.token,
      checkoutFormContent: paymentResponse.checkoutFormContent,
      paymentPageUrl: paymentResponse.paymentPageUrl,
    })
  } catch (error) {
    console.error("[v0] Payment process error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ödeme işlemi başarısız" },
      { status: 500 },
    )
  }
}
