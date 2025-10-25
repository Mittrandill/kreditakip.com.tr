import { createSupabaseServer } from "@/lib/supabase-server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()

    // Check if user is admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", session.user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const {
      userId,
      invoiceNumber,
      invoiceDate,
      dueDate,
      amount,
      currency,
      status,
      description,
      fileUrl,
      fileName,
    } = body

    // Validate required fields
    if (!userId || !invoiceNumber || !invoiceDate || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create invoice
    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({
        user_id: userId,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        due_date: dueDate || null,
        amount: parseFloat(amount),
        currency: currency || "TRY",
        status: status || "pending",
        description: description || null,
        file_url: fileUrl || null,
        file_name: fileName || null,
        created_by: session.user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating invoice:", error)
      return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 })
    }

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error("Error in POST /api/admin/invoices:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
