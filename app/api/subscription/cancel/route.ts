import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { paddleClient } from "@/lib/paddle-client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Cancel Subscription via Paddle API
 *
 * Paddle handles subscriptions differently than PayTR:
 * - We call Paddle API to cancel the subscription
 * - Paddle will send webhook events (subscription.canceled)
 * - Webhook handler updates our database
 * - User retains access until current period ends
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's active subscription
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*, subscription_plans(name, billing_period)")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .maybeSingle()

    if (subError) {
      console.error("[Paddle Cancel] Error fetching subscription:", subError)
      return NextResponse.json(
        { error: "Abonelik sorgulanırken hata oluştu" },
        { status: 500 }
      )
    }

    if (!subscription) {
      return NextResponse.json(
        { error: "Aktif abonelik bulunamadı" },
        { status: 404 }
      )
    }

    if (!subscription.paddle_subscription_id) {
      return NextResponse.json(
        { error: "Paddle abonelik ID'si bulunamadı" },
        { status: 400 }
      )
    }

    // Cancel subscription via Paddle API
    try {
      await paddleClient.cancelSubscription(subscription.paddle_subscription_id)

      console.log(`[Paddle Cancel] Subscription ${subscription.paddle_subscription_id} canceled for user ${user.id}`)

      // Note: Database update will happen via webhook (subscription.canceled event)
      // This ensures consistency between Paddle and our database

      return NextResponse.json({
        success: true,
        message: `Aboneliğiniz başarıyla iptal edildi. ${subscription.subscription_plans?.name} özellikleriniz ${new Date(subscription.expires_at).toLocaleDateString("tr-TR")} tarihine kadar aktif kalacak.`,
        expiresAt: subscription.expires_at,
        planName: subscription.subscription_plans?.name,
      })
    } catch (paddleError: any) {
      console.error("[Paddle Cancel] Paddle API error:", paddleError)

      // If Paddle API fails, return error but suggest using management URL
      return NextResponse.json(
        {
          error: "Abonelik iptal edilemedi. Lütfen abonelik yönetim sayfasını kullanın.",
          managementUrl: subscription.cancel_url,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("[Paddle Cancel] Error:", error)
    return NextResponse.json(
      {
        error: error.message || "Bir hata oluştu",
      },
      { status: 500 }
    )
  }
}
