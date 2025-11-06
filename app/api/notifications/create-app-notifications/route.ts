import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase-server"
import { createWeeklyPaymentNotifications, createOverduePaymentNotifications } from "@/lib/api/notifications-server"
import { timingSafeEqual } from "node:crypto"

export const dynamic = "force-dynamic"

/**
 * Scheduled cron job endpoint - Sadece uygulama içi bildirimler oluşturur
 * Email gönderimi yapmaz (email için send-email-notifications.yml kullanılıyor)
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Bearer token authentication
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get("authorization")

    if (!cronSecret) {
      console.error("[create-app-notifications] CRON_SECRET environment variable not set")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Use constant-time comparison to prevent timing attacks
    let isAuthenticated = false
    try {
      const tokenBuffer = Buffer.from(token)
      const secretBuffer = Buffer.from(cronSecret)

      if (tokenBuffer.length === secretBuffer.length) {
        isAuthenticated = timingSafeEqual(new Uint8Array(tokenBuffer), new Uint8Array(secretBuffer))
      }
    } catch (error) {
      console.error("[create-app-notifications] Error during authentication:", error)
      isAuthenticated = false
    }

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createSupabaseAdmin()

    // TÜM aktif kullanıcıları al (email tercihi fark etmez, app bildirimleri için)
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id")
      .not("id", "is", null)

    if (profilesError) {
      console.error("[create-app-notifications] Error fetching profiles:", profilesError)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    const results = {
      totalUsers: profiles?.length || 0,
      appNotifications: {
        reminder: 0,
        overdue: 0,
      },
      errors: [] as Array<{ userId: string; error: string }>,
    }

    console.log(`[create-app-notifications] Creating notifications for ${results.totalUsers} users...`)

    // Tüm kullanıcılar için uygulama içi bildirimler oluştur
    for (const profile of profiles || []) {
      try {
        // Hatırlatma bildirimleri oluştur (3 gün içinde vadesi gelenler)
        const reminderNotifs = await createWeeklyPaymentNotifications(profile.id)
        results.appNotifications.reminder += reminderNotifs?.length || 0

        // Gecikme bildirimleri oluştur (vadesi geçmiş olanlar)
        const overdueNotifs = await createOverduePaymentNotifications(profile.id)
        results.appNotifications.overdue += overdueNotifs?.length || 0

        if (reminderNotifs?.length || overdueNotifs?.length) {
          console.log(
            `[create-app-notifications] User ${profile.id}: ${reminderNotifs?.length || 0} reminders, ${overdueNotifs?.length || 0} overdue`,
          )
        }
      } catch (error) {
        console.error(`[create-app-notifications] Error creating notifications for user ${profile.id}:`, error)
        results.errors.push({
          userId: profile.id,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    const totalAppNotifs = results.appNotifications.reminder + results.appNotifications.overdue

    console.log(
      `[create-app-notifications] Completed: ${totalAppNotifs} app notifications created for ${results.totalUsers} users`,
    )

    return NextResponse.json({
      success: true,
      message: `${totalAppNotifs} app notifications created for ${results.totalUsers} users.`,
      results,
    })
  } catch (error) {
    console.error("[create-app-notifications] Cron job error:", error)
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 })
  }
}
