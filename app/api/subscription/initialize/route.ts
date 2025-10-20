import { type NextRequest, NextResponse } from "next/server"
import { IyzipaySubscriptionClient } from "@/lib/iyzipay-client"
import { createServiceRoleClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    console.log("[iyzipay] Subscription initialize API called")

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

    console.log("[iyzipay] Selected plan:", { planId, price, daysToAdd })

    console.log("[iyzipay] Processing subscription for user:", userId)

    const supabase = createServiceRoleClient()

    console.log("[iyzipay] Billing info received:", {
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
    console.log("[iyzipay] Saving billing info to database")
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

    console.log("[iyzipay] Billing info saved successfully")

    const iyzicoClient = new IyzipaySubscriptionClient({
      apiKey,
      secretKey,
      uri,
    })

    // Normal payment API kullan (subscription API yerine)
    console.log("[iyzipay] Processing payment with normal payment API")
    const result = await iyzicoClient.createPayment(
      userId,
      {
        ...billingInfo,
        identityNumber: billingInfo.taxNumber || "11111111111",
      },
      cardInfo,
      price,
    )

    console.log("[iyzipay] Payment result:", result)

    if (result.status === "success") {
      const paymentId = result.paymentId

      console.log("[iyzipay] Payment successful, creating subscription record")

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
      console.log("[iyzipay] Creating payment transaction record")
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

      console.log("[iyzipay] Subscription activated successfully")

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
}
