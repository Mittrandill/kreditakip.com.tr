import { createSupabaseServer } from "@/lib/supabase-server"
import { NextRequest, NextResponse } from "next/server"

// GET - List all blog categories (admin only)
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
    console.error("Error in GET /api/admin/blog/categories:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create new blog category (admin only)
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
    const { name, slug, description } = body

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: "Missing required fields: name, slug" },
        { status: 400 }
      )
    }

    const { data: category, error } = await supabase
      .from("blog_categories")
      .insert({ name, slug, description })
      .select()
      .single()

    if (error) {
      console.error("Error creating blog category:", error)

      // Check for unique constraint violation
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A blog category with this name or slug already exists" },
          { status: 409 }
        )
      }

      return NextResponse.json({ error: "Failed to create blog category" }, { status: 500 })
    }

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/admin/blog/categories:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
