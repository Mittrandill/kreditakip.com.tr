import { type NextRequest, NextResponse } from "next/server"
import { IyzipaySubscriptionClient } from "@/lib/iyzipay-client"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

/**
 * PCI-DSS UYUMLU: Checkout Form Callback Handler
 * Kullanıcı ödemeyi tamamladıktan sonra Iyzico buraya yönlendirir
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[checkout-callback] Payment callback received")

    const body = await request.formData()
    const token = body.get("token") as string

    if (!token) {
      console.error("[checkout-callback] No token in callback")
      return NextResponse.redirect(new URL("/uygulama/ayarlar?payment=failed&reason=no_token", request.url))
    }

    console.log("[checkout-callback] Token:", token)

    // Initialize Iyzico client
    const iyzipayClient = new IyzipaySubscriptionClient({
      apiKey: process.env.IYZICO_API_KEY!,
      secretKey: process.env.IYZICO_SECRET_KEY!,
      uri: process.env.IYZICO_BASE_URL!,
    })

    // Retrieve payment result from Iyzico
    const result = await iyzipayClient.retrieveCheckoutFormResult(token)

    console.log("[checkout-callback] Payment result:", {
      status: result.status,
      paymentStatus: result.paymentStatus,
      paymentId: result.paymentId,
      fraudStatus: result.fraudStatus,
    })

    if (result.status !== "success" || result.paymentStatus !== "SUCCESS") {
      console.error("[checkout-callback] Payment failed:", result.errorMessage)
      return NextResponse.redirect(
        new URL(
          `/uygulama/ayarlar?payment=failed&reason=${encodeURIComponent(result.errorMessage || "unknown")}`,
          request.url,
        ),
      )
    }

    // Payment successful - create subscription
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get pending payment info
    const { data: pendingPayment } = await supabase
      .from("pending_payments")
      .select("*")
      .eq("token", token)
      .single()

    if (!pendingPayment) {
      console.error("[checkout-callback] Pending payment not found")
      return NextResponse.redirect(new URL("/uygulama/ayarlar?payment=failed&reason=payment_not_found", request.url))
    }

    const userId = pendingPayment.user_id
    const planId = pendingPayment.plan_id

    console.log("[checkout-callback] Creating subscription for user:", userId)

    // Get plan details
    const { data: plan } = await supabase.from("subscription_plans").select("*").eq("id", planId).single()

    if (!plan) {
      console.error("[checkout-callback] Plan not found")
      return NextResponse.redirect(new URL("/uygulama/ayarlar?payment=failed&reason=plan_not_found", request.url))
    }

    // Calculate expiry date
    const startDate = new Date()
    const expiresAt = new Date(startDate)

    if (plan.billing_interval === "yearly") {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1)
    }

    // Create subscription
    const { error: subError } = await supabase.from("subscriptions").insert({
      user_id: userId,
      plan_id: planId,
      plan_type: "premium",
      status: "active",
      start_date: startDate.toISOString(),
      expires_at: expiresAt.toISOString(),
      payment_method: "iyzico_checkout",
      iyzico_payment_id: result.paymentId,
      iyzico_subscription_reference: result.paymentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (subError) {
      console.error("[checkout-callback] Subscription creation failed:", subError)
      return NextResponse.redirect(new URL("/uygulama/ayarlar?payment=failed&reason=subscription_error", request.url))
    }

    // Update usage limits
    const premiumLimit = plan.billing_interval === "yearly" ? 9999999 : 999999

    const { error: usageError } = await supabase
      .from("usage_tracking")
      .upsert(
        {
          user_id: userId,
          feature_type: "ocr_analysis",
          limit_count: premiumLimit,
          used_count: 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,feature_type" },
      )

    if (usageError) {
      console.error("[checkout-callback] Usage update failed:", usageError)
      // Don't fail - subscription is created
    }

    // Mark pending payment as completed
    await supabase
      .from("pending_payments")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("token", token)

    console.log("[checkout-callback] Subscription created successfully")
    console.log("[checkout-callback] Redirecting to success page")

    // Redirect to success page
    return NextResponse.redirect(new URL("/uygulama/ayarlar?payment=success", request.url))
  } catch (error: any) {
    console.error("[checkout-callback] Callback error:", error)
    return NextResponse.redirect(
      new URL(`/uygulama/ayarlar?payment=failed&reason=${encodeURIComponent(error.message)}`, request.url),
    )
  }
}

/**
 * GET handler for testing
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 })
  }

  // Same logic as POST but from query parameter
  return POST(request)
}
