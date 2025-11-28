import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { planId, email, name } = body

    if (!planId || !email) {
      return NextResponse.json(
        { error: "Plan ID and email are required" },
        { status: 400 }
      )
    }

    // Get plan details
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: plan, error: planError } = await supabaseAdmin
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .eq("is_active", true)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    // Create or update Paddle customer
    let customerId: string | null = null
    const { data: existingCustomer } = await supabaseAdmin
      .from("paddle_customers")
      .select("paddle_customer_id")
      .eq("user_id", user.id)
      .single()

    if (existingCustomer) {
      customerId = existingCustomer.paddle_customer_id
    }

    // Generate success and cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
      `${request.nextUrl.protocol}//${request.nextUrl.host}`
    const successUrl = `${baseUrl}/api/paddle/success`
    const cancelUrl = `${baseUrl}/uygulama/premium?canceled=true`

    return NextResponse.json({
      success: true,
      successUrl,
      cancelUrl,
      customerId,
      plan: {
        id: plan.id,
        name: plan.name,
        paddle_price_id: plan.paddle_price_id,
        price: plan.price,
      },
    })
  } catch (error: any) {
    console.error("[Paddle Checkout] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}