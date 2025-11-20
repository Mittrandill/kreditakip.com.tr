import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
import { PayTRClient } from "@/lib/paytr-client"
import { createClient } from "@/lib/supabase/server"
import { getPlanById } from "@/lib/subscription-plans"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { newPlanId, billingInfo } = body

    if (!newPlanId || !billingInfo) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Kullanıcı kontrolü
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Yeni plan bilgisini al
    const newPlan = getPlanById(newPlanId)
    if (!newPlan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    // Kullanıcının mevcut abonelik bilgisini al
    const { data: currentSubscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (subError || !currentSubscription) {
      return NextResponse.json({ error: "Current subscription not found" }, { status: 404 })
    }

    // PayTR client
    const paytrClient = new PayTRClient()

    // Mevcut aboneliği iptal et (eğer premium ise)
    if (currentSubscription.plan_type === "premium" && currentSubscription.paytr_order_id) {
      try {
        await paytrClient.cancelSubscription(currentSubscription.paytr_order_id)
      } catch (error) {
        console.error("[paytr] Error cancelling previous subscription:", error)
        // Devam et, yeni abonelik oluştur
      }
    }

    // PayTR'de direct subscription upgrade yoktur
    // Kullanıcıyı yeni bir checkout flow'a yönlendirmeliyiz
    return NextResponse.json(
      {
        error:
          "Direct subscription upgrade not supported with PayTR. Please use the checkout flow to purchase a new subscription.",
        redirectTo: "/uygulama/ayarlar",
      },
      { status: 501 },
    )
  } catch (error: any) {
    console.error("[paytr] Upgrade subscription error:", error)
    return NextResponse.json(
      {
        error: error.message || "Bir hata oluştu",
      },
      { status: 500 },
    )
  }
}
