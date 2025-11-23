import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// DELETE - Kartı sil (soft delete)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

    const cardId = params.id

    // Kartın kullanıcıya ait olduğunu kontrol et
    const { data: card, error: cardError } = await supabase
      .from("paytr_saved_cards")
      .select("id, user_id")
      .eq("id", cardId)
      .eq("user_id", user.id)
      .single()

    if (cardError || !card) {
      return NextResponse.json({ success: false, error: "Kart bulunamadı veya yetkiniz yok" }, { status: 404 })
    }

    // Soft delete - is_active = false
    const { error: deleteError } = await supabase
      .from("paytr_saved_cards")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", cardId)
      .eq("user_id", user.id)

    if (deleteError) {
      console.error("[card-delete] Delete error:", deleteError)
      return NextResponse.json({ success: false, error: "Kart silinirken hata oluştu" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Kart başarıyla silindi",
    })
  } catch (error: any) {
    console.error("[card-delete] Error:", error)
    return NextResponse.json({ success: false, error: error.message || "Bir hata oluştu" }, { status: 500 })
  }
}
