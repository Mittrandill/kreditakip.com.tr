import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { checkAdminAPI } from "@/lib/admin-check"

export const dynamic = "force-dynamic"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // SECURITY: Check admin authentication
  const adminCheck = await checkAdminAPI(request)
  if (adminCheck) return adminCheck

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await request.json()
    const invoiceId = params.id

    // SECURITY: Validate and sanitize input - only allow specific fields
    const allowedFields = ['status', 'payment_date', 'file_url', 'file_name', 'amount', 'currency', 'description']
    const sanitizedBody = Object.keys(body)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => ({ ...obj, [key]: body[key] }), {})

    if (Object.keys(sanitizedBody).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const { data: invoice, error } = await supabase
      .from("invoices")
      .update(sanitizedBody)
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
