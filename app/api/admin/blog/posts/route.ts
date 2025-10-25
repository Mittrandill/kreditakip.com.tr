import { createSupabaseServer } from "@/lib/supabase-server"
import { NextRequest, NextResponse } from "next/server"

// GET - List all blog posts (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()

    // Check authentication and admin status
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", session.user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const category = searchParams.get("category")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Build query
    let query = supabase
      .from("blog_posts")
      .select(`
        *,
        category:blog_categories(*),
        author:profiles(id, first_name, last_name, email)
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq("status", status)
    }

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
    console.error("Error in GET /api/admin/blog/posts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create new blog post (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()

    // Check authentication and admin status
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", session.user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      slug,
      excerpt,
      content,
      featured_image,
      category_id,
      status,
      read_time,
    } = body

    // Validate required fields
    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: "Missing required fields: title, slug, content" },
        { status: 400 }
      )
    }

    // Create the blog post
    const postData: any = {
      title,
      slug,
      excerpt,
      content,
      featured_image,
      category_id: category_id || null,
      author_id: session.user.id,
      status: status || "draft",
      read_time: read_time || null,
    }

    // Set published_at if status is published
    if (status === "published") {
      postData.published_at = new Date().toISOString()
    }

    const { data: post, error } = await supabase
      .from("blog_posts")
      .insert(postData)
      .select()
      .single()

    if (error) {
      console.error("Error creating blog post:", error)

      // Check for unique constraint violation
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A blog post with this slug already exists" },
          { status: 409 }
        )
      }

      return NextResponse.json({ error: "Failed to create blog post" }, { status: 500 })
    }

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/admin/blog/posts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
