import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@/lib/supabase/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Subscription status API called")

    // SECURITY FIX: Use authenticated user instead of query parameter
    const supabaseAuth = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Unauthorized: No authenticated user")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = user.id
    console.log("[v0] Fetching subscription for authenticated user:", userId)

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle()

    console.log("[v0] Subscription query result:", { subscription, subError })

    // Abonelik bitiş kontrolü - süresi dolmuşsa otomatik iptal et
    if (subscription && subscription.expires_at) {
      const expiresAt = new Date(subscription.expires_at)
      const now = new Date()

      if (expiresAt < now) {
        console.log("[v0] Subscription expired, updating status to expired")

        // Aboneliği "expired" olarak güncelle
        await supabase
          .from("subscriptions")
          .update({
            status: "expired",
            updated_at: new Date().toISOString(),
          })
          .eq("id", subscription.id)

        // Usage limits'i free plan'e düşür
        await supabase
          .from("usage_tracking")
          .update({
            limit_count: 1,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("feature_type", "ocr_analysis")

        // Response'ta expired subscription döndür
        subscription.status = "expired"
      }
    }

    // Get usage tracking
    const { data: usage, error: usageError } = await supabase.from("usage_tracking").select("*").eq("user_id", userId)

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
