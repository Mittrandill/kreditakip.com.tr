import { createClient } from "@supabase/supabase-js"
import { checkAdminAPI } from "@/lib/admin-check"
import { logger } from "@/lib/utils/logger"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  // Admin access check
  const adminCheck = await checkAdminAPI(request)
  if (adminCheck) return adminCheck

  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Arama terimi en az 2 karakter olmalıdır" },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Search users by name or email
    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, created_at")
      .or(
        `first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`
      )
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      logger.error("Failed to search users", error, { query })
      return NextResponse.json(
        { error: "Kullanıcı araması başarısız" },
        { status: 500 }
      )
    }

    logger.info("User search completed", { query, resultCount: users.length })

    return NextResponse.json({ users })
  } catch (error) {
    logger.error("Error in GET /api/admin/users/search", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
