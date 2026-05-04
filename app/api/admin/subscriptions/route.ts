import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@/lib/supabase/server"
import { checkAdminAPI } from "@/lib/admin-check"
import { getPlanTypeFromPlanId } from "@/lib/admin/subscription-utils"
import { logger } from "@/lib/utils/logger"
import { AdminSubscriptionActionSchema } from "@/lib/schemas/admin-subscription.schema"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

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
      logger.error("Failed to fetch subscriptions", error)
      return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
    }

    return NextResponse.json({ subscriptions })
  } catch (error) {
    logger.error("Error in GET /api/admin/subscriptions", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Admin access check
  const adminCheck = await checkAdminAPI(request)
  if (adminCheck) return adminCheck

  try {
    // Parse and validate request body with Zod
    const parseResult = AdminSubscriptionActionSchema.safeParse(await request.json())

    if (!parseResult.success) {
      logger.warn("Invalid admin subscription request", {
        errors: parseResult.error.flatten().fieldErrors,
      })
      return NextResponse.json(
        {
          error: "Geçersiz istek",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const body = parseResult.data

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get admin user ID for logging
    const serverClient = await createServerClient()
    const { data: { user: adminUser } } = await serverClient.auth.getUser()
    const adminId = adminUser?.id || null

    // Handle different actions
    switch (body.action) {
      case "create": {
        // Get plan type from plan_id
        const planType = getPlanTypeFromPlanId(body.planId)

        // Use RPC function for atomic subscription creation
        const { data: result, error: rpcError } = await supabase.rpc(
          'admin_create_subscription',
          {
            p_user_id: body.userId,
            p_plan_id: body.planId,
            p_plan_type: planType,
            p_expires_at: body.expiresAt || null,
            p_admin_id: adminId,
          }
        )

        if (rpcError) {
          logger.error("Failed to create subscription via RPC", rpcError, {
            userId: body.userId,
            planId: body.planId,
          })
          return NextResponse.json(
            { error: "Abonelik oluşturulamadı" },
            { status: 500 }
          )
        }

        logger.info("Admin created subscription", {
          userId: body.userId,
          planType,
          subscriptionId: result.id,
          adminId,
        })

        return NextResponse.json({
          success: true,
          message: "Abonelik başarıyla oluşturuldu",
          subscription: result,
        })
      }

      case "update": {
        // Get plan type from plan_id
        const planType = getPlanTypeFromPlanId(body.planId)

        // Use RPC function for atomic subscription update
        const { data: result, error: rpcError } = await supabase.rpc(
          'admin_update_subscription',
          {
            p_subscription_id: body.subscriptionId,
            p_plan_id: body.planId,
            p_plan_type: planType,
            p_user_id: body.userId,
            p_admin_id: adminId,
          }
        )

        if (rpcError) {
          logger.error("Failed to update subscription via RPC", rpcError, {
            subscriptionId: body.subscriptionId,
            planId: body.planId,
          })
          return NextResponse.json(
            { error: "Abonelik güncellenemedi" },
            { status: 500 }
          )
        }

        logger.info("Admin updated subscription", {
          subscriptionId: body.subscriptionId,
          planType,
          adminId,
        })

        return NextResponse.json({
          success: true,
          message: "Plan başarıyla güncellendi",
          subscription: result,
        })
      }

      case "extend": {
        // Use RPC function for atomic subscription extension
        const { data: result, error: rpcError } = await supabase.rpc(
          'admin_extend_subscription',
          {
            p_subscription_id: body.subscriptionId,
            p_expires_at: body.expiresAt,
            p_user_id: body.userId,
            p_admin_id: adminId,
          }
        )

        if (rpcError) {
          logger.error("Failed to extend subscription via RPC", rpcError, {
            subscriptionId: body.subscriptionId,
            expiresAt: body.expiresAt,
          })
          return NextResponse.json(
            { error: "Abonelik süre uzatılamadı" },
            { status: 500 }
          )
        }

        logger.info("Admin extended subscription", {
          subscriptionId: body.subscriptionId,
          expiresAt: body.expiresAt,
          adminId,
        })

        return NextResponse.json({
          success: true,
          message: "Abonelik süresi başarıyla uzatıldı",
          subscription: result,
        })
      }

      case "cancel": {
        // Cancel subscription (soft delete) - single operation, no RPC needed
        const { data: cancelledSubscription, error: cancelError } = await supabase
          .from("subscriptions")
          .update({
            status: "cancelled",
            deleted_at: new Date().toISOString(),
          })
          .eq("id", body.subscriptionId)
          .select()
          .single()

        if (cancelError) {
          logger.error("Failed to cancel subscription", cancelError, {
            subscriptionId: body.subscriptionId,
          })
          return NextResponse.json(
            { error: "Abonelik iptal edilemedi" },
            { status: 500 }
          )
        }

        // Manual logging for cancel (not using RPC)
        if (adminId) {
          const { logAdminAction, AdminActionTypes } = await import("@/lib/admin/activity-log")
          await logAdminAction({
            adminId,
            actionType: AdminActionTypes.SUBSCRIPTION_CANCEL,
            targetType: "subscription",
            targetId: body.subscriptionId,
            targetUserId: body.userId,
            description: `Abonelik iptal edildi`,
            metadata: { subscriptionId: body.subscriptionId },
          })
        }

        logger.security("Admin cancelled user subscription", {
          subscriptionId: body.subscriptionId,
          userId: body.userId,
          adminId,
        })

        return NextResponse.json({
          success: true,
          message: "Abonelik başarıyla iptal edildi",
          subscription: cancelledSubscription,
        })
      }

      default:
        logger.warn("Invalid action received", { action: (body as any).action })
        return NextResponse.json({ error: "Geçersiz action" }, { status: 400 })
    }
  } catch (error) {
    logger.error("Error in POST /api/admin/subscriptions", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
