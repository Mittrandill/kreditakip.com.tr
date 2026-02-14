import { createServerClient } from "@/lib/supabase/server"
import { createSupabaseAdmin } from "@/lib/supabase-server"
import { checkAdminAPI } from "@/lib/admin-check"
import { logAdminAction, AdminActionTypes } from "@/lib/admin/activity-log"
import { logger } from "@/lib/utils/logger"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

interface SendNotificationRequest {
  target: "all" | "plan" | "specific"
  planType?: string // For plan-based targeting
  userIds?: string[] // For specific users
  title: string
  message: string
  link?: string
}

export async function POST(request: NextRequest) {
  // Admin access check
  const adminCheck = await checkAdminAPI(request)
  if (adminCheck) return adminCheck

  try {
    const body: SendNotificationRequest = await request.json()
    const { target, planType, userIds, title, message, link } = body

    // Validate required fields
    if (!target || !title || !message) {
      return NextResponse.json(
        { error: "Target, title ve message gerekli" },
        { status: 400 }
      )
    }

    // Get admin user ID for logging
    const serverClient = await createServerClient()
    const { data: { user: adminUser } } = await serverClient.auth.getUser()
    const adminId = adminUser?.id || ""

    const supabase = createSupabaseAdmin()

    // Determine target users
    let targetUserIds: string[] = []

    if (target === "all") {
      // Get all users
      const { data: allUsers } = await supabase
        .from("profiles")
        .select("id")

      targetUserIds = allUsers?.map((u) => u.id) || []
    } else if (target === "plan" && planType) {
      // Get users with specific plan
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("plan_type", planType)
        .eq("status", "active")

      targetUserIds = subscriptions?.map((s) => s.user_id) || []
    } else if (target === "specific" && userIds && userIds.length > 0) {
      // Use provided user IDs
      targetUserIds = userIds
    } else {
      return NextResponse.json(
        { error: "Geçersiz hedef seçimi" },
        { status: 400 }
      )
    }

    if (targetUserIds.length === 0) {
      logger.warn("No target users found for notification", { target, planType })
      return NextResponse.json(
        { error: "Hedef kullanıcı bulunamadı" },
        { status: 400 }
      )
    }

    logger.info("Sending notifications", {
      target,
      planType,
      userCount: targetUserIds.length,
      title,
    })

    // Create notifications for all target users
    const notifications = targetUserIds.map((userId) => ({
      user_id: userId,
      title,
      message,
      link: link || null,
      is_read: false,
    }))

    const { error: insertError } = await supabase
      .from("notifications")
      .insert(notifications)

    if (insertError) {
      logger.error("Failed to create notifications", insertError, {
        target,
        planType,
        userCount: targetUserIds.length,
        errorCode: insertError.code,
        errorDetails: insertError.details,
      })
      return NextResponse.json(
        {
          error: "Bildirimler oluşturulamadı",
          details: insertError.message,
          code: insertError.code,
        },
        { status: 500 }
      )
    }

    // Log admin action
    await logAdminAction({
      adminId,
      actionType: target === "all" ? AdminActionTypes.NOTIFICATION_BULK_SEND : AdminActionTypes.NOTIFICATION_SEND,
      targetType: "notification",
      description: `${targetUserIds.length} kullanıcıya bildirim gönderildi: "${title}"`,
      metadata: { target, planType, userCount: targetUserIds.length, title, message },
    })

    logger.info("Notifications sent successfully", {
      target,
      userCount: targetUserIds.length,
      title,
      adminId,
    })

    return NextResponse.json({
      success: true,
      message: `${targetUserIds.length} kullanıcıya bildirim başarıyla gönderildi`,
      count: targetUserIds.length,
    })
  } catch (error) {
    logger.error("Error in POST /api/admin/notifications/send", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
