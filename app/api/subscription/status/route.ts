import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single()

    // Get usage tracking
    const { data: usage } = await supabase.from("usage_tracking").select("*").eq("user_id", user.id)

    return NextResponse.json({
      subscription,
      usage,
    })
  } catch (error) {
    console.error("[v0] Subscription status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
