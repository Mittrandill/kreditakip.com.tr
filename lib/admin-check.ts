import { createSupabaseServer } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { NextRequest, NextResponse } from "next/server"

type AdminCheckOptions = {
  /**
   * When true (default) the admin must have completed TOTP MFA this session
   * (AAL2). Set to false only on the MFA enrollment/challenge pages themselves
   * to avoid redirect loops.
   */
  requireMFA?: boolean
}

export async function checkAdminAccess(options: AdminCheckOptions = {}) {
  const { requireMFA = true } = options
  const supabase = await createSupabaseServer()

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

  // SECURITY: Enforce TOTP MFA (AAL2) for the admin panel.
  if (requireMFA) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

    // No verified factor at all -> admin must enroll a TOTP authenticator.
    if (aal?.nextLevel !== "aal2") {
      redirect("/admin/mfa-setup")
    }

    // Has a verified factor but this session is still AAL1 -> must enter code.
    if (aal.currentLevel !== "aal2") {
      redirect("/admin/mfa")
    }
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
    // Create Supabase client that can read from cookies
    const supabase = await createSupabaseServer()

    // Get session from cookies
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Authentication required" },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", session.user.id)
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

    // SECURITY: Require completed TOTP MFA (AAL2) for admin API access.
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal?.currentLevel !== "aal2") {
      return NextResponse.json(
        { error: "MFA required", code: "mfa_required" },
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
