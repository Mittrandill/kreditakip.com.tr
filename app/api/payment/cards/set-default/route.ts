import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// POST - Varsayılan kartı ayarla
export async function POST(request: Request) {
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

    const body = await request.json()
    const { cardId } = body

    if (!cardId) {
      return NextResponse.json({ success: false, error: "Kart ID gerekli" }, { status: 400 })
    }

    // Kartın kullanıcıya ait olduğunu kontrol et
    const { data: card, error: cardError } = await supabase
      .from("paytr_saved_cards")
      .select("id, user_id")
      .eq("id", cardId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (cardError || !card) {
      return NextResponse.json({ success: false, error: "Kart bulunamadı veya yetkiniz yok" }, { status: 404 })
    }

    // Önce tüm kartların is_default'unu false yap
    const { error: resetError } = await supabase
      .from("paytr_saved_cards")
      .update({
        is_default: false,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)

    if (resetError) {
      console.error("[set-default] Reset error:", resetError)
      return NextResponse.json(
        { success: false, error: "Varsayılan kart güncellenirken hata oluştu" },
        { status: 500 }
      )
    }

    // Seçilen kartı varsayılan yap
    const { error: setError } = await supabase
      .from("paytr_saved_cards")
      .update({
        is_default: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", cardId)
      .eq("user_id", user.id)

    if (setError) {
      console.error("[set-default] Set error:", setError)
      return NextResponse.json(
        { success: false, error: "Varsayılan kart güncellenirken hata oluştu" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Varsayılan kart güncellendi",
    })
  } catch (error: any) {
    console.error("[set-default] Error:", error)
    return NextResponse.json({ success: false, error: error.message || "Bir hata oluştu" }, { status: 500 })
  }
}
