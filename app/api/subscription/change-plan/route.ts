import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * Plan değişikliği API endpoint
 *
 * Desteklenen plan geçişleri:
 * 1. Pro Monthly <-> Pro Yearly
 * 2. Premium Monthly <-> Premium Yearly
 * 3. Pro -> Premium (upgrade)
 * 4. Premium -> Pro (downgrade)
 *
 * Not: Free kullanıcılar bu endpoint'i kullanmaz, doğrudan checkout'a gider
 */
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

    // Geçerli plan ID'leri
    const validPlanIds = ["pro-monthly", "pro-yearly", "premium-monthly", "premium-yearly"]
    if (!validPlanIds.includes(newPlanId)) {
      return NextResponse.json(
        { success: false, error: "Geçersiz plan ID" },
        { status: 400 }
      )
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

    const currentPlanId = currentSubscription.plan_id

    // Free kullanıcı kontrolü
    if (!currentPlanId || currentPlanId === "free") {
      return NextResponse.json(
        { success: false, error: "Ücretsiz kullanıcılar plan değiştiremez, lütfen yeni plan satın alın" },
        { status: 403 }
      )
    }

    // Aynı plan kontrolü
    if (currentPlanId === newPlanId) {
      return NextResponse.json(
        { success: false, error: "Zaten bu plandayken aynı plana geçemezsiniz" },
        { status: 400 }
      )
    }

    const now = new Date()
    const currentExpiry = currentSubscription.expires_at ? new Date(currentSubscription.expires_at) : null

    // Plan tipleri ve billing period'ları çıkar
    const currentPlanType = currentPlanId.includes("premium") ? "premium" : "pro"
    const currentBillingPeriod = currentPlanId.includes("yearly") ? "yearly" : "monthly"

    const newPlanType = newPlanId.includes("premium") ? "premium" : "pro"
    const newBillingPeriod = newPlanId.includes("yearly") ? "yearly" : "monthly"

    // Plan değişikliği tipini belirle
    let changeType: "billing_period" | "upgrade" | "downgrade"
    if (currentPlanType === newPlanType) {
      changeType = "billing_period"
    } else if (currentPlanType === "pro" && newPlanType === "premium") {
      changeType = "upgrade"
    } else {
      changeType = "downgrade"
    }

    // Yeni plan bilgilerini al
    const { data: newPlan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", newPlanId)
      .single()

    if (planError || !newPlan) {
      return NextResponse.json(
        { success: false, error: "Yeni plan bilgileri alınamadı" },
        { status: 500 }
      )
    }

    // Update data hazırla
    const updateData: any = {
      next_billing_plan_id: newPlanId, // Yeni plan ID'sini kaydet
      updated_at: now.toISOString(),
    }

    // Mesaj oluştur
    let message = ""
    let effectiveDate = ""

    if (currentExpiry && currentExpiry > now) {
      effectiveDate = currentExpiry.toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }

    switch (changeType) {
      case "billing_period":
        if (newBillingPeriod === "yearly") {
          message = effectiveDate
            ? `Faturalama dönemi değişikliği kaydedildi. ${effectiveDate} tarihinde yıllık faturalama dönemine geçeceksiniz.`
            : "Faturalama dönemi değişikliği kaydedildi. Bir sonraki ödeme döneminizde yıllık faturalama dönemine geçeceksiniz."
        } else {
          message = effectiveDate
            ? `Faturalama dönemi değişikliği kaydedildi. ${effectiveDate} tarihinde aylık faturalama dönemine geçeceksiniz.`
            : "Faturalama dönemi değişikliği kaydedildi. Bir sonraki ödeme döneminizde aylık faturalama dönemine geçeceksiniz."
        }
        break

      case "upgrade":
        message = effectiveDate
          ? `Plan yükseltme kaydedildi! ${effectiveDate} tarihinde ${newPlan.name} planına geçeceksiniz. ${newBillingPeriod === "yearly" ? "Yıllık" : "Aylık"} faturalama ile ${newPlan.price}₺ ödenecektir.`
          : `Plan yükseltme kaydedildi! Bir sonraki ödeme döneminizde ${newPlan.name} planına geçeceksiniz.`
        break

      case "downgrade":
        message = effectiveDate
          ? `Plan düşürme kaydedildi. ${effectiveDate} tarihinde ${newPlan.name} planına geçeceksiniz. ${newBillingPeriod === "yearly" ? "Yıllık" : "Aylık"} faturalama ile ${newPlan.price}₺ ödenecektir.`
          : `Plan düşürme kaydedildi. Bir sonraki ödeme döneminizde ${newPlan.name} planına geçeceksiniz.`
        break
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
      changeType,
      currentPlan: {
        id: currentPlanId,
        type: currentPlanType,
        billingPeriod: currentBillingPeriod,
      },
      newPlan: {
        id: newPlanId,
        type: newPlanType,
        billingPeriod: newBillingPeriod,
        price: newPlan.price,
      },
    })
  } catch (error: any) {
    console.error("[change-plan] Error:", error)
    return NextResponse.json({ success: false, error: error.message || "Bir hata oluştu" }, { status: 500 })
  }
}
