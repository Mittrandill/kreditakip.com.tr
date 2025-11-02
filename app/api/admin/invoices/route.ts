import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get("paymentId")
    const subscriptionId = searchParams.get("subscriptionId")
    const invoiceNumber = searchParams.get("invoiceNumber")

    let query = supabase
      .from("invoices")
      .select("*")

    // Filter by payment_id if provided (most specific - matches iyzico_payment_id)
    if (paymentId) {
      query = query.eq("payment_id", paymentId)
    }
    // Filter by subscription if provided
    else if (subscriptionId) {
      query = query.eq("subscription_id", subscriptionId)
    }
    // Filter by invoice number if provided
    else if (invoiceNumber) {
      query = query.eq("invoice_number", invoiceNumber)
    }

    const { data: invoices, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching invoices:", error)
      return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
    }

    return NextResponse.json({ invoices })
  } catch (error) {
    console.error("Error in GET /api/admin/invoices:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await request.json()


    const { userId, subscriptionId, invoiceNumber, invoiceDate, amount, currency, status, description } = body

      userId,
      subscriptionId,
      invoiceNumber,
      invoiceDate,
      amount,
      currency,
      status,
      description
    })

    if (!userId || !invoiceNumber || amount === undefined || amount === null) {
      console.error("[admin/invoices POST] Missing required fields:", {
        hasUserId: !!userId,
        hasInvoiceNumber: !!invoiceNumber,
        hasAmount: amount !== undefined && amount !== null
      })
      return NextResponse.json({
        error: "Missing required fields",
        details: { userId: !!userId, invoiceNumber: !!invoiceNumber, amount: amount !== undefined }
      }, { status: 400 })
    }

    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({
        user_id: userId,
        subscription_id: subscriptionId,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        amount,
        currency: currency || "TRY",
        status: status || "pending",
        description,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating invoice:", error)
      return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 })
    }

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/admin/invoices:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
