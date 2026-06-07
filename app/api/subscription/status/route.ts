import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {

    // SECURITY FIX: Use authenticated user instead of query parameter
    const supabaseAuth = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = user.id

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select(`
        *,
        subscription_plans (
          id,
          name,
          price,
          currency
        )
      `)
      .eq("user_id", userId)
      .in("status", ["active", "trialing", "canceled", "paused", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    // Get plan details to determine limits
    let planLimits = {
      ocr_limit: null, // null means unlimited for free
      risk_analysis_limit: null, // null means unlimited for free
    }

    if (subscription?.plan_id) {
      const { data: plan } = await supabase
        .from("subscription_plans")
        .select("metadata")
        .eq("id", subscription.plan_id)
        .single()

      if (plan?.metadata) {
        // Plan metadata has limits: -1 = unlimited, positive number = limit, null = free tier
        planLimits = {
          ocr_limit: plan.metadata.ocr_limit ?? null,
          risk_analysis_limit: plan.metadata.risk_analysis_limit ?? null,
        }
      }
    }

    // Abonelik bitiş kontrolü - süresi dolmuşsa otomatik iptal et
    if (subscription && subscription.expires_at) {
      const expiresAt = new Date(subscription.expires_at)
      const now = new Date()

      if (expiresAt < now) {

        // Aboneliği "expired" olarak güncelle
        await supabase
          .from("subscriptions")
          .update({
            status: "expired",
            updated_at: new Date().toISOString(),
          })
          .eq("id", subscription.id)

        // Usage limits'i free plan'e düşür - her feature_type için ayrı update
        // Free plan: OCR unlimited, risk analysis 0
        await supabase
          .from("subscription_usage")
          .update({
            limit_count: -1, // unlimited for free
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("feature_type", "ocr_analysis");

        await supabase
          .from("subscription_usage")
          .update({
            limit_count: 0, // no risk analysis for free
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("feature_type", "risk_analysis");

        // Response'ta expired subscription döndür
        subscription.status = "expired"
      }
    }

    // Get usage tracking
    const { data: usage } = await supabase.from("subscription_usage").select("*").eq("user_id", userId)

    // Trial period: 7 days for new users with no active paid subscription
    let trialSubscription = null
    if (!subscription || subscription.status === "expired") {
      const accountCreatedAt = new Date(user.created_at)
      const trialEndsAt = new Date(accountCreatedAt)
      trialEndsAt.setDate(trialEndsAt.getDate() + 7)
      const now = new Date()

      if (now < trialEndsAt) {
        trialSubscription = {
          id: "trial",
          user_id: userId,
          plan_id: "trial",
          plan_type: "trial",
          status: "trialing",
          start_date: accountCreatedAt.toISOString(),
          expires_at: trialEndsAt.toISOString(),
          payment_provider: null,
          trial: true,
        }
      }
    }

    const activeSubscription = subscription ?? trialSubscription

    // Build trial usage if no usage records and trial is active
    let effectiveUsage = usage
    if (trialSubscription && (!usage || usage.length === 0)) {
      const resetAt = new Date(trialSubscription.expires_at)
      effectiveUsage = [
        {
          user_id: userId,
          subscription_id: "trial",
          feature_type: "ocr_analysis",
          usage_count: 0,
          limit_count: 2,
          saved_credits_count: 0,
          saved_credits_limit: 2,
          reset_at: resetAt.toISOString(),
        },
        {
          user_id: userId,
          subscription_id: "trial",
          feature_type: "risk_analysis",
          usage_count: 0,
          limit_count: 1,
          saved_credits_count: 0,
          saved_credits_limit: 0,
          reset_at: resetAt.toISOString(),
        },
      ]
    }

    return NextResponse.json({ subscription: activeSubscription, usage: effectiveUsage })
  } catch (error) {
    console.error("[v0] Subscription status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
