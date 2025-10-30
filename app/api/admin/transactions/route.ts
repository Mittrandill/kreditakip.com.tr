import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get("subscriptionId")

    console.log("[admin/transactions] Fetching transaction for subscription:", subscriptionId)

    if (!subscriptionId) {
      console.error("[admin/transactions] Missing subscriptionId")
      return NextResponse.json({ error: "subscriptionId is required" }, { status: 400 })
    }

    const { data: transaction, error } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("subscription_id", subscriptionId)
      .single()

    if (error) {
      console.error("[admin/transactions] Error fetching transaction:", error)
      console.error("[admin/transactions] Error details:", JSON.stringify(error, null, 2))

      // If no transaction found, return null instead of error
      if (error.code === "PGRST116") {
        console.log("[admin/transactions] No transaction found, returning null")
        return NextResponse.json({ transaction: null })
      }

      return NextResponse.json({ error: "Failed to fetch transaction" }, { status: 500 })
    }

    console.log("[admin/transactions] Transaction found:", transaction?.id)
    return NextResponse.json({ transaction })
  } catch (error) {
    console.error("[admin/transactions] Exception:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
