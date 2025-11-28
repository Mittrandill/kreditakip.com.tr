import { supabase } from "@/lib/supabase"

export async function getNotifications(userId: string) {
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
    .is("deleted_at", null) // Sadece silinmemiş bildirimleri getir
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return data
}

export async function getNotificationById(userId: string, notificationId: string) {
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
    .eq("id", notificationId)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw error
  }

  return data
}

export async function markNotificationAsRead(userId: string, notificationId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", userId)
    .select()

  if (error) {
    throw error
  }

  // Eğer hiçbir satır güncellenmemişse hata fırlat
  if (!data || data.length === 0) {
    throw new Error("Bildirim bulunamadı veya güncelleme yapılamadı")
  }

  return true
}

export async function markAllNotificationsAsRead(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false)
    .select()

  if (error) {
    throw error
  }

  return true
}

export async function deleteNotification(userId: string, notificationId: string) {
  // Soft delete - deleted_at alanını güncelle
  const { data, error } = await supabase
    .from("notifications")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId)

  if (error) {
    throw error
  }

  return data
}

export async function getNotificationStats(userId: string) {
  const { data: allNotifications, error: allError } = await supabase
    .from("notifications")
    .select("id, is_read")
    .eq("user_id", userId)
    .is("deleted_at", null) // Sadece silinmemiş bildirimleri say

  if (allError) {
    throw allError
  }

  const total = allNotifications?.length || 0
  const unread = allNotifications?.filter((n) => !n.is_read).length || 0

  return {
    total,
    unread,
    read: total - unread,
  }
}

export async function createPaymentReminders(userId: string) {
  try {
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

    // 3 gün sonra vadesi gelen ödemeleri getir - doğru tablo adı kullanıyorum
    const { data: upcomingPayments } = await supabase
      .from("payment_plans")
      .select(`
        *,
        credits!inner (
          id,
          credit_code,
          user_id,
          banks (name)
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
        type: "warning",
        is_read: false,
      }))

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

export async function createUpcomingPaymentNotifications(userId: string) {
  try {
    const notifications: any[] = []

    // 1 gün sonra vadesi gelenler için bildirim
    const oneDayLater = new Date()
    oneDayLater.setDate(oneDayLater.getDate() + 1)
    const oneDayDate = oneDayLater.toISOString().split("T")[0]

    // 3 gün sonra vadesi gelenler için bildirim
    const threeDaysLater = new Date()
    threeDaysLater.setDate(threeDaysLater.getDate() + 3)
    const threeDaysDate = threeDaysLater.toISOString().split("T")[0]

    // Bugün vadesi gelenler için bildirim
    const today = new Date().toISOString().split("T")[0]

    // Gecikmiş ödemeler için bildirim
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const overdueDate = yesterday.toISOString().split("T")[0]

    // Mevcut bildirimleri kontrol et
    const { data: existingNotifications } = await supabase
      .from("notifications")
      .select("payment_plan_id, message")
      .eq("user_id", userId)
      .not("payment_plan_id", "is", null)

    const existingPaymentPlanIds = new Set(existingNotifications?.map((n) => n.payment_plan_id) || [])

    // 3 gün sonra vadesi gelen ödemeler
    const { data: threeDayPayments } = await supabase
      .from("payment_plans")
      .select(`
        *,
        credits!inner (
          id,
          credit_code,
          user_id,
          banks (name)
        )
      `)
      .eq("credits.user_id", userId)
      .eq("status", "pending")
      .eq("due_date", threeDaysDate)

    // 1 gün sonra vadesi gelen ödemeler
    const { data: oneDayPayments } = await supabase
      .from("payment_plans")
      .select(`
        *,
        credits!inner (
          id,
          credit_code,
          user_id,
          banks (name)
        )
      `)
      .eq("credits.user_id", userId)
      .eq("status", "pending")
      .eq("due_date", oneDayDate)

    // Bugün vadesi gelen ödemeler
    const { data: todayPayments } = await supabase
      .from("payment_plans")
      .select(`
        *,
        credits!inner (
          id,
          credit_code,
          user_id,
          banks (name)
        )
      `)
      .eq("credits.user_id", userId)
      .eq("status", "pending")
      .eq("due_date", today)

    // Gecikmiş ödemeler
    const { data: overduePayments } = await supabase
      .from("payment_plans")
      .select(`
        *,
        credits!inner (
          id,
          credit_code,
          user_id,
          banks (name)
        )
      `)
      .eq("credits.user_id", userId)
      .eq("status", "pending")
      .lt("due_date", today)

    // 3 gün öncesi bildirimleri
    if (threeDayPayments) {
      threeDayPayments
        .filter((payment) => !existingPaymentPlanIds.has(payment.id))
        .forEach((payment) => {
          notifications.push({
            user_id: userId,
            credit_id: payment.credit_id,
            payment_plan_id: payment.id,
            title: "Ödeme Hatırlatması - 3 Gün Kaldı",
            message: `${payment.credits.banks.name} bankasından ${payment.installment_number}. taksit ödemenizin vadesi 3 gün sonra (${new Date(payment.due_date).toLocaleDateString("tr-TR")}) dolacak. Tutar: ${payment.total_payment.toLocaleString("tr-TR")} ₺`,
            type: "info",
            is_read: false,
          })
        })
    }

    // 1 gün öncesi bildirimleri
    if (oneDayPayments) {
      oneDayPayments
        .filter((payment) => !existingPaymentPlanIds.has(payment.id))
        .forEach((payment) => {
          notifications.push({
            user_id: userId,
            credit_id: payment.credit_id,
            payment_plan_id: payment.id,
            title: "Ödeme Hatırlatması - Yarın Vade",
            message: `${payment.credits.banks.name} bankasından ${payment.installment_number}. taksit ödemenizin vadesi yarın (${new Date(payment.due_date).toLocaleDateString("tr-TR")}) dolacak. Tutar: ${payment.total_payment.toLocaleString("tr-TR")} ₺`,
            type: "warning",
            is_read: false,
          })
        })
    }

    // Bugün vadesi gelen bildirimleri
    if (todayPayments) {
      todayPayments
        .filter((payment) => !existingPaymentPlanIds.has(payment.id))
        .forEach((payment) => {
          notifications.push({
            user_id: userId,
            credit_id: payment.credit_id,
            payment_plan_id: payment.id,
            title: "Ödeme Hatırlatması - Bugün Vade",
            message: `${payment.credits.banks.name} bankasından ${payment.installment_number}. taksit ödemenizin vadesi bugün (${new Date(payment.due_date).toLocaleDateString("tr-TR")}) doluyor. Tutar: ${payment.total_payment.toLocaleString("tr-TR")} ₺`,
            type: "error",
            is_read: false,
          })
        })
    }

    // Gecikmiş ödeme bildirimleri
    if (overduePayments) {
      overduePayments
        .filter((payment) => !existingPaymentPlanIds.has(payment.id))
        .forEach((payment) => {
          notifications.push({
            user_id: userId,
            credit_id: payment.credit_id,
            payment_plan_id: payment.id,
            title: "Gecikmiş Ödeme Bildirimi",
            message: `${payment.credits.banks.name} bankasından ${payment.installment_number}. taksit ödemenizin vadesi (${new Date(payment.due_date).toLocaleDateString("tr-TR")}) geçmiş durumda. Tutar: ${payment.total_payment.toLocaleString("tr-TR")} ₺`,
            type: "error",
            is_read: false,
          })
        })
    }

    // Bildirimleri veritabanına kaydet
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

