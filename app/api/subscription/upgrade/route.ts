import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { paddleClient } from "@/lib/paddle-client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Upgrade/Downgrade Subscription via Paddle API
 *
 * Paddle handles plan changes:
 * - We call Paddle API to update the subscription
 * - Paddle calculates proration automatically
 * - Paddle sends webhook events (subscription.updated)
 * - Webhook handler updates our database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { newPlanId } = body

    if (!newPlanId) {
      return NextResponse.json(
        { error: "Plan ID gereklidir" },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get new plan details
    const { data: newPlan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", newPlanId)
      .eq("is_active", true)
      .single()

    if (planError || !newPlan) {
      return NextResponse.json(
        { error: "Geçersiz plan" },
        { status: 400 }
      )
    }

    if (!newPlan.paddle_price_id) {
      return NextResponse.json(
        { error: "Bu plan için Paddle fiyat ID'si tanımlanmamış" },
        { status: 400 }
      )
    }

    // Get user's current subscription
    const { data: currentSubscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*, subscription_plans(id, name, price, paddle_price_id)")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .maybeSingle()

    if (subError) {
      console.error("[Paddle Upgrade] Error fetching subscription:", subError)
      return NextResponse.json(
        { error: "Mevcut abonelik sorgulanırken hata oluştu" },
        { status: 500 }
      )
    }

    if (!currentSubscription) {
      return NextResponse.json(
        { error: "Aktif abonelik bulunamadı" },
        { status: 404 }
      )
    }

    if (!currentSubscription.paddle_subscription_id) {
      return NextResponse.json(
        { error: "Paddle abonelik ID'si bulunamadı" },
        { status: 400 }
      )
    }

    // Check if trying to "upgrade" to the same plan
    if (currentSubscription.plan_id === newPlanId) {
      return NextResponse.json(
        { error: "Zaten bu plandaySınız" },
        { status: 400 }
      )
    }

    // Update subscription via Paddle API
    try {
      await paddleClient.updateSubscription(
        currentSubscription.paddle_subscription_id,
        newPlan.paddle_price_id
      )

      console.log(
        `[Paddle Upgrade] Subscription ${currentSubscription.paddle_subscription_id} updated from ${currentSubscription.plan_id} to ${newPlanId}`
      )

      // Note: Database update will happen via webhook (subscription.updated event)
      // Paddle handles proration automatically

      const isUpgrade = newPlan.price > (currentSubscription.subscription_plans?.price || 0)

      return NextResponse.json({
        success: true,
        message: isUpgrade
          ? `Planınız başarıyla ${newPlan.name} olarak yükseltildi. Fark ücret bu dönem için prorata olarak hesaplanacak.`
          : `Planınız ${newPlan.name} olarak güncellendi. Değişiklik bir sonraki fatura döneminde geçerli olacak.`,
        newPlan: {
          id: newPlan.id,
          name: newPlan.name,
          price: newPlan.price,
          currency: newPlan.currency,
        },
        isUpgrade,
      })
    } catch (paddleError: any) {
      console.error("[Paddle Upgrade] Paddle API error:", paddleError)

      // If Paddle API fails, return error but suggest using management URL
      return NextResponse.json(
        {
          error: "Plan güncellenemedi. Lütfen abonelik yönetim sayfasını kullanın.",
          managementUrl: currentSubscription.update_url,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("[Paddle Upgrade] Error:", error)
    return NextResponse.json(
      {
        error: error.message || "Bir hata oluştu",
      },
      { status: 500 }
    )
  }
}
