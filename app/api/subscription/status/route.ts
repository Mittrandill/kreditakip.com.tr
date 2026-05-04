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
      .in("status", ["active", "canceled", "paused", "past_due"])
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

    // Apply monthly OCR reset if the 30-day period has passed, then fetch usage
    // check_ocr_monthly_reset resets usage_count=0 and sets new reset_at when overdue
    await supabase.rpc("check_ocr_monthly_reset", { p_user_id: userId })

    // Get usage tracking (after potential reset above)
    const { data: usage, error: usageError } = await supabase.from("subscription_usage").select("*").eq("user_id", userId)


    const response = {
      subscription,
      usage,
    }


    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] Subscription status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
