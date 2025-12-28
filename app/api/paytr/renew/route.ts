import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { PayTRClient } from "@/lib/paytr-client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * POST /api/paytr/renew
 *
 * Creates a PayTR iFrame payment session for subscription renewal
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
    const { userId, userEmail } = body

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: "Missing required fields: userId, userEmail" },
        { status: 400 }
      )
    }

    // Get current PayTR subscription
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select(`
        *,
        subscription_plans(*)
      `)
      .eq("user_id", userId)
      .eq("payment_provider", "paytr")
      .in("status", ["active", "expired"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (subError || !subscription) {
      return NextResponse.json(
        { error: "No PayTR subscription found for this user" },
        { status: 404 }
      )
    }

    const plan = subscription.subscription_plans

    // Generate unique renewal order ID
    const timestamp = Date.now()
    const userIdShort = userId.slice(0, 8)
    const orderId = `REN-${timestamp}-${userIdShort}`

    // Get user IP
    const userIp =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1"

    // Get app URL for callbacks
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Create PayTR client
    const paytrClient = new PayTRClient()

    // Prepare basket (PayTR requires price in kuruş)
    const priceInKurus = Math.round(plan.price * 100)

    // Create payment request
    const paymentRequest = await paytrClient.createPaymentRequest({
      userId,
      planId: subscription.plan_id,
      email: userEmail,
      amount: priceInKurus,
      orderId,
      userIp,
      basket: [
        {
          name: `${plan.name} - Yenileme`,
          price: priceInKurus,
          quantity: 1,
        },
      ],
      callbackUrl: `${appUrl}/api/paytr/renewal-callback`,
      successUrl: `${appUrl}/api/paytr/success?order_id=${orderId}&type=renewal`,
      failUrl: `${appUrl}/uygulama/abonelik?renewal=failed`,
    })

    if (paymentRequest.status !== "success" || !paymentRequest.token) {
      console.error("[PayTR Renew] Payment request failed:", paymentRequest.reason)
      return NextResponse.json(
        { error: paymentRequest.reason || "Failed to create payment" },
        { status: 500 }
      )
    }

    // Store pending renewal
    const { error: pendingError } = await supabase
      .from("pending_subscriptions")
      .insert({
        user_id: userId,
        plan_id: subscription.plan_id,
        token: orderId,
        status: "pending",
        metadata: {
          paytr_order_id: orderId,
          amount: plan.price,
          payment_provider: "paytr",
          renewal_for_subscription_id: subscription.id,
          type: "renewal",
          iframe_token: paymentRequest.token,
        },
      })

    if (pendingError) {
      console.error("[PayTR Renew] Failed to create pending renewal:", pendingError)
      // Continue anyway
    }

    // Return iframe token
    return NextResponse.json({
      success: true,
      iframeToken: paymentRequest.token,
      orderId,
      iframeUrl: `https://www.paytr.com/odeme/guvenli/${paymentRequest.token}`,
    })
  } catch (error: any) {
    console.error("[PayTR Renew] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
