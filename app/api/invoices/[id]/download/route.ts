import { createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * Secure invoice download.
 *
 * Invoice PDFs live in a PRIVATE storage bucket. This endpoint authenticates the
 * caller, verifies they own the invoice (or are an admin), then issues a
 * short-lived signed URL and redirects to it. The raw storage path / public URL
 * is never exposed and files can't be enumerated or fetched without auth.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 1) Authenticated user
    const authClient = await createServerClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2) Service-role client to read the invoice + sign the object
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: invoice, error } = await admin
      .from("invoices")
      .select("user_id, file_url")
      .eq("id", params.id)
      .single()

    if (error || !invoice || !invoice.file_url) {
      return NextResponse.json({ error: "Fatura bulunamadı" }, { status: 404 })
    }

    // 3) Authorization: owner or admin only
    if (invoice.user_id !== user.id) {
      const { data: profile } = await admin
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single()

      if (!profile?.is_admin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    // 4) Derive the storage object path from the stored value.
    //    Supports both legacy public URLs (".../object/public/invoices/<path>")
    //    and a raw "<user_id>/<file>.pdf" path.
    let path = invoice.file_url
    const marker = "/invoices/"
    const idx = path.indexOf(marker)
    if (idx !== -1) {
      path = path.substring(idx + marker.length)
    }
    path = decodeURIComponent(path.split("?")[0])

    // 5) Short-lived signed URL
    const { data: signed, error: signError } = await admin.storage
      .from("invoices")
      .createSignedUrl(path, 120) // 2 minutes

    if (signError || !signed?.signedUrl) {
      console.error("[invoice-download] Failed to sign URL:", signError)
      return NextResponse.json({ error: "İndirme bağlantısı oluşturulamadı" }, { status: 500 })
    }

    return NextResponse.redirect(signed.signedUrl)
  } catch (e) {
    console.error("[invoice-download] Error:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
