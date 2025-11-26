import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

/**
 * Get Payment URL for Pending Renewal
 *
 * Allows users to retrieve their pending 3D Secure payment URL
 * Returns payment details including expiry time
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Use service role to fetch pending payment
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Find pending renewal payment
    const { data: pendingPayment, error: fetchError } = await supabaseAdmin
      .from("pending_renewal_payments")
      .select(`
        *,
        subscriptions!inner(
          id,
          plan_id,
          expires_at,
          status,
          grace_period_ends_at
        ),
        subscription_plans!inner(
          id,
          name,
          price,
          currency
        )
      `)
      .eq("user_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (fetchError) {
      console.error("[get-payment-url] Error fetching pending payment:", fetchError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // No pending payment found
    if (!pendingPayment) {
      return NextResponse.json({
        hasPendingPayment: false,
        message: "Bekleyen ödeme bulunamadı",
      })
    }

    const now = new Date()
    const expiresAt = new Date(pendingPayment.expires_at)
    const isExpired = now > expiresAt

    // Calculate time remaining
    const timeRemaining = isExpired ? 0 : expiresAt.getTime() - now.getTime()
    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60))
    const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))

    // Check if subscription is in grace period
    const subscription = pendingPayment.subscriptions
    const gracePeriodEndsAt = subscription.grace_period_ends_at
      ? new Date(subscription.grace_period_ends_at)
      : null
    const isInGracePeriod = gracePeriodEndsAt ? now < gracePeriodEndsAt : false
    const gracePeriodDaysRemaining = gracePeriodEndsAt
      ? Math.ceil((gracePeriodEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0

    return NextResponse.json({
      hasPendingPayment: true,
      payment: {
        id: pendingPayment.id,
        merchantOid: pendingPayment.merchant_oid,
        paymentUrl: pendingPayment.payment_url,
        amount: pendingPayment.amount,
        currency: pendingPayment.currency,
        createdAt: pendingPayment.created_at,
        expiresAt: pendingPayment.expires_at,
        isExpired,
        timeRemaining: {
          hours: hoursRemaining,
          minutes: minutesRemaining,
          total: timeRemaining,
        },
      },
      subscription: {
        id: subscription.id,
        planName: pendingPayment.subscription_plans.name,
        expiresAt: subscription.expires_at,
        status: subscription.status,
        isInGracePeriod,
        gracePeriodEndsAt: subscription.grace_period_ends_at,
        gracePeriodDaysRemaining,
      },
    })
  } catch (error: any) {
    console.error("[get-payment-url] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
