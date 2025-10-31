import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

export const runtime = "nodejs"

// Cache plans for 5 minutes
let plansCache: any = null
let plansCacheTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function GET(request: NextRequest) {
  try {
    console.log("[API] Subscription plans API called")

    // Return cached data if available and fresh
    if (plansCache && Date.now() - plansCacheTime < CACHE_DURATION) {
      console.log("[API] Returning cached plans")
      return NextResponse.json({
        success: true,
        plans: plansCache,
        cached: true,
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Fetch active plans ordered by sort_order
    const { data: plans, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })

    if (error) {
      console.error("[API] Error fetching plans:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch subscription plans",
        },
        { status: 500 },
      )
    }

    // Transform plans to frontend format
    const transformedPlans = plans?.map((plan) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: parseFloat(plan.price),
      originalPrice: plan.original_price ? parseFloat(plan.original_price) : undefined,
      period: plan.billing_period,
      periodLabel: plan.metadata?.period_label || plan.billing_period,
      features: plan.features || [],
      popular: plan.is_popular,
      discount: plan.metadata?.discount,
      currency: plan.currency,
      billingInterval: plan.billing_interval,
    }))

    // Update cache
    plansCache = transformedPlans
    plansCacheTime = Date.now()

    console.log("[API] Returning plans from database:", transformedPlans)

    return NextResponse.json({
      success: true,
      plans: transformedPlans,
      cached: false,
    })
  } catch (error: any) {
    console.error("[API] Plans fetch error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred",
      },
      { status: 500 },
    )
  }
}

// POST endpoint to update plan prices (admin only - SECURITY: endpoint disabled for safety)
export async function POST(request: NextRequest) {
  // SECURITY FIX: Disable admin endpoint until proper authentication is implemented
  // This prevents unauthorized modifications to subscription plans
  return NextResponse.json(
    {
      success: false,
      error: "Admin endpoint temporarily disabled for security. Please use database console for plan modifications.",
    },
    { status: 403 },
  )

  /* COMMENTED OUT UNTIL PROPER ADMIN AUTHENTICATION IS IMPLEMENTED
  try {
    const body = await request.json()
    const { planId, updates } = body

    if (!planId || !updates) {
      return NextResponse.json(
        {
          success: false,
          error: "planId and updates are required",
        },
        { status: 400 },
      )
    }

    // SECURITY: Check admin authentication
    const supabaseAuth = await createServerClient()
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin role
    const { data: profile } = await supabaseAuth
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data, error } = await supabase
      .from("subscription_plans")
      .update(updates)
      .eq("id", planId)
      .select()
      .single()

    if (error) {
      console.error("[API] Error updating plan:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update plan",
        },
        { status: 500 },
      )
    }

    // Clear cache
    plansCache = null
    plansCacheTime = 0

    return NextResponse.json({
      success: true,
      plan: data,
    })
  } catch (error: any) {
    console.error("[API] Plan update error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred",
      },
      { status: 500 },
    )
  }
  */
}
