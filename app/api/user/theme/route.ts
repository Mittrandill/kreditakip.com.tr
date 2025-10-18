import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

// GET - Fetch user theme
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("theme")
      .eq("id", user.id)
      .single()

    if (error) {
      console.error("[API] Error fetching theme:", error)
      return NextResponse.json({ theme: "light" }) // Default fallback
    }

    return NextResponse.json({ theme: profile?.theme || "light" })
  } catch (error: any) {
    console.error("[API] Theme fetch error:", error)
    return NextResponse.json({ theme: "light" }, { status: 500 })
  }
}

// POST - Update user theme
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { theme } = body

    if (!theme || !["light", "dark", "system"].includes(theme)) {
      return NextResponse.json({ error: "Invalid theme value" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase
      .from("profiles")
      .update({ theme })
      .eq("id", user.id)

    if (error) {
      console.error("[API] Error updating theme:", error)
      return NextResponse.json({ error: "Failed to update theme" }, { status: 500 })
    }

    return NextResponse.json({ success: true, theme })
  } catch (error: any) {
    console.error("[API] Theme update error:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}
