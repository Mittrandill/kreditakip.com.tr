import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - Kullanıcının kayıtlı kartlarını listele
export async function GET() {
  try {
    const supabase = await createClient()

    // Kullanıcı kontrolü
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Kayıtlı kartları getir
    const { data: cards, error: cardsError } = await supabase
      .from("paytr_saved_cards")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })

    if (cardsError) {
      console.error("[cards] Fetch error:", cardsError)
      return NextResponse.json({ success: false, error: "Kartlar getirilirken hata oluştu" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      cards: cards || [],
    })
  } catch (error: any) {
    console.error("[cards] Error:", error)
    return NextResponse.json({ success: false, error: error.message || "Bir hata oluştu" }, { status: 500 })
  }
}
