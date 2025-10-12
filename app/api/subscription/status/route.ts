import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserSubscription, getUserUsage } from "@/lib/api/subscriptions"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get subscription
    const subscription = await getUserSubscription(user.id)

    // Get usage for both features
    const ocrUsage = await getUserUsage(user.id, "ocr_analysis")
    const riskUsage = await getUserUsage(user.id, "risk_analysis")

    return NextResponse.json({
      subscription,
      usage: {
        ocr_analysis: ocrUsage,
        risk_analysis: riskUsage,
      },
      isPremium: subscription?.plan_type === "premium",
    })
  } catch (error) {
    console.error("Error fetching subscription status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
