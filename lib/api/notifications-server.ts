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

    // ÖNEMLI: Her ödeme planı için SADECE 1 bildirim oluştur
    // Silinmiş veya okunmuş olsa bile, bir defa bildirim gönderildiyse tekrar gönderme
    const { data: existingNotifications } = await supabase
      .from("notifications")
      .select("payment_plan_id")
      .eq("user_id", userId)
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

        let title = "Ödeme Hatırlatması"
        let type = "info"

        if (diffDays <= 0) {
          title = "Bugün Vadesi Dolan Ödeme"
          type = "error"
        } else if (diffDays === 1) {
          title = "Yarın Vadesi Dolan Ödeme"
          type = "warning"
        } else if (diffDays <= 3) {
          title = `${diffDays} Gün Sonra Vadesi Dolan Ödeme`
          type = "warning"
        } else {
          title = `${diffDays} Gün Sonra Vadesi Dolan Ödeme`
          type = "info"
        }

        return {
          user_id: userId,
          credit_id: payment.credit_id,
          payment_plan_id: payment.id,
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
          console.log(`[createWeeklyPaymentNotifications] Duplicate notification ignored for user ${userId}`)
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
