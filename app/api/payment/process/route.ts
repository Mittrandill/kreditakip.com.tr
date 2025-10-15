import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  console.log("[v0] Payment process started")

  try {
    const body = await request.json()
    const { userId, email, name, card } = body

    console.log("[v0] Processing payment for user:", userId)

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify user exists
    const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (profileError || !profile) {
      console.error("[v0] Profile not found:", profileError)
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 })
    }

    console.log("[v0] Profile verified:", profile.email)

    const { data: existingSub } = await supabase.from("subscriptions").select("*").eq("user_id", userId).maybeSingle()

    console.log("[v0] Existing subscription:", existingSub ? "found" : "not found")

    // TODO: Integrate with iyzico payment API here
    // For now, we'll simulate a successful payment

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const now = new Date().toISOString()

    let subData, subError

    if (existingSub) {
      // Update existing subscription
      const result = await supabase
        .from("subscriptions")
        .update({
          plan_type: "premium",
          status: "active",
          started_at: now,
          expires_at: expiresAt,
          payment_method: "credit_card",
          updated_at: now,
        })
        .eq("user_id", userId)
        .select()

      subData = result.data
      subError = result.error
      console.log("[v0] Updated existing subscription")
    } else {
      // Insert new subscription
      const result = await supabase
        .from("subscriptions")
        .insert({
          user_id: userId,
          plan_type: "premium",
          status: "active",
          started_at: now,
          expires_at: expiresAt,
          payment_method: "credit_card",
        })
        .select()

      subData = result.data
      subError = result.error
      console.log("[v0] Created new subscription")
    }

    if (subError) {
      console.error("[v0] Subscription error:", subError)
      return NextResponse.json({ error: "Abonelik güncellenemedi: " + subError.message }, { status: 500 })
    }

    console.log("[v0] Subscription updated successfully:", subData)

    const { data: txData, error: txError } = await supabase
      .from("payment_transactions")
      .insert({
        user_id: userId,
        subscription_id: subData?.[0]?.id,
        amount: 199.0,
        currency: "TRY",
        status: "completed",
        payment_method: "credit_card",
        iyzico_conversation_id: `sim_${Date.now()}`,
      })
      .select()

    if (txError) {
      console.error("[v0] Transaction record error:", txError)
    } else {
      console.log("[v0] Transaction recorded:", txData)
    }

    console.log("[v0] Payment successful, subscription activated")

    return NextResponse.json({
      success: true,
      message: "Ödeme başarılı, premium üyelik aktif edildi",
    })
  } catch (error) {
    console.error("[v0] Payment process error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ödeme işlemi başarısız" },
      { status: 500 },
    )
  }
}
