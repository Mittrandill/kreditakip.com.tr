import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
import { createWeeklyPaymentNotifications } from "@/lib/api/notifications-server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const notifications = await createWeeklyPaymentNotifications(userId)

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
