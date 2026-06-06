import { createSupabaseServer } from "@/lib/supabase-server"
import { checkAdminAPI } from "@/lib/admin-check"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// GET - Get single blog post (admin only)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Admin + MFA (AAL2) check
    const adminCheck = await checkAdminAPI(request)
    if (adminCheck) return adminCheck

    const supabase = await createSupabaseServer()

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
    // Admin + MFA (AAL2) check
    const adminCheck = await checkAdminAPI(request)
    if (adminCheck) return adminCheck

    const supabase = await createSupabaseServer()

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
    // Admin + MFA (AAL2) check
    const adminCheck = await checkAdminAPI(request)
    if (adminCheck) return adminCheck

    const supabase = await createSupabaseServer()

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
