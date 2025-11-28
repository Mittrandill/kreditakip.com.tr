"use server"

import { PayTRClient } from "@/lib/paytr-client"
import { createClient } from "@/lib/supabase/server"

export async function cancelSubscription() {
  try {
    // Kullanıcı kontrolü
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[server-action] Authentication failed")
      return {
        success: false,
        error: "Unauthorized",
        details: authError?.message || "No user session found",
      }
    }

    // Kullanıcının abonelik bilgisini al
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (subError || !subscription) {
      return {
        success: false,
        error: "Aktif abonelik bulunamadı",
      }
    }

    // paytr_order_id kullan
    const orderRef = subscription.paytr_order_id

    if (!orderRef) {
      console.error("[server-action] No PayTR order reference found:", subscription)
      return {
        success: false,
        error: "Abonelik referans bilgisi bulunamadı",
      }
    }

    // PayTR client
    const paytrClient = new PayTRClient()

    // Aboneliği iptal et
    const result = await paytrClient.cancelSubscription(orderRef)

    if (result.success) {
      // Veritabanında aboneliği güncelle
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          status: "cancelled",
          end_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      if (updateError) {
        console.error("[server-action] Database update error:", updateError)
        return {
          success: false,
          error: "Veritabanı güncellenirken hata oluştu",
        }
      }

      return {
        success: true,
        message: result.message || "Abonelik başarıyla iptal edildi",
      }
    } else {
      console.error("[server-action] Cancel failed:", result.message)
      return {
        success: false,
        error: result.message || "Abonelik iptal edilemedi",
      }
    }
  } catch (error: any) {
    console.error("[server-action] Cancel subscription error:", error)
    return {
      success: false,
      error: error.message || "Bir hata oluştu",
    }
  }
}
