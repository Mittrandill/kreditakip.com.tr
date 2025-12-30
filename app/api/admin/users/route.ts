import { createSupabaseServer } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createSupabaseServer()

    // Check if user is admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", session.user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

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
