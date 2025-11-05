import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
import { createWeeklyPaymentNotifications, createOverduePaymentNotifications } from "@/lib/api/notifications-server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Hem yaklaşan hem geciken ödemeler için bildirim oluştur
    const [reminderNotifications, overdueNotifications] = await Promise.all([
      createWeeklyPaymentNotifications(userId),
      createOverduePaymentNotifications(userId),
    ])

    const totalCount = (reminderNotifications?.length || 0) + (overdueNotifications?.length || 0)

    return NextResponse.json({
      success: true,
      message: `${totalCount} yeni bildirim oluşturuldu`,
      notifications: [...(reminderNotifications || []), ...(overdueNotifications || [])],
      reminderCount: reminderNotifications?.length || 0,
      overdueCount: overdueNotifications?.length || 0,
    })
  } catch (error) {
    console.error("Error in auto-create notifications:", error)
    return NextResponse.json({ error: "Bildirimler oluşturulurken hata oluştu" }, { status: 500 })
  }
}
