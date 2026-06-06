import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// GET: Get current usage for the authenticated user
export async function GET(request: NextRequest) {
  try {
    // SECURITY: derive the user from the session, never from a query param
    const authClient = await createServerClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = user.id
    const featureType = request.nextUrl.searchParams.get("featureType")

    // Initialize Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get user's subscription and usage
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select(`
        *,
        subscription_plans(id, name, features, metadata)
      `)
      .eq("user_id", userId)
      .in("status", ["active", "trialing", "grace_period"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!subscription) {
      // Return free plan limits
      const freeUsage = {
        ocrAnalysis: { limit: 1, used: 0, resetAt: null },
        riskAnalysis: { limit: 0, used: 0, resetAt: null },
      }

      if (featureType) {
        return NextResponse.json({
          success: true,
          usage: freeUsage[featureType as keyof typeof freeUsage] || null,
          planType: "free",
        })
      }

      return NextResponse.json({
        success: true,
        usage: freeUsage,
        planType: "free",
        subscription: null,
      })
    }

    // Get usage from subscription_usage table
    let query = supabase
      .from("subscription_usage")
      .select("*")
      .eq("user_id", userId)

    if (featureType) {
      query = query.eq("feature_type", featureType)
    }

    const { data: usageData, error: usageError } = await query

    if (usageError) {
      console.error("[Usage] Error fetching usage:", usageError)
    }

    // Calculate limits based on plan
    const planId = subscription.plan_id
    let limits: Record<string, number> = {}

    if (planId === "free") {
      limits = { ocr_analysis: 1, risk_analysis: 0 }
    } else if (planId?.includes("pro")) {
      limits = { ocr_analysis: 10, risk_analysis: 5 }
    } else if (planId?.includes("premium")) {
      limits = { ocr_analysis: 999999, risk_analysis: 999999 }
    }

    // Format usage data
    const usage: Record<string, any> = {}
    const featureTypes = ["ocr_analysis", "risk_analysis"]

    for (const type of featureTypes) {
      const usageRecord = usageData?.find((u: any) => u.feature_type === type)
      const featureName = type.replace("_", "")

      usage[featureName] = {
        limit: limits[type] || 0,
        used: usageRecord?.usage_count || 0,
        savedCredits: usageRecord?.saved_credits_count || 0,
        resetAt: usageRecord?.reset_at,
        canUse: (usageRecord?.usage_count || 0) < (limits[type] || 0),
      }
    }

    // If specific feature requested
    if (featureType) {
      const featureName = featureType.replace("_", "")
      return NextResponse.json({
        success: true,
        usage: usage[featureName],
        planType: subscription.plan_type || "free",
        planId: subscription.plan_id,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          expiresAt: subscription.expires_at,
          gracePeriodEnds: subscription.grace_period_ends_at,
        },
      })
    }

    return NextResponse.json({
      success: true,
      usage,
      planType: subscription.plan_type || "free",
      planId: subscription.plan_id,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        expiresAt: subscription.expires_at,
        gracePeriodEnds: subscription.grace_period_ends_at,
      },
    })
  } catch (error: any) {
    console.error("[Usage] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// POST: Increment usage counter for the authenticated user
export async function POST(request: NextRequest) {
  try {
    // SECURITY: derive the user from the session, never from the body
    const authClient = await createServerClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = user.id
    const { featureType, amount = 1, saveCredit = false } = await request.json()

    if (!featureType) {
      return NextResponse.json(
        { error: "Feature type is required" },
        { status: 400 }
      )
    }

    // Initialize Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get current usage and limits
    const { data: currentUsage, error: usageError } = await supabase
      .from("subscription_usage")
      .select("*")
      .eq("user_id", userId)
      .eq("feature_type", featureType)
      .single()

    if (usageError && usageError.code !== "PGRST116") {
      console.error("[Usage] Error fetching current usage:", usageError)
      return NextResponse.json(
        { error: "Failed to check usage" },
        { status: 500 }
      )
    }

    // Get user's subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan_id, status")
      .eq("user_id", userId)
      .in("status", ["active", "trialing", "grace_period"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    // Calculate limits
    const planId = subscription?.plan_id || "free"
    let limit = 0
    let savedLimit = 1

    if (planId === "free") {
      limit = featureType === "ocr_analysis" ? 1 : 0
      savedLimit = 1
    } else if (planId?.includes("pro")) {
      limit = featureType === "ocr_analysis" ? 10 : 5
      savedLimit = 10
    } else if (planId?.includes("premium")) {
      limit = 999999
      savedLimit = 999999
    }

    const currentUsed = currentUsage?.usage_count || 0
    const currentSaved = currentUsage?.saved_credits_count || 0
    const newUsed = saveCredit ? currentUsed : currentUsed + amount

    // Check limits before mutating
    if (saveCredit) {
      // SECURITY: enforce saved-credit limit (previously unchecked)
      if (currentSaved + amount > savedLimit) {
        return NextResponse.json({
          success: false,
          error: "Saved credit limit exceeded",
          currentSaved,
          savedLimit,
        })
      }
    } else if (newUsed > limit) {
      return NextResponse.json({
        success: false,
        error: "Usage limit exceeded",
        currentUsage: currentUsed,
        limit,
      })
    }

    // Update or insert usage record
    const usageData: any = {
      user_id: userId,
      feature_type: featureType,
      usage_count: newUsed,
      limit_count: limit,
      reset_at: currentUsage?.reset_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      saved_credits_count: saveCredit ? currentSaved + amount : currentSaved,
      saved_credits_limit: savedLimit,
    }

    if (currentUsage) {
      // Update existing record
      const { error: updateError } = await supabase
        .from("subscription_usage")
        .update(usageData)
        .eq("id", currentUsage.id)

      if (updateError) {
        console.error("[Usage] Error updating usage:", updateError)
        return NextResponse.json(
          { error: "Failed to update usage" },
          { status: 500 }
        )
      }
    } else {
      // Insert new record
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .in("status", ["active", "trialing", "grace_period"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      usageData.subscription_id = sub?.id

      const { error: insertError } = await supabase
        .from("subscription_usage")
        .insert(usageData)

      if (insertError) {
        console.error("[Usage] Error inserting usage:", insertError)
        return NextResponse.json(
          { error: "Failed to record usage" },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      usage: {
        used: newUsed,
        limit,
        remaining: limit - newUsed,
        resetAt: usageData.reset_at,
        savedCredits: usageData.saved_credits_count,
      },
      action: saveCredit ? "credit_saved" : "usage_recorded",
    })
  } catch (error: any) {
    console.error("[Usage] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
