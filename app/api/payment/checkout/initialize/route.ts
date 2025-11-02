import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
import { IyzipaySubscriptionClient } from "@/lib/iyzipay-client"
import { createServerClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

/**
 * PCI-DSS UYUMLU: Checkout Form Başlatma
 * Kart bilgileri sunucuya GELMİYOR - Iyzico'nun güvenli sayfasına yönlendirir
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[checkout] Checkout form initialization requested")

    // Authenticate user
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { planId, billingInfo } = body

    if (!planId || !billingInfo) {
      return NextResponse.json({ error: "Plan ID and billing info required" }, { status: 400 })
    }

    // Validate billing info
    if (
      !billingInfo.fullName ||
      !billingInfo.email ||
      !billingInfo.phone ||
      !billingInfo.identityNumber ||
      !billingInfo.address ||
      !billingInfo.city
    ) {
      return NextResponse.json({ error: "Complete billing information required" }, { status: 400 })
    }

    // Get plan details from database
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!
    const { createClient } = await import("@supabase/supabase-js")

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: plan, error: planError } = await supabaseAdmin
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .eq("is_active", true)
      .single()

    if (planError || !plan) {
      console.error("[checkout] Plan not found:", planError)
      return NextResponse.json({ error: "Invalid plan" }, { status: 404 })
    }

    // Initialize Iyzico client
    const iyzipayClient = new IyzipaySubscriptionClient({
      apiKey: process.env.IYZICO_API_KEY!,
      secretKey: process.env.IYZICO_SECRET_KEY!,
      uri: process.env.IYZICO_BASE_URL!,
    })

    // Build callback URL (production veya development)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`
    const callbackUrl = `${baseUrl}/api/payment/checkout/callback`

    console.log("[checkout] Initializing RECURRING SUBSCRIPTION checkout form")
    console.log("[checkout] Plan:", plan.name)
    console.log("[checkout] Price:", plan.price)
    console.log("[checkout] User:", user.id)
    console.log("[checkout] Callback URL:", callbackUrl)

    // Get pricing plan reference code from environment
    const pricingPlanReferenceCode = process.env.IYZICO_PLAN_REFERENCE_CODE

    if (!pricingPlanReferenceCode) {
      console.error("[checkout] Missing pricing plan reference code")
      return NextResponse.json({ error: "Pricing plan not configured" }, { status: 500 })
    }

    console.log("[checkout] Using pricing plan reference code:", pricingPlanReferenceCode)

    // Initialize RECURRING SUBSCRIPTION checkout form (PCI-DSS compliant - NO card data here!)
    const result = await iyzipayClient.initializeSubscriptionCheckoutForm(
      pricingPlanReferenceCode,
      user.id,
      planId,
      billingInfo,
      callbackUrl,
    )

    if (result.status !== "success") {
      console.error("[checkout] Initialization failed:", result.errorMessage)
      return NextResponse.json(
        {
          error: result.errorMessage || "Payment initialization failed",
          errorCode: result.errorCode,
        },
        { status: 400 },
      )
    }

    // Save both pending_payments and pending_subscriptions for compatibility
    const { error: insertError } = await supabaseAdmin.from("pending_payments").insert({
      user_id: user.id,
      plan_id: planId,
      amount: plan.price,
      currency: plan.currency || "TRY",
      token: result.token,
      conversation_id: result.conversationId,
      status: "pending",
      payment_method: "iyzico_subscription",
      metadata: {
        billingInfo,
      },
      created_at: new Date().toISOString(),
    })

    // Also save to pending_subscriptions
    await supabaseAdmin.from("pending_subscriptions").insert({
      user_id: user.id,
      plan_id: planId,
      token: result.token,
      conversation_id: result.conversationId,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error("[checkout] Failed to save pending payment:", insertError)
      // Continue anyway - payment can still succeed
    }

    console.log("[checkout] Checkout form initialized successfully")
    console.log("[checkout] Token:", result.token)
    console.log("[checkout] Payment page URL:", result.paymentPageUrl)

    // Return checkout form content or payment page URL
    return NextResponse.json({
      success: true,
      token: result.token,
      checkoutFormContent: result.checkoutFormContent, // HTML content to display
      paymentPageUrl: result.paymentPageUrl, // Or redirect URL
      conversationId: result.conversationId,
    })
  } catch (error: any) {
    console.error("[checkout] Initialization error:", error)
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 },
    )
  }
}
