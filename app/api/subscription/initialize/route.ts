import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export const runtime = "nodejs"

/**
 * ⚠️ DEPRECATED - PCI-DSS VIOLATION
 * This endpoint is deprecated due to PCI-DSS compliance issues.
 * Use /api/payment/checkout/initialize instead.
 *
 * Reason: Accepts credit card data (cardInfo) directly on the server.
 * Migration: See docs/PCI-DSS-CHECKOUT-IMPLEMENTATION.md
 */
export async function POST(request: NextRequest) {
  console.error("[DEPRECATED] Subscription initialize endpoint called - PCI-DSS violation!")
  console.error("[DEPRECATED] This endpoint accepts card data directly - use /api/payment/checkout/initialize")

  return NextResponse.json(
    {
      error: "This endpoint is deprecated and disabled for security reasons",
      deprecated: true,
      reason: "PCI-DSS compliance violation - card data (cardInfo) must not be sent to server",
      migration: {
        newEndpoint: "/api/payment/checkout/initialize",
        documentation: "/docs/PCI-DSS-CHECKOUT-IMPLEMENTATION.md",
        changes: "Remove cardInfo from request, use billing info only",
      },
      action: "Update frontend to use PCI-DSS compliant checkout flow",
    },
    { status: 410 }, // 410 Gone
  )

  /* DISABLED CODE - PCI-DSS VIOLATION
  try {

    const body = await request.json()
    const { userId, billingInfo, cardInfo, planId } = body

    if (!userId) {
      console.error("[iyzipay] User ID missing from request")
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Plan bilgisini belirle
    const isYearly = planId === "premium-yearly"
    const price = isYearly ? "1990.00" : "199.00"
    const daysToAdd = isYearly ? 365 : 30



    const supabase = createServiceRoleClient()

      ...billingInfo,
      taxNumber: billingInfo.taxNumber ? "****" : undefined,
    })

    // Environment variables kontrolü
    const apiKey = process.env.IYZICO_API_KEY
    const secretKey = process.env.IYZICO_SECRET_KEY
    const uri = process.env.IYZICO_BASE_URL

    if (!apiKey || !secretKey || !uri) {
      console.error("[iyzipay] Missing iyzico credentials")
      return NextResponse.json({ error: "iyzico credentials not configured" }, { status: 500 })
    }

    // Fatura bilgilerini kaydet
    const { error: billingError } = await supabase.from("billing_info").upsert(
      {
        user_id: userId,
        full_name: billingInfo.fullName,
        email: billingInfo.email,
        phone: billingInfo.phone,
        address: billingInfo.address,
        city: billingInfo.city,
        district: billingInfo.district,
        postal_code: billingInfo.zipCode,
        country: "Turkey",
        tax_number: billingInfo.taxNumber,
        tax_office: billingInfo.taxOffice,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )

    if (billingError) {
      console.error("[iyzipay] Error saving billing info:", billingError)
      return NextResponse.json({ error: "Failed to save billing information" }, { status: 500 })
    }


    const iyzicoClient = new IyzipaySubscriptionClient({
      apiKey,
      secretKey,
      uri,
    })

    // Normal payment API kullan (subscription API yerine)
    const result = await iyzicoClient.createPayment(
      userId,
      {
        ...billingInfo,
        identityNumber: billingInfo.taxNumber || "11111111111",
      },
      cardInfo,
      price,
    )


    if (result.status === "success") {
      const paymentId = result.paymentId


      // Subscription kaydı oluştur
      const startDate = new Date()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + daysToAdd) // Plan'a göre gün ekle

      const { data: subscriptionData, error: updateError } = await supabase
        .from("subscriptions")
        .upsert({
          user_id: userId,
          plan_type: "premium",
          plan_id: planId, // premium-monthly veya premium-yearly
          status: "active",
          start_date: startDate.toISOString(),
          expires_at: expiresAt.toISOString(),
          payment_method: "iyzico",
          iyzico_subscription_id: paymentId, // Normal payment API için payment ID
          iyzico_subscription_reference: paymentId, // İptal için gerekli
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (updateError) {
        console.error("[iyzipay] Error updating subscription:", updateError)
        return NextResponse.json({ error: "Failed to update subscription status" }, { status: 500 })
      }

      // Payment transaction kaydı oluştur
      const { error: paymentError } = await supabase.from("payment_transactions").insert({
        user_id: userId,
        subscription_id: subscriptionData?.id,
        amount: parseFloat(price),
        currency: "TRY",
        status: "completed",
        iyzico_payment_id: paymentId,
        iyzico_conversation_id: `sub_${userId}_${Date.now()}`,
        payment_method: "iyzico",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (paymentError) {
        console.error("[iyzipay] Error creating payment transaction:", paymentError)
        // Payment transaction hatası kritik değil, devam edebiliriz
      }

      // Usage limits'i premium'a yükselt
      await supabase
        .from("usage_tracking")
        .update({
          limit_count: 999999,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)


      return NextResponse.json({
        success: true,
        paymentId,
        expiresAt: expiresAt.toISOString(),
        message: "Premium üyeliğiniz başarıyla aktif edildi",
      })
    } else {
      console.error("[iyzipay] Payment failed:", result)

      // Başarısız ödeme kaydı oluştur
      const { error: failedPaymentError } = await supabase.from("payment_transactions").insert({
        user_id: userId,
        subscription_id: null,
        amount: parseFloat(price),
        currency: "TRY",
        status: "failed",
        iyzico_payment_id: null,
        iyzico_conversation_id: `sub_${userId}_${Date.now()}`,
        payment_method: "iyzico",
        error_message: result.errorMessage || "Ödeme işlemi başarısız oldu",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (failedPaymentError) {
        console.error("[iyzipay] Error creating failed payment transaction:", failedPaymentError)
      }

      return NextResponse.json(
        {
          error: result.errorMessage || "Ödeme işlemi başarısız oldu",
        },
        { status: 400 },
      )
    }
  } catch (error: any) {
    console.error("[iyzipay] Subscription API error:", error)
    return NextResponse.json(
      {
        error: error.message || "Bir hata oluştu",
      },
      { status: 500 },
    )
  }
  */
}
