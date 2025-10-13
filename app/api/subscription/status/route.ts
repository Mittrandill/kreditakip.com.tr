import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log("[v0] Subscription status API called")
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("[v0] Auth check:", { userId: user?.id, authError })

    if (authError || !user) {
      console.log("[v0] Unauthorized access attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Fetching subscription for user:", user.id)

    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()

    console.log("[v0] Subscription query result:", { subscription, subError })

    // Get usage tracking
    const { data: usage, error: usageError } = await supabase.from("usage_tracking").select("*").eq("user_id", user.id)

    console.log("[v0] Usage tracking result:", { usage, usageError })

    const response = {
      subscription,
      usage,
    }

    console.log("[v0] Returning subscription status:", response)

    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] Subscription status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
