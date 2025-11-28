import { createSupabaseAdmin } from "@/lib/supabase-server"

export async function createWeeklyPaymentNotifications(userId: string) {
  try {
    const supabase = createSupabaseAdmin()

    // 3 gün sonraki tarihi hesapla
    const threeDaysLater = new Date()
    threeDaysLater.setDate(threeDaysLater.getDate() + 3)
    const threeDaysDate = threeDaysLater.toISOString().split("T")[0]

    // Bugünün tarihi
    const today = new Date().toISOString().split("T")[0]

    // ÖNEMLI: Her ödeme planı için her type'da SADECE 1 aktif bildirim olabilir
    // app_reminder, app_overdue ve email bildirimleri ayrı ayrı oluşturulabilir
    const { data: existingNotifications } = await supabase
      .from("notifications")
      .select("payment_plan_id, notification_type")
      .eq("user_id", userId)
      .eq("notification_type", "app_reminder") // Sadece app_reminder tipindeki bildirimleri kontrol et
      .is("deleted_at", null) // Sadece aktif bildirimleri kontrol et
      .not("payment_plan_id", "is", null)

    const existingPaymentPlanIds = new Set(existingNotifications?.map((n) => n.payment_plan_id) || [])

    // 3 gün içinde vadesi gelen ödemeleri getir
    const { data: upcomingPayments } = await supabase
      .from("payment_plans")
      .select(`
        *,
        credits!inner (
          id,
          credit_code,
          user_id,
          banks (name, logo_url)
        )
      `)
      .eq("credits.user_id", userId)
      .eq("status", "pending")
      .gte("due_date", today)
      .lte("due_date", threeDaysDate)

    if (!upcomingPayments || upcomingPayments.length === 0) {
      return []
    }

    const notifications = upcomingPayments
      .filter((payment) => !existingPaymentPlanIds.has(payment.id))
      .map((payment) => {
        const dueDate = new Date(payment.due_date)
        const today = new Date()
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
          user_id: userId,
          credit_id: payment.credit_id,
          payment_plan_id: payment.id,
          notification_type: "app_reminder", // Email workflow ile çakışmaması için app_reminder
          title,
          message: `${payment.credits.banks.name} bankasından ${payment.installment_number}. taksit ödemenizin vadesi ${dueDate.toLocaleDateString("tr-TR")} tarihinde doluyor. Tutar: ${payment.total_payment.toLocaleString("tr-TR")} ₺`,
          type,
          is_read: false,
        }
      })

    if (notifications.length > 0) {
      const { data, error } = await supabase.from("notifications").insert(notifications).select()

      if (error) {
        // Unique constraint violation - bu payment_plan için zaten bildirim var, ignore et
        if (error.code === "23505") {
          // eslint-disable-next-line no-console
          return []
        }
        throw error
      }

      return data
    }

    return []
  } catch (error) {
    throw error
  }
}

/**
 * Geciken ödemeler için bildirim oluşturur
 * Vade tarihi geçmiş ve henüz ödenmemiş taksitler için
 */
export async function createOverduePaymentNotifications(userId: string) {
  try {
    const supabase = createSupabaseAdmin()

    // Bugünün tarihi
    const today = new Date().toISOString().split("T")[0]

    // Mevcut overdue bildirimleri kontrol et
    const { data: existingNotifications } = await supabase
      .from("notifications")
      .select("payment_plan_id, notification_type")
      .eq("user_id", userId)
      .eq("notification_type", "app_overdue") // Sadece app_overdue tipindeki bildirimleri kontrol et
      .is("deleted_at", null) // Sadece aktif bildirimleri kontrol et
      .not("payment_plan_id", "is", null)

    const existingPaymentPlanIds = new Set(existingNotifications?.map((n) => n.payment_plan_id) || [])

    // Vadesi geçmiş ödemeleri getir
    const { data: overduePayments } = await supabase
      .from("payment_plans")
      .select(`
        *,
        credits!inner (
          id,
          credit_code,
          user_id,
          banks (name, logo_url)
        )
      `)
      .eq("credits.user_id", userId)
      .eq("status", "pending")
      .lt("due_date", today) // Vadesi bugünden önce olanlar

    if (!overduePayments || overduePayments.length === 0) {
      return []
    }

    const notifications = overduePayments
      .filter((payment) => !existingPaymentPlanIds.has(payment.id))
      .map((payment) => {
        const dueDate = new Date(payment.due_date)
        const todayDate = new Date()
        const diffTime = todayDate.getTime() - dueDate.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        let title = "⚠️ Geciken Ödeme Bildirimi"
        let type = "error"

        if (diffDays === 1) {
          title = "⚠️ Geciken Ödeme Bildirimi - 1 Gün"
        } else if (diffDays > 1) {
          title = `⚠️ Geciken Ödeme Bildirimi - ${diffDays} Gün`
        }

        return {
          user_id: userId,
          credit_id: payment.credit_id,
          payment_plan_id: payment.id,
          notification_type: "app_overdue", // Email workflow ile çakışmaması için app_overdue
          title,
          message: `${payment.credits.banks.name} bankasından ${payment.installment_number}. taksit ödemenizin vadesi ${dueDate.toLocaleDateString("tr-TR")} tarihinde doldu ve ${diffDays} gündür gecikmiş durumda. Tutar: ${payment.total_payment.toLocaleString("tr-TR")} ₺. Lütfen en kısa sürede ödeme yapınız.`,
          type,
          is_read: false,
        }
      })

    if (notifications.length > 0) {
      const { data, error } = await supabase.from("notifications").insert(notifications).select()

      if (error) {
        // Unique constraint violation - bu payment_plan için zaten overdue bildirim var, ignore et
        if (error.code === "23505") {
          // eslint-disable-next-line no-console
          return []
        }
        throw error
      }

      return data
    }

    return []
  } catch (error) {
    throw error
  }
}
