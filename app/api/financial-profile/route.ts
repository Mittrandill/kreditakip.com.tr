import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@/lib/supabase/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    // SECURITY FIX: Use authenticated user instead of query parameter
    const supabaseAuth = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = user.id

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
      return NextResponse.json({
        user_id: userId,
        monthly_income: null,
        monthly_expenses: null,
        total_assets: null,
        total_liabilities: null,
        employment_status: null,
        housing_status: null,
        other_debt_obligations: null,
        savings_goals: null,
        risk_tolerance: null,
        employment_duration_months: null,
        annual_income: null,
        emergency_fund: null,
      })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("[v0] Financial profile API error:", error)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}
