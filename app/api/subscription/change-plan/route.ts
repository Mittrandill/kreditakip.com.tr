import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Kullanıcı kontrolü
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { newPlanId } = body

    if (!newPlanId) {
      return NextResponse.json({ success: false, error: "Plan ID gerekli" }, { status: 400 })
    }

    // Mevcut aboneliği kontrol et
    const { data: currentSubscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (subError || !currentSubscription) {
      return NextResponse.json({ success: false, error: "Aktif abonelik bulunamadı" }, { status: 404 })
    }

    // Premium kontrolü
    if (currentSubscription.plan_type !== "premium") {
      return NextResponse.json(
        { success: false, error: "Sadece premium kullanıcılar plan değiştirebilir" },
        { status: 403 }
      )
    }

    // Aynı plan kontrolü
    if (currentSubscription.plan_id === newPlanId) {
      return NextResponse.json(
        { success: false, error: "Zaten bu plandayken aynı plana geçemezsiniz" },
        { status: 400 }
      )
    }

    const now = new Date()
    const currentExpiry = currentSubscription.expires_at ? new Date(currentSubscription.expires_at) : null

    // Plan değişikliği mantığı
    let updateData: any = {
      updated_at: now.toISOString(),
    }

    let message = ""
    let effectiveDate = ""

    if (newPlanId === "premium-yearly") {
      // Aylık → Yıllık: Mevcut ay bitsin, sonra yıllık başlasın
      updateData.next_billing_plan = "yearly"
      // plan_id şimdilik değişmez, expires_at'ta değişecek

      if (currentExpiry && currentExpiry > now) {
        effectiveDate = currentExpiry.toLocaleDateString("tr-TR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
        message = `Plan değişikliği kaydedildi. ${effectiveDate} tarihinde yıllık plana geçeceksiniz.`
      } else {
        message = "Plan değişikliği kaydedildi. Bir sonraki ödeme döneminizde yıllık plana geçeceksiniz."
      }
    } else if (newPlanId === "premium-monthly") {
      // Yıllık → Aylık: Mevcut süre korunsun, bitince aylık olsun
      updateData.next_billing_plan = "monthly"
      // plan_id ve expires_at aynı kalır

      if (currentExpiry && currentExpiry > now) {
        effectiveDate = currentExpiry.toLocaleDateString("tr-TR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
        message = `Plan değişikliği kaydedildi. ${effectiveDate} tarihinde aylık plana geçeceksiniz.`
      } else {
        message = "Plan değişikliği kaydedildi. Bir sonraki ödeme döneminizde aylık plana geçeceksiniz."
      }
    }

    // Veritabanında güncelle
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update(updateData)
      .eq("user_id", user.id)

    if (updateError) {
      console.error("[change-plan] Update error:", updateError)
      return NextResponse.json(
        { success: false, error: "Abonelik güncellenirken hata oluştu" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message,
      effectiveDate,
      nextBillingPlan: newPlanId.replace("premium-", ""),
    })
  } catch (error: any) {
    console.error("[change-plan] Error:", error)
    return NextResponse.json({ success: false, error: error.message || "Bir hata oluştu" }, { status: 500 })
  }
}
