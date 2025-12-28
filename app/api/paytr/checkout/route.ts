import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { PayTRClient } from "@/lib/paytr-client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * POST /api/paytr/checkout
 *
 * Creates a PayTR iFrame payment session
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get request body
    const body = await request.json()
    const { planId, userId, userEmail, cardNumber, cardExpiry, cardCvv, cardHolderName } = body

    if (!planId || !userId || !userEmail) {
      return NextResponse.json(
        { error: "Missing required fields: planId, userId, userEmail" },
        { status: 400 }
      )
    }

    // Direkt API requires card details
    if (!cardNumber || !cardExpiry || !cardCvv || !cardHolderName) {
      return NextResponse.json(
        { error: "Missing card details: cardNumber, cardExpiry, cardCvv, cardHolderName" },
        { status: 400 }
      )
    }

    // Get plan details from database
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single()

    if (planError || !plan) {
      console.error("[PayTR Checkout] Plan not found:", planError)
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      )
    }

    // Check if user already has an active subscription
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("id, status, plan_id")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .maybeSingle()

    if (existingSub) {
      console.log("[PayTR Checkout] User already has active subscription:", existingSub)
      // Allow upgrade/downgrade
    }

    // Generate unique order ID (alfanumerik only - PayTR requirement)
    const timestamp = Date.now()
    const userIdShort = userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)
    const orderId = `SUB${timestamp}${userIdShort}`

    // Get user IP
    const userIp =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1"

    // Get app URL for callbacks
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Create PayTR client
    const paytrClient = new PayTRClient()

    // Prepare basket (PayTR requires price in kuruş - multiply by 100)
    const priceInKurus = Math.round(plan.price * 100)

    // Create payment request (Direkt API with card details)
    const paymentRequest = await paytrClient.createPaymentRequest({
      userId,
      planId,
      email: userEmail,
      amount: priceInKurus,
      orderId,
      userIp,
      basket: [
        {
          name: plan.name,
          price: priceInKurus,
          quantity: 1,
        },
      ],
      callbackUrl: `${appUrl}/api/paytr/callback`,
      successUrl: `${appUrl}/api/paytr/success?order_id=${orderId}`,
      failUrl: `${appUrl}/uygulama/premium?payment=failed`,
      // Direkt API card details
      cardNumber,
      cardExpiry,
      cardCvv,
      cardHolderName,
    })

    if (paymentRequest.status !== "success" || !paymentRequest.redirect_url) {
      console.error("[PayTR Checkout] Payment request failed:", paymentRequest.reason)
      return NextResponse.json(
        { error: paymentRequest.reason || "Failed to create payment" },
        { status: 500 }
      )
    }

    // Store pending subscription
    const { error: pendingError } = await supabase
      .from("pending_subscriptions")
      .insert({
        user_id: userId,
        plan_id: planId,
        token: orderId,
        status: "pending",
        metadata: {
          paytr_order_id: orderId,
          amount: plan.price,
          payment_provider: "paytr",
          iframe_token: paymentRequest.token,
        },
      })

    if (pendingError) {
      console.error("[PayTR Checkout] Failed to create pending subscription:", pendingError)
      // Continue anyway - webhook will handle it
    }

    // Return 3D Secure redirect URL (Direkt API)
    return NextResponse.json({
      success: true,
      redirectUrl: paymentRequest.redirect_url,
      orderId,
    })
  } catch (error: any) {
    console.error("[PayTR Checkout] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
