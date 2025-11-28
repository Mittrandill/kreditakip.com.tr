import { type NextRequest, NextResponse } from "next/server"
import { PayTRClient } from "@/lib/paytr-client"
import { createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { rateLimit, getClientIp, RateLimits } from "@/lib/rate-limit"
import { getSecurityContext, getUserAgent } from "@/lib/security-utils"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * PayTR Direct API - Token Generation Endpoint
 *
 * GÜVENLIK ÖNEMLİ:
 * - Bu endpoint SADECE token ve form data oluşturur
 * - Kart bilgileri ASLA bu endpoint'e gönderilmez
 * - Kart bilgileri client-side'dan DOĞRUDAN PayTR'ye POST edilir
 * - PCI DSS uyumluluğu için kart bilgileri sunucumuza asla ulaşmaz
 *
 * KART SAKLAMA (CAPI) AKIŞI:
 * 1. İlk ödeme: store_card=1 + non_3d=0 (3D Secure) gönderilir
 * 2. Callback: PayTR'den sadece utoken döner
 * 3. CAPI LIST: utoken ile /capi/list çağrılır → ctoken alınır
 * 4. Database: utoken + ctoken + kart bilgileri kaydedilir
 * 5. Yenileme: utoken + ctoken + non_3d=1 ile recurring payment
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent card testing attacks
    const ip = getClientIp(request.headers)
    const rateLimitResult = rateLimit({
      identifier: `payment-direct:${ip}`,
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
    const { planId, billingInfo, installmentCount = 0, securityContext } = body
    // Note: storeCard removed - no longer storing cards, using manual reminders instead

    // Capture security context from request
    const requestSecurityContext = getSecurityContext(request)
    const deviceFingerprint = securityContext?.deviceFingerprint || ""
    const browserInfo = securityContext?.browserInfo || {}

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
      console.error("[direct-payment] Plan not found:", planError)
      return NextResponse.json({ error: "Invalid plan" }, { status: 404 })
    }

    // PayTR credentials check
    if (!process.env.PAYTR_MERCHANT_ID || !process.env.PAYTR_MERCHANT_KEY || !process.env.PAYTR_MERCHANT_SALT) {
      console.error("[direct-payment] Missing PayTR credentials")
      return NextResponse.json({ error: "Payment system not configured" }, { status: 500 })
    }

    // Initialize PayTR client
    const paytrClient = new PayTRClient()

    // Generate unique order ID (alphanumeric only, no special characters)
    const orderId = `SUB${user.id.replace(/-/g, "").substring(0, 20)}${Date.now()}`

    // Build callback URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`
    const successUrl = `${baseUrl}/api/subscription/checkout/callback?merchant_oid=${orderId}`
    const failUrl = `${baseUrl}/api/subscription/checkout/callback?merchant_oid=${orderId}&status=failed`

    // Get user IP
    const userIp = ip || "85.34.78.112" // Fallback IP

    // Create Direct API token
    // NOT: İlk ödeme 3D Secure ile yapılır (non_3d=0)
    const { token, formData } = await paytrClient.createDirectPaymentToken(
      orderId,
      plan.price,
      billingInfo,
      userIp,
      {
        testMode: process.env.PAYTR_TEST_MODE === "1",
        installmentCount: installmentCount || 0,
        currency: (plan.currency as "TL" | "EUR" | "USD" | "GBP") || "TL",
      }
    )

    // Add merchant URLs to form data
    formData.merchant_ok_url = successUrl
    formData.merchant_fail_url = failUrl

    // Save pending subscription record
    const { error: insertError } = await supabaseAdmin.from("pending_subscriptions").insert({
      user_id: user.id,
      plan_id: planId,
      token: token,
      conversation_id: orderId,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error("[direct-payment] Failed to save pending subscription:", insertError)
      // Continue anyway - subscription can still succeed
    }

    // Save billing info for future use
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
      console.error("[direct-payment] Failed to save billing info:", billingError)
      // Don't fail - subscription is more important
    }

    // REMOVED: Card storage functionality
    // System now uses manual payment reminders instead of recurring payments

    // Return form data for client-side POST
    // Client-side kart bilgilerini ekleyip PayTR'ye POST edecek
    return NextResponse.json({
      success: true,
      token: token,
      orderId: orderId,
      formData: formData,
      paytrUrl: "https://www.paytr.com/odeme", // Client-side POST endpoint
    })
  } catch (error: any) {
    console.error("[direct-payment] Initialization error:", error)
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 },
    )
  }
}
