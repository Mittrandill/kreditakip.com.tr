import { createServiceRoleClient } from "@/lib/supabase-server"

export interface LogAdminActionParams {
  adminId: string
  actionType: string
  targetType?: string
  targetId?: string
  targetUserId?: string
  description: string
  metadata?: Record<string, any>
}

/**
 * Logs an admin action to the admin_action_logs table
 * Uses service role client to bypass RLS
 */
export async function logAdminAction(params: LogAdminActionParams) {
  try {
    const supabase = createServiceRoleClient()

    const { error } = await supabase.from("admin_action_logs").insert({
      admin_id: params.adminId,
      action_type: params.actionType,
      target_type: params.targetType || null,
      target_id: params.targetId || null,
      target_user_id: params.targetUserId || null,
      description: params.description,
      metadata: params.metadata || {},
    })

    if (error) {
      console.error("[logAdminAction] Error logging admin action:", error)
      // Don't throw - logging failure shouldn't break the main flow
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error("[logAdminAction] Unexpected error:", error)
    return { success: false, error }
  }
}

/**
 * Common action types for consistency
 */
export const AdminActionTypes = {
  // Subscription actions
  SUBSCRIPTION_CREATE: "subscription_create",
  SUBSCRIPTION_UPDATE: "subscription_update",
  SUBSCRIPTION_EXTEND: "subscription_extend",
  SUBSCRIPTION_CANCEL: "subscription_cancel",

  // User actions
  USER_UPDATE: "user_update",
  USER_DELETE: "user_delete",

  // Notification actions
  NOTIFICATION_SEND: "notification_send",
  NOTIFICATION_BULK_SEND: "notification_bulk_send",

  // Invoice actions
  INVOICE_UPDATE: "invoice_update",
  INVOICE_DELETE: "invoice_delete",
} as const
