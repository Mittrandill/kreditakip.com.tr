import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`

    if (!process.env.CRON_SECRET) {
      console.error("CRON_SECRET not configured")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    if (!authHeader || authHeader !== expectedAuth) {
      console.error("Unauthorized cron access attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (process.env.NODE_ENV === "production") {
      const origin = request.headers.get("origin")
      const userAgent = request.headers.get("user-agent")

      // Log for monitoring
      console.log(`Cron job triggered - Origin: ${origin}, User-Agent: ${userAgent}`)
    }

    // Aktif kullanıcıları al (e-posta bildirimleri açık olanlar)
    const { data: users, error: usersError } = await supabase
      .from("notification_preferences")
      .select("user_id, email_3_days_before, email_1_day_before, email_on_due_date, email_overdue")
      .eq("email_enabled", true)

    if (usersError) {
      console.error("Error fetching users:", usersError)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    const results = {
      totalUsers: users.length,
      notifications: {
        "3_days_before": 0,
        "1_day_before": 0,
        due_date: 0,
        overdue: 0,
      },
      errors: [],
    }

    // Her kullanıcı için bildirimleri kontrol et ve gönder
    for (const user of users) {
      try {
        // 3 gün önceden bildirim
        if (user.email_3_days_before) {
          const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/notifications/send-reminders`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "KrediTakip-Cron/1.0",
            },
            body: JSON.stringify({ userId: user.user_id, type: "3_days_before" }),
          })

          if (response.ok) {
            const result = await response.json()
            results.notifications["3_days_before"] += result.emailsSent || 0
          }
        }

        // 1 gün önceden bildirim
        if (user.email_1_day_before) {
          const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/notifications/send-reminders`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "KrediTakip-Cron/1.0",
            },
            body: JSON.stringify({ userId: user.user_id, type: "1_day_before" }),
          })

          if (response.ok) {
            const result = await response.json()
            results.notifications["1_day_before"] += result.emailsSent || 0
          }
        }

        // Vade günü bildirim
        if (user.email_on_due_date) {
          const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/notifications/send-reminders`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "KrediTakip-Cron/1.0",
            },
            body: JSON.stringify({ userId: user.user_id, type: "due_date" }),
          })

          if (response.ok) {
            const result = await response.json()
            results.notifications["due_date"] += result.emailsSent || 0
          }
        }

        // Gecikme bildirim
        if (user.email_overdue) {
          const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/notifications/send-reminders`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "KrediTakip-Cron/1.0",
            },
            body: JSON.stringify({ userId: user.user_id, type: "overdue" }),
          })

          if (response.ok) {
            const result = await response.json()
            results.notifications["overdue"] += result.emailsSent || 0
          }
        }

        const delay = Math.min(100 * Math.pow(1.1, results.errors.length), 1000)
        await new Promise((resolve) => setTimeout(resolve, delay))
      } catch (error) {
        console.error(`Error processing user ${user.user_id}:`, error)
        results.errors.push({
          userId: user.user_id,
          error: error.message,
        })
      }
    }

    const totalSent = Object.values(results.notifications).reduce((sum, count) => sum + count, 0)

    return NextResponse.json({
      success: true,
      message: `Cron job completed. ${totalSent} emails sent to ${results.totalUsers} users.`,
      results,
    })
  } catch (error) {
    console.error("Cron job error:", error)
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 })
  }
}
