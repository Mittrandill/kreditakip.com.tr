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
    let { data: usage } = await supabase.from("subscription_usage").select("*").eq("user_id", userId)

    // 7-day trial for free-plan users. The trial limits (2 saved credits + 1 risk
    // analysis) are written to subscription_usage by initialize_new_user() at signup.
    // Here we (a) present the subscription as "trial" during the window, and
    // (b) downgrade usage limits to free tier once the window has passed.
    let responseSubscription: any = subscription
    const isFreePlan =
      !subscription ||
      subscription.plan_id === "free" ||
      subscription.plan_type === "free"

    if (isFreePlan) {
      const accountCreatedAt = new Date(user.created_at)
      const trialEndsAt = new Date(accountCreatedAt)
      trialEndsAt.setDate(trialEndsAt.getDate() + 7)
      const inTrial = new Date() < trialEndsAt

      if (inTrial) {
        // Cosmetic: present as trial. Enforcement comes from DB usage limits.
        responseSubscription = {
          ...(subscription ?? { id: "trial", user_id: userId, plan_id: "free" }),
          plan_type: "trial",
          status: "trialing",
          expires_at: trialEndsAt.toISOString(),
          trial: true,
        }
      } else {
        // Trial window passed → ensure DB usage is at free-tier limits
        // (free: OCR 1 saved credit, risk analysis disabled).
        const ocr = usage?.find((u: any) => u.feature_type === "ocr_analysis")
        const risk = usage?.find((u: any) => u.feature_type === "risk_analysis")
        let changed = false

        if (ocr && (ocr.saved_credits_limit ?? 0) > 1) {
          await supabase
            .from("subscription_usage")
            .update({ saved_credits_limit: 1, updated_at: new Date().toISOString() })
            .eq("user_id", userId)
            .eq("feature_type", "ocr_analysis")
          changed = true
        }
        if (risk && (risk.limit_count ?? 0) > 0) {
          await supabase
            .from("subscription_usage")
            .update({ limit_count: 0, updated_at: new Date().toISOString() })
            .eq("user_id", userId)
            .eq("feature_type", "risk_analysis")
          changed = true
        }
        if (changed) {
          const { data: refreshed } = await supabase
            .from("subscription_usage")
            .select("*")
            .eq("user_id", userId)
          usage = refreshed ?? usage
        }
      }
    }

    return NextResponse.json({ subscription: responseSubscription, usage })
  } catch (error) {
    console.error("[v0] Subscription status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
