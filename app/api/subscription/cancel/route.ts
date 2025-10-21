import { type NextRequest, NextResponse } from "next/server"
import { IyzipaySubscriptionClient } from "@/lib/iyzipay-client"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    console.log("[iyzipay] ========================================")
    console.log("[iyzipay] Subscription cancel API called")

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      console.error("[iyzipay] User ID missing from request")
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    console.log("[iyzipay] Processing cancellation for user:", userId)

    // Service Role Client kullan (authentication bypass)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Kullanıcının aktif abonelik bilgisini al
    const { data: subscriptions, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (subError) {
      console.error("[iyzipay] Error fetching subscription:", subError)
      return NextResponse.json({ error: "Abonelik sorgulanırken hata oluştu" }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("[iyzipay] No active subscription found for user:", userId)
      return NextResponse.json({ error: "Aktif abonelik bulunamadı" }, { status: 404 })
    }

    const subscription = subscriptions[0] // En son aktif abonelik

    // NOT: Normal payment API kullanıldığı için iyzico'da iptal etmiyoruz
    // Sadece veritabanında cancelled olarak işaretliyoruz
    console.log("[iyzipay] Cancelling subscription in database (no iyzico cancel needed for one-time payments)")
    console.log("[iyzipay] Subscription ID to cancel:", subscription.id)

    // Veritabanında aboneliği güncelle - ID ile güncelle
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id)
      .eq("user_id", userId) // Güvenlik için user_id kontrolü ekle

    if (updateError) {
      console.error("[iyzipay] Database update error:", updateError)
      return NextResponse.json(
        { error: "Veritabanı güncellenirken hata oluştu" },
        { status: 500 },
      )
    }

    console.log("[iyzipay] Subscription cancelled successfully in database")

    // NOT: Usage limits'i hemen düşürmüyoruz
    // Kullanıcı iptal etse bile expires_at tarihine kadar premium özelliklerden yararlanabilmeli
    // Limits otomatik olarak subscription status API'sinde kontrol edilecek
    console.log("[iyzipay] User will keep premium features until:", subscription.expires_at)

    return NextResponse.json({
      success: true,
      message: "Abonelik başarıyla iptal edildi. Premium özellikleriniz " +
        new Date(subscription.expires_at).toLocaleDateString("tr-TR") +
        " tarihine kadar aktif kalacak.",
      expiresAt: subscription.expires_at,
    })
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
