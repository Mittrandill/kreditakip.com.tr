import { type NextRequest, NextResponse } from "next/server"
import { PayTRClient } from "@/lib/paytr-client"
import { createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { rateLimit, getClientIp, RateLimits } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * PayTR Subscription Checkout Form Başlatma
 * PayTR iframe token oluşturur ve kullanıcıyı güvenli ödeme sayfasına yönlendirir
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent card testing attacks
    const ip = getClientIp(request.headers)
    const rateLimitResult = rateLimit({
      identifier: `payment-init:${ip}`,
      ...RateLimits.PAYMENT_INIT,
    })

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too many payment requests. Please try again later.",
          retryAfter: rateLimitResult.reset,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
            "Retry-After": rateLimitResult.reset.toString(),
          },
        },
      )
    }

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
      !billingInfo.address ||
      !billingInfo.city
    ) {
      return NextResponse.json({ error: "Complete billing information required" }, { status: 400 })
    }

    // Get plan details from database
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

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
      console.error("[subscription-checkout] Plan not found:", planError)
      return NextResponse.json({ error: "Invalid plan" }, { status: 404 })
    }

    // PayTR credentials check
    if (!process.env.PAYTR_MERCHANT_ID || !process.env.PAYTR_MERCHANT_KEY || !process.env.PAYTR_MERCHANT_SALT) {
      console.error("[subscription-checkout] Missing PayTR credentials")
      return NextResponse.json({ error: "Payment system not configured" }, { status: 500 })
    }

    // Initialize PayTR client
    const paytrClient = new PayTRClient()

    // Generate unique order ID (alphanumeric only, no special characters)
    const orderId = `SUB${user.id.replace(/-/g, '')}${Date.now()}`

    // Build callback URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`
    const successUrl = `${baseUrl}/api/subscription/checkout/callback?merchant_oid=${orderId}`
    const failUrl = `${baseUrl}/api/subscription/checkout/callback?merchant_oid=${orderId}&status=failed`

    // Get user IP
    const userIp = ip || "85.34.78.112" // Fallback IP

    // Create PayTR iframe token
    const result = await paytrClient.createIframeToken(
      orderId,
      plan.price,
      billingInfo,
      userIp,
      successUrl,
      failUrl,
      {
        testMode: process.env.PAYTR_TEST_MODE === "1",
        noInstallment: true, // Abonelik için taksit kapalı
        currency: (plan.currency as "TL" | "EUR" | "USD" | "GBP") || "TL",
      },
    )

    if (result.status !== "success" || !result.token) {
      console.error("[subscription-checkout] PayTR token creation failed:", result.reason)
      return NextResponse.json(
        {
          error: result.reason || "Payment initialization failed",
        },
        { status: 400 },
      )
    }

    // Save pending subscription record with billing info
    const { error: insertError } = await supabaseAdmin.from("pending_subscriptions").insert({
      user_id: user.id,
      plan_id: planId,
      token: result.token,
      conversation_id: orderId,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error("[subscription-checkout] Failed to save pending subscription:", insertError)
      // Continue anyway - subscription can still succeed
    }

    // Also save billing info for future use
    const { error: billingError } = await supabaseAdmin
      .from("billing_info")
      .upsert(
        {
          user_id: user.id,
          full_name: billingInfo.fullName,
          email: billingInfo.email,
          phone: billingInfo.phone,
          address: billingInfo.address,
          city: billingInfo.city,
          district: billingInfo.district || null,
          postal_code: billingInfo.zipCode || "",
          country: billingInfo.country || "Türkiye",
          tax_number: billingInfo.taxNumber || null,
          tax_office: billingInfo.taxOffice || null,
          identity_number: billingInfo.identityNumber || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )

    if (billingError) {
      console.error("[subscription-checkout] Failed to save billing info:", billingError)
      // Don't fail - subscription is more important
    }

    // Return PayTR iframe URL
    const iframeUrl = paytrClient.getIframeUrl(result.token)

    return NextResponse.json({
      success: true,
      token: result.token,
      iframeUrl: iframeUrl,
      orderId: orderId,
    })
  } catch (error: any) {
    console.error("[subscription-checkout] Initialization error:", error)
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 },
    )
  }
}
