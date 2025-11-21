import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { PayTRClient } from "@/lib/paytr-client"
import {
  sendRenewalSuccessNotification,
  sendRenewalFailedNotification,
} from "@/lib/email/subscription-notification"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60 // 60 saniye timeout

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

/**
 * Otomatik Abonelik Yenileme Cron Job
 *
 * Bu endpoint her gün çalışır ve:
 * 1. Süresi 3 gün içinde dolacak aktif abonelikleri bulur
 * 2. Kullanıcının kayıtlı kartı varsa otomatik ödeme alır
 * 3. Başarılı olursa aboneliği yeniler
 *
 * Vercel Cron: Her gün 09:00 UTC'de çalışır
 */
export async function GET(request: NextRequest) {
  try {
    // Cron secret doğrulama (Vercel cron jobs için güvenlik)
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error("[subscription-renewal] Unauthorized cron request")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[subscription-renewal] Starting automatic renewal process...")

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Süresi 3 gün içinde dolacak aktif abonelikleri bul
    const now = new Date()
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    const { data: expiringSubscriptions, error: fetchError } = await supabase
      .from("subscriptions")
      .select(`
        *,
        subscription_plans (*),
        profiles (id, email, first_name, last_name)
      `)
      .eq("status", "active")
      .eq("plan_type", "premium")
      .lte("expires_at", threeDaysLater.toISOString())
      .gt("expires_at", now.toISOString())

    if (fetchError) {
      console.error("[subscription-renewal] Error fetching subscriptions:", fetchError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!expiringSubscriptions || expiringSubscriptions.length === 0) {
      console.log("[subscription-renewal] No subscriptions to renew")
      return NextResponse.json({
        success: true,
        message: "No subscriptions to renew",
        processed: 0
      })
    }

    console.log(`[subscription-renewal] Found ${expiringSubscriptions.length} subscriptions to process`)

    const paytrClient = new PayTRClient()
    const results = {
      processed: 0,
      renewed: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const subscription of expiringSubscriptions) {
      try {
        const userId = subscription.user_id
        const plan = subscription.subscription_plans
        const profile = subscription.profiles

        if (!plan) {
          console.log(`[subscription-renewal] No plan found for subscription ${subscription.id}`)
          results.skipped++
          continue
        }

        // Kullanıcının kayıtlı kartını bul
        const { data: savedCard, error: cardError } = await supabase
          .from("paytr_saved_cards")
          .select("*, paytr_user_tokens!inner(utoken)")
          .eq("user_id", userId)
          .eq("is_active", true)
          .eq("is_default", true)
          .single()

        if (cardError || !savedCard) {
          console.log(`[subscription-renewal] No saved card for user ${userId}`)
          results.skipped++
          continue
        }

        // Billing info al
        const { data: billingInfo } = await supabase
          .from("billing_info")
          .select("*")
          .eq("user_id", userId)
          .single()

        if (!billingInfo) {
          console.log(`[subscription-renewal] No billing info for user ${userId}`)
          results.skipped++
          continue
        }

        // Benzersiz sipariş numarası oluştur
        const orderId = `REN${userId.replace(/-/g, "").substring(0, 16)}${Date.now()}`

        // Recurring payment yap
        const paymentResult = await paytrClient.createRecurringPayment(
          savedCard.utoken,
          savedCard.ctoken,
          orderId,
          plan.price,
          {
            fullName: billingInfo.full_name,
            email: billingInfo.email,
            phone: billingInfo.phone,
            address: billingInfo.address,
            city: billingInfo.city,
            district: billingInfo.district || undefined,
          },
          "85.34.78.112", // Server IP (cron job'dan geldiği için sabit IP)
          savedCard.require_cvv ? undefined : undefined, // CVV gerekiyorsa kullanıcıdan alınmalı
          {
            currency: (plan.currency as "TL" | "TRY" | "EUR" | "USD") || "TL",
            testMode: process.env.PAYTR_TEST_MODE === "1",
          }
        )

        results.processed++

        if (paymentResult.status === "success" || paymentResult.status === "wait_callback") {
          // Ödeme başarılı veya beklemede - aboneliği yenile
          const newExpiresAt = new Date(subscription.expires_at)
          if (plan.billing_period === "yearly") {
            newExpiresAt.setFullYear(newExpiresAt.getFullYear() + 1)
          } else {
            newExpiresAt.setMonth(newExpiresAt.getMonth() + 1)
          }

          // Aboneliği güncelle
          await supabase
            .from("subscriptions")
            .update({
              expires_at: newExpiresAt.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", subscription.id)

          // Recurring payment kaydı oluştur
          await supabase.from("paytr_recurring_payments").insert({
            user_id: userId,
            subscription_id: subscription.id,
            utoken: savedCard.utoken,
            ctoken: savedCard.ctoken,
            merchant_oid: orderId,
            amount: plan.price,
            currency: plan.currency || "TRY",
            payment_status: paymentResult.status === "success" ? "completed" : "pending",
            paytr_status: paymentResult.status,
            completed_at: paymentResult.status === "success" ? new Date().toISOString() : null,
            metadata: {
              renewal_type: "automatic",
              plan_id: plan.id,
              plan_name: plan.name,
              billing_period: plan.billing_period,
            },
          })

          // Payment transaction kaydı
          await supabase.from("payment_transactions").insert({
            user_id: userId,
            subscription_id: subscription.id,
            plan_id: plan.id,
            amount: plan.price,
            currency: plan.currency || "TRY",
            status: paymentResult.status === "success" ? "completed" : "pending",
            payment_method: "paytr_recurring",
            paytr_order_id: orderId,
            paytr_conversation_id: orderId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          // Kart son kullanım tarihini güncelle
          await supabase
            .from("paytr_saved_cards")
            .update({ last_used_at: new Date().toISOString() })
            .eq("ctoken", savedCard.ctoken)

          // Başarılı yenileme bildirimi gönder
          if (profile?.email) {
            await sendRenewalSuccessNotification({
              userName: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email,
              userEmail: profile.email,
              planName: plan.name,
              amount: plan.price,
              currency: plan.currency || "TRY",
              renewalDate: new Date().toISOString(),
              newExpiresAt: newExpiresAt.toISOString(),
              isAutomatic: true,
            })
          }

          console.log(`[subscription-renewal] Successfully renewed subscription for user ${userId}`)
          results.renewed++
        } else {
          // Ödeme başarısız
          console.error(`[subscription-renewal] Payment failed for user ${userId}:`, paymentResult.msg)

          // Başarısız ödeme kaydı
          await supabase.from("paytr_recurring_payments").insert({
            user_id: userId,
            subscription_id: subscription.id,
            utoken: savedCard.utoken,
            ctoken: savedCard.ctoken,
            merchant_oid: orderId,
            amount: plan.price,
            currency: plan.currency || "TRY",
            payment_status: "failed",
            paytr_status: paymentResult.status,
            error_message: paymentResult.msg,
            try_again: paymentResult.try_again || false,
            metadata: {
              renewal_type: "automatic",
              plan_id: plan.id,
            },
          })

          // Başarısız yenileme bildirimi gönder
          if (profile?.email) {
            await sendRenewalFailedNotification({
              userName: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email,
              userEmail: profile.email,
              planName: plan.name,
              errorMessage: paymentResult.msg || "Bilinmeyen hata",
              expiresAt: subscription.expires_at,
            })
          }

          results.failed++
          results.errors.push(`User ${userId}: ${paymentResult.msg}`)
        }
      } catch (error: any) {
        console.error(`[subscription-renewal] Error processing subscription:`, error)
        results.failed++
        results.errors.push(error.message || "Unknown error")
      }
    }

    console.log("[subscription-renewal] Renewal process completed:", results)

    return NextResponse.json({
      success: true,
      message: "Renewal process completed",
      results,
    })
  } catch (error: any) {
    console.error("[subscription-renewal] Cron job error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
