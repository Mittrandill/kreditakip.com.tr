import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch billing info
    const { data: billingInfo, error: fetchError } = await supabase
      .from("billing_info")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error fetching billing info:", fetchError)
      return NextResponse.json({ error: "Failed to fetch billing info" }, { status: 500 })
    }

    return NextResponse.json({ billingInfo: billingInfo || null })
  } catch (error) {
    console.error("Billing info fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      fullName,
      email,
      phone,
      address,
      city,
      district,
      postalCode,
      country,
      taxNumber,
      taxOffice,
      identityNumber,
    } = body

    // Validate required fields
    if (!fullName || !email || !phone || !address || !city) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Upsert billing info
    const { data: billingInfo, error: upsertError } = await supabase
      .from("billing_info")
      .upsert(
        {
          user_id: user.id,
          full_name: fullName,
          email: email,
          phone: phone,
          address: address,
          city: city,
          district: district || null,
          postal_code: postalCode || null,
          country: country || "Turkey",
          tax_number: taxNumber || null,
          tax_office: taxOffice || null,
          identity_number: identityNumber || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )
      .select()
      .single()

    if (upsertError) {
      console.error("Error upserting billing info:", upsertError)
      return NextResponse.json({ error: "Failed to update billing info" }, { status: 500 })
    }

    return NextResponse.json({ success: true, billingInfo })
  } catch (error) {
    console.error("Billing info update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
