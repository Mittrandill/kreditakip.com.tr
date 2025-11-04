import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { checkAdminAPI } from "@/lib/admin-check"

export const dynamic = "force-dynamic"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  // SECURITY: Check admin authentication
  const adminCheck = await checkAdminAPI(request)
  if (adminCheck) return adminCheck

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get("subscriptionId")


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
        return NextResponse.json({ transaction: null })
      }

      return NextResponse.json({ error: "Failed to fetch transaction" }, { status: 500 })
    }

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error("[admin/transactions] Exception:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
