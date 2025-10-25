import { createSupabaseServer } from "@/lib/supabase-server"
import { NextRequest, NextResponse } from "next/server"

// GET - List published blog posts (public)
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get("category")
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Build query - only show published posts
    let query = supabase
      .from("blog_posts")
      .select(`
        *,
        category:blog_categories(*),
        author:profiles(id, first_name, last_name)
      `)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (category) {
      query = query.eq("category_id", category)
    }

    const { data: posts, error } = await query

    if (error) {
      console.error("Error fetching blog posts:", error)
      return NextResponse.json({ error: "Failed to fetch blog posts" }, { status: 500 })
    }

    return NextResponse.json({ posts })
  } catch (error) {
    console.error("Error in GET /api/blog/posts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
