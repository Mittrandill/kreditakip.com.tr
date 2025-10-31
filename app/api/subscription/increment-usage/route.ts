import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { featureType } = await request.json()

    if (!featureType) {
      return NextResponse.json({ error: "Feature type is required" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Call the database function to increment usage
    const { data, error } = await supabase.rpc("increment_usage", {
      p_user_id: user.id,
      p_feature_type: featureType,
    })

    if (error) {
      console.error("[v0] Usage increment error:", error)
      return NextResponse.json({ error: "Failed to increment usage" }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Usage limit exceeded", limitExceeded: true }, { status: 403 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Usage increment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
