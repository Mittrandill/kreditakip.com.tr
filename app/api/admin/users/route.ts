import { createSupabaseServer } from "@/lib/supabase-server"
import { checkAdminAPI } from "@/lib/admin-check"
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    // Admin + MFA (AAL2) check
    const adminCheck = await checkAdminAPI(request)
    if (adminCheck) return adminCheck

    const supabase = await createSupabaseServer()

    // Get all users
    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .order("first_name", { ascending: true })

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error in GET /api/admin/users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
