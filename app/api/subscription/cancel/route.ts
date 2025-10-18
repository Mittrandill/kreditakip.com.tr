import { type NextRequest, NextResponse } from "next/server"
import { IyzipaySubscriptionClient } from "@/lib/iyzipay-client"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    console.log("[iyzipay] Subscription cancel API called")

    // Kullanıcı kontrolü
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Kullanıcının abonelik bilgisini al
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (subError || !subscription || !subscription.iyzico_subscription_reference) {
      return NextResponse.json({ error: "Aktif abonelik bulunamadı" }, { status: 404 })
    }

    // iyzico servisini başlat
    const iyzicoClient = new IyzipaySubscriptionClient({
      apiKey: process.env.IYZICO_API_KEY!,
      secretKey: process.env.IYZICO_SECRET_KEY!,
      uri: process.env.IYZICO_BASE_URL!,
    })

    // Aboneliği iptal et
    const result = await iyzicoClient.cancelSubscription(subscription.iyzico_subscription_reference)

    if (result.status === "success") {
      // Veritabanında aboneliği güncelle
      await supabase
        .from("subscriptions")
        .update({
          status: "cancelled",
          end_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      return NextResponse.json({
        success: true,
        message: "Abonelik başarıyla iptal edildi",
      })
    } else {
      return NextResponse.json(
        {
          error: result.errorMessage || "Abonelik iptal edilemedi",
        },
        { status: 400 },
      )
    }
  } catch (error: any) {
    console.error("[iyzipay] Cancel subscription error:", error)
    return NextResponse.json(
      {
        error: error.message || "Bir hata oluştu",
      },
      { status: 500 },
    )
  }
}
