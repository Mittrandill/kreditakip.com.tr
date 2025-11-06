const { createClient } = require("@supabase/supabase-js")

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SERVICE_ROLE_KEY
)

/**
 * Uygulama içi bildirimler oluşturur
 * Email workflow'undan bağımsız çalışır
 */
async function createAppNotifications() {
  try {
    console.log("📱 App notification workflow started")

    // Supabase bağlantı kontrolü
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL not configured")
    }

    if (!process.env.SERVICE_ROLE_KEY) {
      throw new Error("SERVICE_ROLE_KEY not configured")
    }

    // TÜM aktif kullanıcıları al
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, first_name")
      .not("id", "is", null)

    if (profilesError) {
      throw new Error(`Profiles fetch error: ${profilesError.message}`)
    }

    console.log(`👥 Found ${profiles?.length || 0} users`)

    let totalReminders = 0
    let totalOverdue = 0

    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]
    const threeDaysLater = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    for (const profile of profiles || []) {
      try {
        // 1. HATIRLATMA BİLDİRİMLERİ (3 gün içinde vadesi gelenler)

        // Mevcut app_reminder bildirimlerini kontrol et
        const { data: existingReminders } = await supabase
          .from("notifications")
          .select("payment_plan_id")
          .eq("user_id", profile.id)
          .eq("notification_type", "app_reminder")
          .is("deleted_at", null)

        const existingReminderPlanIds = new Set(existingReminders?.map((n) => n.payment_plan_id) || [])

        // 3 gün içinde vadesi gelen ödemeleri getir
        const { data: upcomingPayments } = await supabase
          .from("payment_plans")
          .select(`
            id,
            credit_id,
            installment_number,
            due_date,
            total_payment,
            credits!inner (
              id,
              user_id,
              banks (name)
            )
          `)
          .eq("credits.user_id", profile.id)
          .eq("status", "pending")
          .gte("due_date", todayStr)
          .lte("due_date", threeDaysLater)

        // Henüz bildirimi olmayan ödemeler için bildirim oluştur
        const reminderNotifications = (upcomingPayments || [])
          .filter((payment) => !existingReminderPlanIds.has(payment.id))
          .map((payment) => {
            const dueDate = new Date(payment.due_date)
            const diffTime = dueDate.getTime() - today.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            let title = "Kredi Taksit Hatırlatması"
            let type = "info"

            if (diffDays <= 0) {
              title = "Kredi Taksit Hatırlatması - Bugün"
              type = "error"
            } else if (diffDays === 1) {
              title = "Kredi Taksit Hatırlatması - Yarın"
              type = "warning"
            } else if (diffDays <= 3) {
              title = `Kredi Taksit Hatırlatması - ${diffDays} Gün Sonra`
              type = "warning"
            }

            return {
              user_id: profile.id,
              credit_id: payment.credit_id,
              payment_plan_id: payment.id,
              notification_type: "app_reminder",
              title,
              message: `${payment.credits.banks.name} bankasından ${payment.installment_number}. taksit ödemenizin vadesi ${dueDate.toLocaleDateString("tr-TR")} tarihinde doluyor. Tutar: ${payment.total_payment.toLocaleString("tr-TR")} ₺`,
              type,
              is_read: false,
            }
          })

        if (reminderNotifications.length > 0) {
          const { error: reminderError } = await supabase
            .from("notifications")
            .insert(reminderNotifications)

          if (reminderError && reminderError.code !== "23505") {
            console.error(`❌ Error creating reminders for user ${profile.id}:`, reminderError)
          } else {
            totalReminders += reminderNotifications.length
            console.log(`✅ Created ${reminderNotifications.length} reminder(s) for ${profile.email}`)
          }
        }

        // 2. GECİKMİŞ ÖDEME BİLDİRİMLERİ (vadesi geçmiş olanlar)

        // Mevcut app_overdue bildirimlerini kontrol et
        const { data: existingOverdue } = await supabase
          .from("notifications")
          .select("payment_plan_id")
          .eq("user_id", profile.id)
          .eq("notification_type", "app_overdue")
          .is("deleted_at", null)

        const existingOverduePlanIds = new Set(existingOverdue?.map((n) => n.payment_plan_id) || [])

        // Vadesi geçmiş ödemeleri getir
        const { data: overduePayments } = await supabase
          .from("payment_plans")
          .select(`
            id,
            credit_id,
            installment_number,
            due_date,
            total_payment,
            credits!inner (
              id,
              user_id,
              banks (name)
            )
          `)
          .eq("credits.user_id", profile.id)
          .eq("status", "pending")
          .lt("due_date", todayStr)

        // Henüz bildirimi olmayan gecikmiş ödemeler için bildirim oluştur
        const overdueNotifications = (overduePayments || [])
          .filter((payment) => !existingOverduePlanIds.has(payment.id))
          .map((payment) => {
            const dueDate = new Date(payment.due_date)
            const diffTime = today.getTime() - dueDate.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            let title = "⚠️ Geciken Ödeme Bildirimi"

            if (diffDays === 1) {
              title = "⚠️ Geciken Ödeme Bildirimi - 1 Gün"
            } else if (diffDays > 1) {
              title = `⚠️ Geciken Ödeme Bildirimi - ${diffDays} Gün`
            }

            return {
              user_id: profile.id,
              credit_id: payment.credit_id,
              payment_plan_id: payment.id,
              notification_type: "app_overdue",
              title,
              message: `${payment.credits.banks.name} bankasından ${payment.installment_number}. taksit ödemenizin vadesi ${dueDate.toLocaleDateString("tr-TR")} tarihinde doldu ve ${diffDays} gündür gecikmiş durumda. Tutar: ${payment.total_payment.toLocaleString("tr-TR")} ₺. Lütfen en kısa sürede ödeme yapınız.`,
              type: "error",
              is_read: false,
            }
          })

        if (overdueNotifications.length > 0) {
          const { error: overdueError } = await supabase
            .from("notifications")
            .insert(overdueNotifications)

          if (overdueError && overdueError.code !== "23505") {
            console.error(`❌ Error creating overdue notifications for user ${profile.id}:`, overdueError)
          } else {
            totalOverdue += overdueNotifications.length
            console.log(`✅ Created ${overdueNotifications.length} overdue notification(s) for ${profile.email}`)
          }
        }
      } catch (userError) {
        console.error(`❌ Error processing user ${profile.id}:`, userError)
      }
    }

    console.log(`🎉 App notification workflow completed`)
    console.log(`📊 Total reminders created: ${totalReminders}`)
    console.log(`📊 Total overdue notifications created: ${totalOverdue}`)
  } catch (error) {
    console.error("❌ App notification workflow failed:", error)
    process.exit(1)
  }
}

createAppNotifications()
