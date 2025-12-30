import { createSupabaseServer } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"

// GET - List all blog categories (public)
export async function GET() {
  try {
    const supabase = await createSupabaseServer()

    const { data: categories, error } = await supabase
      .from("blog_categories")
      .select("*")
      .order("name", { ascending: true })

    if (error) {
      console.error("Error fetching blog categories:", error)
      return NextResponse.json({ error: "Failed to fetch blog categories" }, { status: 500 })
    }

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Error in GET /api/blog/categories:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
