import { createServerClient } from "@/lib/supabase/server"
import { checkAdminAPI } from "@/lib/admin-check"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  // Admin access check
  const adminCheck = await checkAdminAPI(request)
  if (adminCheck) return adminCheck

  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)

    const limit = parseInt(searchParams.get("limit") || "100")
    const offset = parseInt(searchParams.get("offset") || "0")
    const actionType = searchParams.get("action_type")
    const targetUserId = searchParams.get("target_user_id")

    let query = supabase
      .from("admin_action_logs")
      .select(`
        *,
        admin:admin_id (
          first_name,
          last_name,
          email
        ),
        target_user:target_user_id (
          first_name,
          last_name,
          email
        )
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (actionType) {
      query = query.eq("action_type", actionType)
    }

    if (targetUserId) {
      query = query.eq("target_user_id", targetUserId)
    }

    const { data: logs, error, count } = await query

    if (error) {
      console.error("Error fetching activity logs:", error)
      return NextResponse.json(
        { error: "Failed to fetch activity logs" },
        { status: 500 }
      )
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from("admin_action_logs")
      .select("*", { count: "exact", head: true })

    return NextResponse.json({
      logs,
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
      },
    })
  } catch (error) {
    console.error("Error in GET /api/admin/activity-logs:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
