import { supabase } from "@/lib/supabase"

export async function getNotifications(userId: string) {
  try {
    if (!userId) {
      console.warn("No userId provided to getNotifications")
      return []
    }

    const { data, error } = await supabase
      .from("notifications")
      .select(`
        *,
        credits (
          credit_code,
          banks (
            name,
          logo_url
        )
      )
    `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error fetching notifications:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return []
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    if (!notificationId) {
      throw new Error("No notification ID provided")
    }

    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .select()
      .single()

    if (error) {
      console.error("Supabase error marking notification as read:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error marking notification as read:", error)
    throw error
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    if (!userId) {
      throw new Error("No userId provided")
    }

    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (error) {
      console.error("Supabase error marking all notifications as read:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    throw error
  }
}

export async function deleteNotification(notificationId: string) {
  try {
    if (!notificationId) {
      throw new Error("No notification ID provided")
    }

    const { data, error } = await supabase.from("notifications").delete().eq("id", notificationId)

    if (error) {
      console.error("Supabase error deleting notification:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error deleting notification:", error)
    throw error
  }
}

export async function getNotificationStats(userId: string) {
  try {
    if (!userId) {
      console.warn("No userId provided to getNotificationStats")
      return { total: 0, unread: 0, read: 0 }
    }

    const { data: allNotifications, error: allError } = await supabase
      .from("notifications")
      .select("id, is_read")
      .eq("user_id", userId)

    if (allError) {
      console.error("Supabase error fetching notification stats:", allError)
      return { total: 0, unread: 0, read: 0 }
    }

    const total = allNotifications?.length || 0
    const unread = allNotifications?.filter((n) => !n.is_read).length || 0

    return {
      total,
      unread,
      read: total - unread,
    }
  } catch (error) {
    console.error("Error fetching notification stats:", error)
    return { total: 0, unread: 0, read: 0 }
  }
}

// Sadece 3 gün kala ödeme bildirimleri oluştur
export async function createPaymentReminders(userId: string) {
  try {
    if (!userId) {
      throw new Error("No userId provided")
    }

    // 3 gün sonraki tarihi hesapla
    const threeDaysLater = new Date()
    threeDaysLater.setDate(threeDaysLater.getDate() + 3)
    const targetDate = threeDaysLater.toISOString().split("T")[0]

    // Bu tarih için zaten bildirim oluşturulmuş payment_plan'ları kontrol et
    const { data: existingNotifications } = await supabase
      .from("notifications")
      .select("payment_plan_id")
      .eq("user_id", userId)
      .not("payment_plan_id", "is", null)

    const existingPaymentPlanIds = new Set(existingNotifications?.map((n) => n.payment_plan_id) || [])

    // 3 gün sonra vadesi gelen ödemeleri getir
    const { data: upcomingPayments } = await supabase
      .from("payment_plans")
      .select(`
        *,
        credits!inner (
          id,
          credit_code,
          user_id,
          banks (
            name
          )
        )
      `)
      .eq("credits.user_id", userId)
      .eq("status", "pending")
      .eq("due_date", targetDate)

    if (!upcomingPayments || upcomingPayments.length === 0) {
      return []
    }

    // Daha önce bildirim oluşturulmamış ödemeler için bildirim oluştur
    const notifications = upcomingPayments
      .filter((payment) => !existingPaymentPlanIds.has(payment.id))
      .map((payment) => ({
        user_id: userId,
        credit_id: payment.credit_id,
        payment_plan_id: payment.id,
        title: "Ödeme Hatırlatması",
        message: `${payment.credits.banks.name} bankasından ${payment.total_payment.toLocaleString("tr-TR")} ₺ tutarındaki kredinizin ödemesine 3 gün kaldı.`,
        is_read: false,
      }))

    if (notifications.length > 0) {
      const { data, error } = await supabase.from("notifications").insert(notifications).select()

      if (error) {
        console.error("Supabase error creating payment reminders:", error)
        throw error
      }

      return data
    }

    return []
  } catch (error) {
    console.error("Error in createPaymentReminders:", error)
    throw error
  }
}

// Alias for backward-compatibility with older imports
export { createPaymentReminders as createUpcomingPaymentNotifications }
