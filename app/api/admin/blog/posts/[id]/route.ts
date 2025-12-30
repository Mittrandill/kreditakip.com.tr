import { createSupabaseServer } from "@/lib/supabase-server"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// GET - Get single blog post (admin only)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createSupabaseServer()

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

    const { data: post, error } = await supabase
      .from("blog_posts")
      .select(`
        *,
        category:blog_categories(*),
        author:profiles(id, first_name, last_name, email)
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Error fetching blog post:", error)
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 })
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error("Error in GET /api/admin/blog/posts/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update blog post (admin only)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createSupabaseServer()

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

    const updateData: any = {}

    if (title !== undefined) updateData.title = title
    if (slug !== undefined) updateData.slug = slug
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (content !== undefined) updateData.content = content
    if (featured_image !== undefined) updateData.featured_image = featured_image
    if (category_id !== undefined) updateData.category_id = category_id
    if (status !== undefined) updateData.status = status
    if (read_time !== undefined) updateData.read_time = read_time

    // Set published_at if status is changing to published
    if (status === "published") {
      // Check if it was previously published
      const { data: currentPost } = await supabase
        .from("blog_posts")
        .select("published_at")
        .eq("id", params.id)
        .single()

      if (!currentPost?.published_at) {
        updateData.published_at = new Date().toISOString()
      }
    }

    const { data: post, error } = await supabase
      .from("blog_posts")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating blog post:", error)

      // Check for unique constraint violation
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A blog post with this slug already exists" },
          { status: 409 }
        )
      }

      return NextResponse.json({ error: "Failed to update blog post" }, { status: 500 })
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error("Error in PUT /api/admin/blog/posts/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete blog post (admin only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createSupabaseServer()

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

    const { error } = await supabase
      .from("blog_posts")
      .delete()
      .eq("id", params.id)

    if (error) {
      console.error("Error deleting blog post:", error)
      return NextResponse.json({ error: "Failed to delete blog post" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/admin/blog/posts/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
