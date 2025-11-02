import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
import { IyzipaySubscriptionClient } from "@/lib/iyzipay-client"
import { createClient } from "@/lib/supabase/server"
import { getPlanById } from "@/lib/subscription-plans"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {

    const body = await request.json()
    const { newPlanId, cardInfo, billingInfo } = body

    if (!newPlanId || !cardInfo || !billingInfo) {
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

    // iyzico servisini başlat
    const iyzicoClient = new IyzipaySubscriptionClient({
      apiKey: process.env.IYZICO_API_KEY!,
      secretKey: process.env.IYZICO_SECRET_KEY!,
      uri: process.env.IYZICO_BASE_URL!,
    })

    // Mevcut aboneliği iptal et (eğer premium ise)
    if (currentSubscription.plan_type === "premium" && currentSubscription.iyzico_subscription_reference) {
      try {
        await iyzicoClient.cancelSubscription(currentSubscription.iyzico_subscription_reference)
      } catch (error) {
        console.error("[iyzipay] Error cancelling previous subscription:", error)
        // Devam et, yeni abonelik oluştur
      }
    }

    // TODO: Yeni abonelik oluştur - createSubscription metodu henüz implement edilmemiş
    // Subscriptions are created through checkout flow, not directly
    return NextResponse.json({
      error: "Direct subscription creation not supported. Please use checkout flow."
    }, { status: 501 })

    /*
    const result = await iyzicoClient.createSubscription({
      locale: "tr",
      conversationId: `upgrade-${user.id}-${Date.now()}`,
      pricingPlanReferenceCode: newPlanId,
      subscriptionInitialStatus: "ACTIVE",
      customer: {
        name: billingInfo.fullName.split(" ")[0],
        surname: billingInfo.fullName.split(" ").slice(1).join(" "),
        email: billingInfo.email,
        identityNumber: billingInfo.taxNumber,
        gsmNumber: billingInfo.phone,
        billingAddress: {
          contactName: billingInfo.fullName,
          city: billingInfo.city,
          district: billingInfo.district,
          country: "Turkey",
          address: billingInfo.address,
          zipCode: billingInfo.zipCode,
        },
        shippingAddress: {
          contactName: billingInfo.fullName,
          city: billingInfo.city,
          district: billingInfo.district,
          country: "Turkey",
          address: billingInfo.address,
          zipCode: billingInfo.zipCode,
        },
      },
      paymentCard: {
        cardHolderName: cardInfo.cardHolderName,
        cardNumber: cardInfo.cardNumber,
        expireMonth: cardInfo.expireMonth,
        expireYear: cardInfo.expireYear,
        cvc: cardInfo.cvc,
      },
    })

    if (result.status === "success") {
      // Mevcut aboneliği güncelle veya yenisini oluştur
      const subscriptionData = {
        plan_type: "premium",
        plan_id: newPlanId,
        status: "active",
        started_at: new Date().toISOString(),
        expires_at:
          newPlan.period === "yearly"
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        iyzico_subscription_reference: result.subscriptionReferenceCode,
        iyzico_subscription_id: result.referenceCode,
        updated_at: new Date().toISOString(),
      }

      await supabase.from("subscriptions").update(subscriptionData).eq("user_id", user.id)

      // Payment transaction kaydı oluştur
      await supabase.from("payment_transactions").insert({
        user_id: user.id,
        subscription_id: currentSubscription.id,
        amount: newPlan.price,
        currency: "TRY",
        status: "completed",
        iyzico_payment_id: result.paymentId,
        iyzico_conversation_id: result.conversationId,
        payment_method: "credit_card",
      })

      // Usage tracking'i güncelle (premium için sınırsız)
      await supabase
        .from("usage_tracking")
        .update({
          limit_count: 999999,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      return NextResponse.json({
        success: true,
        message: "Abonelik başarıyla yükseltildi",
        subscription: subscriptionData,
      })
    } else {
      return NextResponse.json(
        {
          error: result.errorMessage || "Abonelik yükseltme başarısız oldu",
        },
        { status: 400 },
      )
    }
    */
  } catch (error: any) {
    console.error("[iyzipay] Upgrade subscription error:", error)
    return NextResponse.json(
      {
        error: error.message || "Bir hata oluştu",
      },
      { status: 500 },
    )
  }
}
