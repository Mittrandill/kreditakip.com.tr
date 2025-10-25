import { createSupabaseServer } from "@/lib/supabase-server"
import { redirect } from "next/navigation"

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
