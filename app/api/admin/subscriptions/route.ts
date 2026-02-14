import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@/lib/supabase/server"
import { checkAdminAPI } from "@/lib/admin-check"
import {
  getSubscriptionLimits,
  getPlanTypeFromPlanId,
  createSubscriptionUsage,
  validateSubscriptionData,
  softDeleteActiveSubscription,
} from "@/lib/admin/subscription-utils"
import { logAdminAction, AdminActionTypes } from "@/lib/admin/activity-log"
import type { AdminSubscriptionAction } from "@/lib/types"

export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  // Admin access check
  const adminCheck = await checkAdminAPI(request)
  if (adminCheck) return adminCheck

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select(`
        *,
        profiles!subscriptions_user_id_fkey (
          first_name,
          last_name,
          email
        )
      `)
      .in("status", ["active", "cancelled", "expired"])
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching subscriptions:", error)
      return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
    }

    return NextResponse.json({ subscriptions })
  } catch (error) {
    console.error("Error in GET /api/admin/subscriptions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Admin access check
  const adminCheck = await checkAdminAPI(request)
  if (adminCheck) return adminCheck

  try {
    const body: AdminSubscriptionAction = await request.json()
    const { action, userId, subscriptionId, planId, expiresAt, status, notes } = body

    // Validate required fields
    if (!action || !userId) {
      return NextResponse.json(
        { error: "Action ve userId gerekli" },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get admin user ID for logging
    const serverClient = await createServerClient()
    const { data: { user: adminUser } } = await serverClient.auth.getUser()
    const adminId = adminUser?.id || ""

    // Handle different actions
    switch (action) {
      case "create": {
        // Validate data
        const validation = validateSubscriptionData({ userId, planId, expiresAt })
        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 400 })
        }

        if (!planId) {
          return NextResponse.json({ error: "Plan ID gerekli" }, { status: 400 })
        }

        // Get plan details
        const { data: plan, error: planError } = await supabase
          .from("subscription_plans")
          .select("*")
          .eq("id", planId)
          .single()

        if (planError || !plan) {
          return NextResponse.json({ error: "Plan bulunamadı" }, { status: 404 })
        }

        // Soft-delete any existing active subscription
        await softDeleteActiveSubscription(supabase, userId)

        // Get plan type from plan_id
        const planType = getPlanTypeFromPlanId(planId)

        // Create new subscription (payment_provider as null for manual subscriptions)
        const { data: newSubscription, error: subError } = await supabase
          .from("subscriptions")
          .insert({
            user_id: userId,
            plan_id: planId,
            plan_type: planType,
            status: "active",
            start_date: new Date().toISOString(),
            expires_at: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            payment_provider: null, // null for manual/admin-created subscriptions
          })
          .select()
          .single()

        if (subError) {
          console.error("Error creating subscription:", subError)
          return NextResponse.json(
            { error: "Abonelik oluşturulamadı" },
            { status: 500 }
          )
        }

        // Create subscription usage records
        await createSubscriptionUsage(supabase, userId, planType, newSubscription.id)

        // Log admin action
        await logAdminAction({
          adminId,
          actionType: AdminActionTypes.SUBSCRIPTION_CREATE,
          targetType: "subscription",
          targetId: newSubscription.id,
          targetUserId: userId,
          description: `Manuel ${planType} abonelik oluşturuldu`,
          metadata: { planId, planType, expiresAt },
        })

        console.log(`[ADMIN] Created subscription for user ${userId}: ${planType}`)

        return NextResponse.json({
          success: true,
          message: "Abonelik başarıyla oluşturuldu",
          subscription: newSubscription,
        })
      }

      case "update": {
        // Validate data
        const validation = validateSubscriptionData({ subscriptionId, planId })
        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 400 })
        }

        if (!subscriptionId || !planId) {
          return NextResponse.json(
            { error: "Subscription ID ve Plan ID gerekli" },
            { status: 400 }
          )
        }

        // Get plan details
        const { data: plan, error: planError } = await supabase
          .from("subscription_plans")
          .select("*")
          .eq("id", planId)
          .single()

        if (planError || !plan) {
          return NextResponse.json({ error: "Plan bulunamadı" }, { status: 404 })
        }

        // Get plan type from plan_id
        const planType = getPlanTypeFromPlanId(planId)

        // Update subscription
        const { data: updatedSubscription, error: updateError } = await supabase
          .from("subscriptions")
          .update({
            plan_id: planId,
            plan_type: planType,
          })
          .eq("id", subscriptionId)
          .select()
          .single()

        if (updateError) {
          console.error("Error updating subscription:", updateError)
          return NextResponse.json(
            { error: "Abonelik güncellenemedi" },
            { status: 500 }
          )
        }

        // Update subscription usage limits
        const limits = getSubscriptionLimits(planType)

        await supabase
          .from("subscription_usage")
          .update({
            usage_limit: limits.ocr_limit,
          })
          .eq("subscription_id", subscriptionId)
          .eq("feature_type", "ocr_analysis")

        await supabase
          .from("subscription_usage")
          .update({
            usage_limit: limits.risk_analysis_limit,
          })
          .eq("subscription_id", subscriptionId)
          .eq("feature_type", "risk_analysis")

        await supabase
          .from("subscription_usage")
          .update({
            usage_limit: limits.saved_credits_limit,
          })
          .eq("subscription_id", subscriptionId)
          .eq("feature_type", "saved_credits")

        // Log admin action
        await logAdminAction({
          adminId,
          actionType: AdminActionTypes.SUBSCRIPTION_UPDATE,
          targetType: "subscription",
          targetId: subscriptionId,
          targetUserId: userId,
          description: `Abonelik planı ${planType} olarak güncellendi`,
          metadata: { planId, planType },
        })

        console.log(`[ADMIN] Updated subscription ${subscriptionId} to ${planType}`)

        return NextResponse.json({
          success: true,
          message: "Plan başarıyla güncellendi",
          subscription: updatedSubscription,
        })
      }

      case "extend": {
        // Validate data
        const validation = validateSubscriptionData({ subscriptionId, expiresAt })
        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 400 })
        }

        if (!subscriptionId || !expiresAt) {
          return NextResponse.json(
            { error: "Subscription ID ve yeni bitiş tarihi gerekli" },
            { status: 400 }
          )
        }

        // Update expires_at and set status to active if expired
        const { data: extendedSubscription, error: extendError } = await supabase
          .from("subscriptions")
          .update({
            expires_at: expiresAt,
            status: "active", // Reactivate if expired
          })
          .eq("id", subscriptionId)
          .select()
          .single()

        if (extendError) {
          console.error("Error extending subscription:", extendError)
          return NextResponse.json(
            { error: "Abonelik süre uzatılamadı" },
            { status: 500 }
          )
        }

        // Log admin action
        await logAdminAction({
          adminId,
          actionType: AdminActionTypes.SUBSCRIPTION_EXTEND,
          targetType: "subscription",
          targetId: subscriptionId,
          targetUserId: userId,
          description: `Abonelik süresi ${new Date(expiresAt).toLocaleDateString("tr-TR")} tarihine uzatıldı`,
          metadata: { expiresAt },
        })

        console.log(`[ADMIN] Extended subscription ${subscriptionId} to ${expiresAt}`)

        return NextResponse.json({
          success: true,
          message: "Abonelik süresi başarıyla uzatıldı",
          subscription: extendedSubscription,
        })
      }

      case "cancel": {
        if (!subscriptionId) {
          return NextResponse.json(
            { error: "Subscription ID gerekli" },
            { status: 400 }
          )
        }

        // Cancel subscription (soft delete)
        const { data: cancelledSubscription, error: cancelError } = await supabase
          .from("subscriptions")
          .update({
            status: "cancelled",
            deleted_at: new Date().toISOString(),
          })
          .eq("id", subscriptionId)
          .select()
          .single()

        if (cancelError) {
          console.error("Error cancelling subscription:", cancelError)
          return NextResponse.json(
            { error: "Abonelik iptal edilemedi" },
            { status: 500 }
          )
        }

        // Log admin action
        await logAdminAction({
          adminId,
          actionType: AdminActionTypes.SUBSCRIPTION_CANCEL,
          targetType: "subscription",
          targetId: subscriptionId,
          targetUserId: userId,
          description: `Abonelik iptal edildi`,
          metadata: { subscriptionId },
        })

        console.log(`[ADMIN] Cancelled subscription ${subscriptionId}`)

        return NextResponse.json({
          success: true,
          message: "Abonelik başarıyla iptal edildi",
          subscription: cancelledSubscription,
        })
      }

      default:
        return NextResponse.json({ error: "Geçersiz action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in POST /api/admin/subscriptions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
