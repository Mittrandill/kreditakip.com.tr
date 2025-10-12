import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID gereklidir" }, { status: 400 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 })
    }

    if (user.id !== userId) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
    }

    const { data: profile, error } = await supabase
      .from("financial_profiles")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (error) {
      console.error("[v0] Financial profile fetch error:", error)
      // Return empty profile if not found
      if (error.code === "PGRST116") {
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
      return NextResponse.json({ error: "Finansal profil alınamadı" }, { status: 500 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("[v0] Financial profile API error:", error)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}
