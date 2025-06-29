import { type NextRequest, NextResponse } from "next/server"
import { createUpcomingPaymentNotifications } from "@/lib/api/notifications"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Kullanıcının varlığını kontrol et
    const { data: user, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Otomatik bildirimleri oluştur
    const notifications = await createUpcomingPaymentNotifications(userId)

    return NextResponse.json({
      success: true,
      message: `${notifications?.length || 0} yeni bildirim oluşturuldu`,
      notifications,
    })
  } catch (error) {
    console.error("Error in auto-create notifications:", error)
    return NextResponse.json({ error: "Bildirimler oluşturulurken hata oluştu" }, { status: 500 })
  }
}
