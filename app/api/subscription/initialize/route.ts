import { type NextRequest, NextResponse } from "next/server"
import { IyzicoSubscriptionService } from "@/lib/iyzico-subscription"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Subscription initialize API called")

    // Request body'yi al
    const body = await request.json()
    const { userId, billingInfo, cardInfo } = body

    if (!userId) {
      console.error("[v0] User ID missing from request")
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    console.log("[v0] Processing subscription for user:", userId)

    // Kullanıcının var olduğunu doğrula
    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.from("users").select("id").eq("id", userId).single()

    if (userError || !userData) {
      console.error("[v0] User not found:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("[v0] Billing info received:", {
      ...billingInfo,
      taxNumber: billingInfo.taxNumber ? "****" : undefined,
    })

    // Environment variables kontrolü
    const apiKey = process.env.IYZICO_API_KEY
    const secretKey = process.env.IYZICO_SECRET_KEY
    const uri = process.env.IYZICO_BASE_URL
    const productReferenceCode = process.env.IYZICO_PRODUCT_REFERENCE_CODE
    const planReferenceCode = process.env.IYZICO_PLAN_REFERENCE_CODE

    if (!apiKey || !secretKey || !uri) {
      console.error("[v0] Missing iyzico credentials")
      return NextResponse.json({ error: "iyzico credentials not configured" }, { status: 500 })
    }

    if (!productReferenceCode || !planReferenceCode) {
      console.error("[v0] Missing product or plan reference codes")
      return NextResponse.json(
        {
          error:
            "Product or plan reference codes not configured. Please set IYZICO_PRODUCT_REFERENCE_CODE and IYZICO_PLAN_REFERENCE_CODE environment variables.",
        },
        { status: 500 },
      )
    }

    // Fatura bilgilerini kaydet
    console.log("[v0] Saving billing info to database")
    const { error: billingError } = await supabase.from("billing_info").upsert({
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
    })

    if (billingError) {
      console.error("[v0] Error saving billing info:", billingError)
      return NextResponse.json({ error: "Failed to save billing information" }, { status: 500 })
    }

    console.log("[v0] Billing info saved successfully")

    // iyzico abonelik servisini başlat
    const iyzicoService = new IyzicoSubscriptionService({
      apiKey,
      secretKey,
      uri,
    })

    // Aboneliği başlat
    console.log("[v0] Initializing iyzico subscription")
    const result = await iyzicoService.initializeSubscription(
      productReferenceCode,
      planReferenceCode,
      {
        ...billingInfo,
        identityNumber: billingInfo.taxNumber || "11111111111", // TC Kimlik No (11 haneli)
      },
      cardInfo,
    )

    console.log("[v0] Subscription result:", result)

    if (result.status === "success") {
      // Abonelik başarılı, kullanıcıyı premium yap
      const subscriptionReferenceCode = result.subscriptionReferenceCode

      console.log("[v0] Updating user subscription status")
      const { error: updateError } = await supabase.from("subscriptions").upsert({
        user_id: userId,
        plan_type: "premium",
        status: "active",
        iyzico_subscription_reference: subscriptionReferenceCode,
        start_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (updateError) {
        console.error("[v0] Error updating subscription:", updateError)
        return NextResponse.json({ error: "Failed to update subscription status" }, { status: 500 })
      }

      console.log("[v0] Subscription activated successfully")

      return NextResponse.json({
        success: true,
        subscriptionReferenceCode,
        message: "Abonelik başarıyla başlatıldı",
      })
    } else {
      console.error("[v0] iyzico subscription failed:", result)
      return NextResponse.json(
        {
          error: result.errorMessage || "Ödeme işlemi başarısız oldu",
        },
        { status: 400 },
      )
    }
  } catch (error: any) {
    console.error("[v0] Subscription API error:", error)
    return NextResponse.json(
      {
        error: error.message || "Bir hata oluştu",
      },
      { status: 500 },
    )
  }
}
