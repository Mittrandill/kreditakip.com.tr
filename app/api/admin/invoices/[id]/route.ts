import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await request.json()
    const invoiceId = params.id

    console.log("[admin/invoices/[id] PATCH] Updating invoice:", invoiceId)

    const { data: invoice, error } = await supabase
      .from("invoices")
      .update(body)
      .eq("id", invoiceId)
      .select()
      .single()

    if (error) {
      console.error("[admin/invoices/[id] PATCH] Error:", error)
      return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 })
    }

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error("[admin/invoices/[id] PATCH] Exception:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
