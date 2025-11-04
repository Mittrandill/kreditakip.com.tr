"use server"

import { IyzipaySubscriptionClient } from "@/lib/iyzipay-client"
import { createClient } from "@/lib/supabase/server"

export async function cancelSubscription() {
  try {

    // Kullanıcı kontrolü
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log('[cancelSubscription] Auth check:', {
      hasUser: !!user,
      userId: user?.id,
      hasError: !!authError,
    })

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

    // iyzico_subscription_reference veya iyzico_subscription_id kullan
    const subscriptionRef = subscription.iyzico_subscription_reference || subscription.iyzico_subscription_id

    if (!subscriptionRef) {
      console.error("[server-action] No subscription reference found:", subscription)
      return {
        success: false,
        error: "Abonelik referans bilgisi bulunamadı",
      }
    }

    // iyzico servisini başlat
    const iyzicoClient = new IyzipaySubscriptionClient({
      apiKey: process.env.IYZICO_API_KEY!,
      secretKey: process.env.IYZICO_SECRET_KEY!,
      uri: process.env.IYZICO_BASE_URL!,
    })

    // Aboneliği iptal et
    const result = await iyzicoClient.cancelSubscription(subscriptionRef)

    if (result.status === "success") {
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
        message: "Abonelik başarıyla iptal edildi",
      }
    } else {
      console.error("[server-action] Cancel failed:", result.errorMessage, result.errorCode)
      return {
        success: false,
        error: result.errorMessage || "Abonelik iptal edilemedi",
        errorCode: result.errorCode,
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
