import { type NextRequest, NextResponse } from "next/server"

/**
 * ⚠️ DEPRECATED - PCI-DSS VIOLATION
 * This endpoint is deprecated due to PCI-DSS compliance issues.
 * Use /api/payment/checkout/initialize instead.
 *
 * Reason: This endpoint accepts credit card data directly on the server,
 * which violates PCI-DSS compliance requirements.
 *
 * Migration: See docs/PCI-DSS-CHECKOUT-IMPLEMENTATION.md
 */
export async function POST(request: NextRequest) {
  console.error("[DEPRECATED] Direct payment endpoint called - this is a PCI-DSS violation!")
  console.error("[DEPRECATED] Migrate to /api/payment/checkout/initialize immediately")

  return NextResponse.json(
    {
      error: "This endpoint is deprecated and disabled for security reasons",
      deprecated: true,
      reason: "PCI-DSS compliance violation - card data must not be sent to server",
      migration: {
        newEndpoint: "/api/payment/checkout/initialize",
        documentation: "/docs/PCI-DSS-CHECKOUT-IMPLEMENTATION.md",
        benefits: [
          "PCI-DSS compliant",
          "No card data on your servers",
          "Zero compliance costs",
          "Iyzico hosted payment page",
        ],
      },
      action: "Please update your frontend to use the new checkout flow",
    },
    { status: 410 }, // 410 Gone - resource permanently removed
  )

  /* DISABLED CODE - PCI-DSS VIOLATION
  try {
    const body = await request.json()
    const { userId, billingInfo, cardDetails } = body

    console.log("[v0] Processing direct payment for user:", userId)

    // Validate required fields
    if (
      !cardDetails ||
      !cardDetails.cardNumber ||
      !cardDetails.cardHolderName ||
      !cardDetails.expiryDate ||
      !cardDetails.cvv
    ) {
      return NextResponse.json({ error: "Kart bilgileri eksik" }, { status: 400 })
    }

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

    // Parse expiry date
    const [expireMonth, expireYear] = cardDetails.expiryDate.split("/").map((s: string) => s.trim())

    // Initialize iyzico payment
    const { iyzicoClient } = await import("@/lib/iyzico")

    const paymentRequest = iyzicoClient.createDirectPaymentRequest(
      userId,
      billingInfo?.email || profile.email || "",
      billingInfo?.fullName?.split(" ")[0] || profile.first_name || "Kullanıcı",
      billingInfo?.fullName?.split(" ").slice(1).join(" ") || profile.last_name || "Adı",
      {
        cardHolderName: cardDetails.cardHolderName,
        cardNumber: cardDetails.cardNumber,
        expireMonth: expireMonth,
        expireYear: expireYear,
        cvc: cardDetails.cvv,
      },
      {
        address: billingInfo.address,
        city: billingInfo.city,
        zipCode: billingInfo.zipCode,
      },
    )

    console.log("[v0] Processing direct payment with iyzico")

    let paymentResponse
    try {
      paymentResponse = await iyzicoClient.createPayment(paymentRequest)
      console.log("[v0] iyzico response:", {
        status: paymentResponse.status,
        paymentId: paymentResponse.paymentId,
      })
    } catch (iyzicoError) {
      console.error("[v0] iyzico API error:", iyzicoError)
      return NextResponse.json(
        {
          error: "Ödeme işlemi başarısız oldu",
        },
        { status: 500 },
      )
    }

    if (paymentResponse.status !== "success") {
      console.error("[v0] iyzico payment failed:", paymentResponse.errorMessage)

      // Create failed transaction record
      await supabase.from("payment_transactions").insert({
        user_id: userId,
        amount: 199.0,
        currency: "TRY",
        status: "failed",
        payment_method: "credit_card",
        iyzico_conversation_id: paymentRequest.conversationId,
        error_message: paymentResponse.errorMessage,
      })

      return NextResponse.json(
        {
          error: paymentResponse.errorMessage || "Ödeme başarısız oldu",
        },
        { status: 400 },
      )
    }

    // Payment successful - update subscription
    console.log("[v0] Payment successful, updating subscription")

    const subscriptionEndDate = new Date()
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1)

    const { error: subscriptionError } = await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        plan_type: "premium",
        plan_id: "premium-monthly",
        status: "active",
        start_date: new Date().toISOString(),
        expires_at: subscriptionEndDate.toISOString(),
        payment_method: "iyzico",
        iyzico_subscription_id: paymentResponse.paymentId,
        iyzico_subscription_reference: paymentResponse.paymentId,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    )

    if (subscriptionError) {
      console.error("[v0] Subscription update error:", subscriptionError)
      return NextResponse.json({ error: "Abonelik güncellenemedi: " + subscriptionError.message }, { status: 500 })
    }

    // Create successful transaction record
    await supabase.from("payment_transactions").insert({
      user_id: userId,
      amount: 199.0,
      currency: "TRY",
      status: "completed",
      payment_method: "credit_card",
      iyzico_conversation_id: paymentRequest.conversationId,
      iyzico_payment_id: paymentResponse.paymentId,
    })

    console.log("[v0] Payment completed successfully")

    return NextResponse.json({
      success: true,
      message: "Ödeme başarıyla tamamlandı",
      paymentId: paymentResponse.paymentId,
    })
  } catch (error) {
    console.error("[v0] Payment process error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ödeme işlemi başarısız" },
      { status: 500 },
    )
  }
  */
}
