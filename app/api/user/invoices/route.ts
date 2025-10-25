import { createSupabaseServer } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createSupabaseServer()

    // Get current user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's invoices
    const { data: invoices, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", session.user.id)
      .order("invoice_date", { ascending: false })

    if (error) {
      console.error("Error fetching invoices:", error)
      return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
    }

    return NextResponse.json({ invoices })
  } catch (error) {
    console.error("Error in GET /api/user/invoices:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
