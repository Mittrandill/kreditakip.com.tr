import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  console.log("[v0] Financial profile API called")

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      console.log("[v0] No userId provided")
      return NextResponse.json({ error: "User ID gereklidir" }, { status: 400 })
    }

    console.log("[v0] Fetching financial profile for user:", userId)

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: profile, error } = await supabase
      .from("financial_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()

    if (error) {
      console.error("[v0] Financial profile fetch error:", error)
      return NextResponse.json({ error: "Finansal profil alınamadı" }, { status: 500 })
    }

    if (!profile) {
      console.log("[v0] No financial profile found, returning empty profile")
      return NextResponse.json({
        user_id: userId,
        monthly_income: null,
        monthly_expenses: null,
        emergency_fund: null,
        real_estate_value: null,
        vehicle_value: null,
        credit_card_debt: null,
        other_debts: null,
      })
    }

    console.log("[v0] Financial profile found:", profile)
    return NextResponse.json(profile)
  } catch (error) {
    console.error("[v0] Financial profile API error:", error)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}
