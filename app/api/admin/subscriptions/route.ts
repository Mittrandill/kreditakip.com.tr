import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

export async function GET() {
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
