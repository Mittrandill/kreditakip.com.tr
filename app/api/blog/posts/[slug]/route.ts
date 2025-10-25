import { createSupabaseServer } from "@/lib/supabase-server"
import { NextRequest, NextResponse } from "next/server"

// GET - Get single published blog post by slug (public)
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = createSupabaseServer()

    const { data: post, error } = await supabase
      .from("blog_posts")
      .select(`
        *,
        category:blog_categories(*),
        author:profiles(id, first_name, last_name)
      `)
      .eq("slug", params.slug)
      .eq("status", "published")
      .single()

    if (error) {
      console.error("Error fetching blog post:", error)
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 })
    }

    // Increment views count
    await supabase
      .from("blog_posts")
      .update({ views: (post.views || 0) + 1 })
      .eq("id", post.id)

    return NextResponse.json({ post })
  } catch (error) {
    console.error("Error in GET /api/blog/posts/[slug]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
