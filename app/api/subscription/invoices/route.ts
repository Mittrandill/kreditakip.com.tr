import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    console.log("[API] Invoices API called")

    // Kullanıcı kontrolü
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Kullanıcının ödeme işlemlerini al
    const { data: transactions, error: txError } = await supabase
      .from("payment_transactions")
      .select(
        `
        *,
        subscriptions (
          plan_id,
          plan_type
        )
      `,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (txError) {
      console.error("[API] Error fetching transactions:", txError)
      return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      invoices: transactions || [],
    })
  } catch (error: any) {
    console.error("[API] Get invoices error:", error)
    return NextResponse.json(
      {
        error: error.message || "Bir hata oluştu",
      },
      { status: 500 },
    )
  }
}
