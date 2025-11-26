import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { PayTRClient } from "@/lib/paytr-client"
import {
  sendRenewalSuccessNotification,
  sendRenewalFailedNotification,
  sendRenewalRequestNotification,
} from "@/lib/email/subscription-notification"
import { calculateRiskScore, logSecurityEvent, getUserPaymentActivity, type RiskFactors } from "@/lib/security-utils"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60 // 60 saniye timeout

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

/**
 * Otomatik Abonelik Yenileme Cron Job (3D Secure)
 *
 * Bu endpoint her gün çalışır ve:
 * 1. Süresi 3 gün içinde dolacak aktif abonelikleri bulur
 * 2. Kullanıcının kayıtlı kartı varsa 3D Secure payment request oluşturur
 * 3. Payment URL ile email gönderir (SMS onayı veya manuel ödeme için)
 *
 * Vercel Cron: Her gün 09:00 UTC (12:00 TR)'de çalışır
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
      payment_requests_created: 0, // Changed from 'renewed'
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

        // FRAUD DETECTION: Risk skorunu hesapla
        const userCreatedAt = new Date(profile.created_at)
        const userRegisteredDaysAgo = Math.floor((now.getTime() - userCreatedAt.getTime()) / (24 * 60 * 60 * 1000))

        // Son giriş zamanını kontrol et
        const lastSignInAt = profile.last_sign_in_at ? new Date(profile.last_sign_in_at) : null
        const daysSinceLastLogin = lastSignInAt
          ? Math.floor((now.getTime() - lastSignInAt.getTime()) / (24 * 60 * 60 * 1000))
          : 999 // Hiç giriş yapmamışsa çok büyük bir değer

        // Son 24 saatte başarısız ödeme var mı?
        const recentPayments = await getUserPaymentActivity(supabase, userId, 24)
        const failedPaymentCount = recentPayments.filter((p: any) => p.payment_status === "failed").length

        // Risk faktörlerini belirle
        const riskFactors: RiskFactors = {
          isNewUser: userRegisteredDaysAgo < 7,
          isInactiveUser: daysSinceLastLogin > 30,
          hasMultipleFailedPayments: failedPaymentCount >= 3,
          isHighAmount: plan.price > 1000,
          userRegisteredDaysAgo,
          daysSinceLastLogin,
          failedPaymentCount,
          paymentAmount: plan.price,
        }

        // Risk skorunu hesapla
        const riskAssessment = calculateRiskScore(riskFactors)

        console.log(`[subscription-renewal] User ${userId} risk assessment:`, {
          score: riskAssessment.score,
          level: riskAssessment.level,
          flags: riskAssessment.flags,
        })

        // CRITICAL risk ise ödemeyi yapma, manual review gerekiyor
        if (riskAssessment.level === "critical" && riskAssessment.score >= 70) {
          console.warn(`[subscription-renewal] CRITICAL RISK - Skipping payment for user ${userId}`)

          // Security log kaydet
          await logSecurityEvent(supabase, {
            userId,
            eventType: "suspicious_activity",
            ipAddress: "cron-server", // Cron job'dan geldiği için server IP
            userAgent: "Vercel Cron Job",
            riskScore: riskAssessment.score,
            riskFactors: riskAssessment.flags,
            metadata: {
              reason: "Critical risk score during renewal",
              subscription_id: subscription.id,
              plan_name: plan.name,
              amount: plan.price,
            },
          })

          results.skipped++
          results.errors.push(`User ${userId}: Critical risk score (${riskAssessment.score}) - Manual review required`)
          continue // Bu ödemeyi atlat, devam et
        }

        // Benzersiz sipariş numarası oluştur (REN3D prefix for 3D Secure)
        const orderId = `REN3D${userId.replace(/-/g, "").substring(0, 14)}${Date.now()}`

        console.log(`[subscription-renewal] Creating 3D Secure payment request for user ${userId}`)

        // Security event log: Payment request
        await logSecurityEvent(supabase, {
          userId,
          eventType: "payment_attempt",
          ipAddress: "cron-server",
          userAgent: "Vercel Cron Job - 3D Secure Renewal",
          riskScore: riskAssessment.score,
          riskFactors: riskAssessment.flags,
          metadata: {
            merchant_oid: orderId,
            subscription_id: subscription.id,
            plan_name: plan.name,
            amount: plan.price,
            renewal_type: "3d_secure_sms",
          },
        })

        // 3D SECURE PAYMENT REQUEST (yeni metod)
        const paymentResult = await paytrClient.create3DSecureRecurringPayment(
          savedCard.paytr_user_tokens.utoken,
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
          "85.34.78.112", // Server IP
          {
            currency: (plan.currency as "TL" | "TRY" | "EUR" | "USD") || "TL",
            testMode: process.env.PAYTR_TEST_MODE === "1",
          }
        )

        results.processed++

        if (paymentResult.status === "success" && paymentResult.payment_url) {
          // Payment URL oluşturuldu - pending renewal kaydet
          const paymentExpiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000) // 72 hours

          await supabase.from("pending_renewal_payments").insert({
            user_id: userId,
            subscription_id: subscription.id,
            merchant_oid: orderId,
            payment_url: paymentResult.payment_url,
            utoken: savedCard.paytr_user_tokens.utoken,
            ctoken: savedCard.ctoken,
            amount: plan.price,
            currency: plan.currency || "TRY",
            plan_id: plan.id,
            status: "pending",
            expires_at: paymentExpiresAt.toISOString(),
            metadata: {
              risk_score: riskAssessment.score,
              risk_level: riskAssessment.level,
              fraud_flags: riskAssessment.flags,
              initiated_by: "cron_job",
            },
          })

          // Subscription'ı "requires_payment_action" olarak işaretle
          await supabase
            .from("subscriptions")
            .update({
              requires_payment_action: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", subscription.id)

          // Kullanıcıya renewal request email gönder
          if (profile?.email) {
            await sendRenewalRequestNotification({
              userName: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email,
              userEmail: profile.email,
              planName: plan.name,
              amount: plan.price,
              currency: plan.currency || "TRY",
              renewalDate: subscription.expires_at,
              paymentUrl: paymentResult.payment_url,
              linkExpiresIn: "72 saat",
            })
          }

          console.log(`[subscription-renewal] Payment request created for user ${userId}`)
          results.payment_requests_created++
        } else {
          // Payment request başarısız
          console.error(`[subscription-renewal] Payment request failed for user ${userId}:`, paymentResult.msg)

          // Security log: Payment request failed
          await logSecurityEvent(supabase, {
            userId,
            eventType: "payment_failed",
            ipAddress: "cron-server",
            userAgent: "Vercel Cron Job - 3D Secure Renewal",
            riskScore: riskAssessment.score,
            riskFactors: riskAssessment.flags,
            metadata: {
              merchant_oid: orderId,
              subscription_id: subscription.id,
              amount: plan.price,
              renewal_type: "3d_secure_sms",
              error_message: paymentResult.msg,
            },
          })

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
