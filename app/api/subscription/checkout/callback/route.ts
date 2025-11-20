import { type NextRequest, NextResponse } from "next/server"
import { PayTRClient } from "@/lib/paytr-client"
import { createClient } from "@supabase/supabase-js"
import { sendNewSubscriptionNotification } from "@/lib/email/subscription-notification"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

/**
 * PayTR Checkout Callback Handler
 * PayTR ödeme sonucu burada POST request olarak gelir
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.formData()

    // PayTR callback parametreleri
    const merchant_oid = body.get("merchant_oid") as string
    const status = body.get("status") as string
    const total_amount = body.get("total_amount") as string
    const hash = body.get("hash") as string
    const failed_reason_code = body.get("failed_reason_code") as string
    const failed_reason_msg = body.get("failed_reason_msg") as string
    const test_mode = body.get("test_mode") as string
    const payment_type = body.get("payment_type") as string
    const currency = body.get("currency") as string
    const payment_amount = body.get("payment_amount") as string

    if (!merchant_oid || !status || !hash) {
      console.error("[paytr-callback] Missing required parameters")
      return new Response("OK", { status: 200 }) // PayTR'ye OK dönmeliyiz
    }

    // Initialize PayTR client
    const paytrClient = new PayTRClient()

    // Hash doğrulama
    const isValid = paytrClient.verifyCallback({
      merchant_oid,
      status,
      total_amount,
      hash,
      failed_reason_code,
      failed_reason_msg,
      test_mode,
      payment_type,
      currency,
      payment_amount,
    })

    if (!isValid) {
      console.error("[paytr-callback] Invalid callback hash - possible forgery attempt")
      return new Response("OK", { status: 200 }) // Yine de OK dön
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get pending subscription info from order ID
    const { data: pendingSubscription } = await supabase
      .from("pending_subscriptions")
      .select("*")
      .eq("conversation_id", merchant_oid)
      .single()

    if (!pendingSubscription) {
      console.error("[paytr-callback] Pending subscription not found for order:", merchant_oid)
      return new Response("OK", { status: 200 })
    }

    const userId = pendingSubscription.user_id
    const planId = pendingSubscription.plan_id

    // Ödeme başarılı mı kontrol et
    if (status === "success") {
      // Get plan details
      const { data: plan } = await supabase.from("subscription_plans").select("*").eq("id", planId).single()

      if (!plan) {
        console.error("[paytr-callback] Plan not found")
        return new Response("OK", { status: 200 })
      }

      // Calculate expiry date based on plan
      const startDate = new Date()
      const expiresAt = new Date(startDate)

      if (plan.billing_period === "yearly") {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1)
      } else if (plan.billing_period === "monthly") {
        expiresAt.setMonth(expiresAt.getMonth() + 1)
      } else {
        // lifetime
        expiresAt.setFullYear(expiresAt.getFullYear() + 100)
      }

      // Create or update subscription in database
      const { data: newSubscription, error: subError } = await supabase
        .from("subscriptions")
        .upsert(
          {
            user_id: userId,
            plan_id: planId,
            plan_type: "premium",
            status: "active",
            start_date: startDate.toISOString(),
            expires_at: expiresAt.toISOString(),
            payment_method: "paytr",
            paytr_order_id: merchant_oid,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          },
        )
        .select()
        .single()

      if (subError || !newSubscription) {
        console.error("[paytr-callback] Subscription creation failed:", subError)
        return new Response("OK", { status: 200 })
      }

      // Update usage limits for premium users
      const premiumLimit = plan.billing_period === "yearly" ? 9999999 : 999999

      const { error: usageError } = await supabase.from("usage_tracking").upsert(
        [
          {
            user_id: userId,
            feature_type: "ocr_analysis",
            limit_count: premiumLimit,
            used_count: 0,
            reset_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            user_id: userId,
            feature_type: "risk_analysis",
            limit_count: premiumLimit,
            used_count: 0,
            reset_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "user_id,feature_type" },
      )

      if (usageError) {
        console.error("[paytr-callback] Usage update failed:", usageError)
      }

      // Mark pending subscription as completed
      await supabase
        .from("pending_subscriptions")
        .update({
          status: "completed",
          subscription_reference: merchant_oid,
          updated_at: new Date().toISOString(),
        })
        .eq("conversation_id", merchant_oid)

      // Create payment transaction record
      const amountInTL = parseFloat(total_amount) / 100 // Kuruştan TL'ye çevir

      const { error: txError } = await supabase.from("payment_transactions").insert({
        user_id: userId,
        subscription_id: newSubscription.id,
        plan_id: planId,
        amount: amountInTL,
        currency: currency || "TRY",
        status: "completed",
        payment_method: "paytr",
        paytr_order_id: merchant_oid,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (txError) {
        console.error("[paytr-callback] Failed to create transaction record:", txError)
      }

      // Create invoice
      const invoiceNumber = `INV-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-${newSubscription.id.slice(0, 8).toUpperCase()}`
      const { error: invoiceError } = await supabase.from("invoices").insert({
        user_id: userId,
        subscription_id: newSubscription.id,
        payment_id: merchant_oid,
        invoice_number: invoiceNumber,
        invoice_date: new Date().toISOString().split("T")[0],
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        amount: amountInTL,
        currency: currency || "TRY",
        status: "paid",
        description: `Abonelik - ${plan.name}`,
      })

      if (invoiceError) {
        console.error("[paytr-callback] Failed to create invoice:", invoiceError)
      }

      // Send subscription notification email
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", userId)
        .single()

      if (userProfile) {
        const userName = `${userProfile.first_name || ""} ${userProfile.last_name || ""}`.trim() || userProfile.email

        const emailResult = await sendNewSubscriptionNotification({
          userName,
          userEmail: userProfile.email,
          planName: plan.name,
          amount: amountInTL,
          currency: currency || "TRY",
          startDate: startDate.toISOString(),
          expiresAt: expiresAt.toISOString(),
        })

        if (!emailResult.success) {
          console.error("[paytr-callback] Failed to send subscription notification:", emailResult.error)
        }
      }

      console.log("[paytr-callback] Subscription activated successfully:", merchant_oid)
    } else {
      // Ödeme başarısız
      console.error("[paytr-callback] Payment failed:", failed_reason_msg)

      // Mark pending subscription as failed
      await supabase
        .from("pending_subscriptions")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("conversation_id", merchant_oid)

      // Log failed payment
      await supabase.from("payment_transactions").insert({
        user_id: userId,
        plan_id: planId,
        amount: 0,
        currency: currency || "TRY",
        status: "failed",
        payment_method: "paytr",
        error_message: failed_reason_msg || "Payment failed",
        created_at: new Date().toISOString(),
      })
    }

    // PayTR'ye başarılı yanıt dön
    return new Response("OK", { status: 200 })
  } catch (error: any) {
    console.error("[paytr-callback] Callback error:", error)
    // PayTR'ye her durumda OK dönmeliyiz
    return new Response("OK", { status: 200 })
  }
}

/**
 * GET handler - kullanıcıyı success/fail sayfasına yönlendir
 * PayTR kullanıcıyı merchant_ok_url'e yönlendirdiğinde buraya gelir
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const merchant_oid = searchParams.get("merchant_oid")
  const status = searchParams.get("status")

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  if (status === "success") {
    return NextResponse.redirect(`${baseUrl}/uygulama/odeme/basarili`, 303)
  } else {
    const reason = searchParams.get("failed_reason_msg") || "unknown"
    return NextResponse.redirect(`${baseUrl}/uygulama/ayarlar?payment=failed&reason=${encodeURIComponent(reason)}`, 303)
  }
}
