import { createSupabaseServer } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function checkAdminAccess() {
  const supabase = createSupabaseServer()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/admin/giris")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", session.user.id)
    .single()

  // Debug log
  if (profileError) {
    console.error("Profile fetch error in checkAdminAccess:", profileError)
  }

  if (!profile?.is_admin) {
    // Don't sign out here - causes issues in server component
    // Just redirect to admin login
    redirect("/admin/giris")
  }

  return { session, profile }
}

/**
 * Checks if the request is from an admin user for API routes
 * Returns NextResponse with 401/403 error if not authenticated or not admin
 * Returns null if user is admin (proceed with request)
 */
export async function checkAdminAPI(request: NextRequest): Promise<NextResponse | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get session from request cookies
    const authHeader = request.headers.get("authorization")
    const cookieHeader = request.headers.get("cookie")

    // Try to get user from auth header or cookies
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '') || undefined
    )

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Authentication required" },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Profile fetch error in checkAdminAPI:", profileError)
      return NextResponse.json(
        { error: "Failed to verify admin status" },
        { status: 500 }
      )
    }

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }

    // User is admin, return null to proceed
    return null
  } catch (error) {
    console.error("Error in checkAdminAPI:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
