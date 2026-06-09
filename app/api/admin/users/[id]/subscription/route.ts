import { createClient } from "@supabase/supabase-js"
import { checkAdminAPI } from "@/lib/admin-check"
import { logger } from "@/lib/utils/logger"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  // Admin access check
  const adminCheck = await checkAdminAPI(request)
  if (adminCheck) return adminCheck

  try {
    const userId = params.id

    if (!userId) {
      return NextResponse.json(
        { error: "Kullanıcı ID gerekli" },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get active subscription with plan details
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select(
        `
        *,
        subscription_plans (*)
      `
      )
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (subError) {
      logger.error("Failed to fetch user subscription", subError, { userId })
    }

    // Get subscription usage data
    const { data: usage, error: usageError } = await supabase
      .from("subscription_usage")
      .select("*")
      .eq("user_id", userId)

    if (usageError) {
      logger.error("Failed to fetch subscription usage", usageError, { userId })
    }

    // Total credits saved to the database (active, not soft-deleted). Combined with
    // the OCR-saved count this lets us derive how many were added manually.
    const { count: totalCredits, error: creditsError } = await supabase
      .from("credits")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("deleted_at", null)

    if (creditsError) {
      logger.error("Failed to fetch credits count", creditsError, { userId })
    }

    // Get all active plans (for dropdown)
    const { data: availablePlans, error: plansError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })

    if (plansError) {
      logger.error("Failed to fetch available plans", plansError)
    }

    logger.info("Fetched user subscription data", {
      userId,
      hasSubscription: !!subscription,
      usageCount: usage?.length || 0,
    })

    return NextResponse.json({
      subscription,
      usage: usage || [],
      totalCredits: totalCredits || 0,
      availablePlans: availablePlans || [],
    })
  } catch (error) {
    logger.error("Error in GET /api/admin/users/[id]/subscription", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
