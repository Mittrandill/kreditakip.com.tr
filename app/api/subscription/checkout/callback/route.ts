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

    // Kart saklama (CAPI) parametreleri
    const utoken = body.get("utoken") as string | null
    const ctoken = body.get("ctoken") as string | null
    const last4 = body.get("last_4") as string | null
    const cardMonth = body.get("month") as string | null
    const cardYear = body.get("year") as string | null
    const cardBank = body.get("c_bank") as string | null
    const cardName = body.get("c_name") as string | null
    const cardBrand = body.get("c_brand") as string | null
    const cardType = body.get("c_type") as string | null
    const cardSchema = body.get("schema") as string | null
    const businessCard = body.get("businessCard") as string | null
    const requireCvv = body.get("require_cvv") as string | null

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

    // IDEMPOTENCY CHECK: Prevent duplicate processing
    // If pending subscription is already completed, ignore this webhook
    if (pendingSubscription.status === "completed") {
      console.log("[paytr-callback] Order already processed, ignoring duplicate webhook:", merchant_oid)
      return new Response("OK", { status: 200 })
    }

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

      // Check if user already has a subscription
      const { data: existingSubscription } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .single()

      let newSubscription
      let subError

      if (existingSubscription) {
        // Update existing subscription
        const { data, error } = await supabase
          .from("subscriptions")
          .update({
            plan_id: planId,
            plan_type: "premium",
            status: "active",
            start_date: startDate.toISOString(),
            expires_at: expiresAt.toISOString(),
            payment_method: "paytr",
            paytr_order_id: merchant_oid,
            payment_subscription_reference: merchant_oid,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .select()
          .single()

        newSubscription = data
        subError = error
      } else {
        // Create new subscription
        const { data, error } = await supabase
          .from("subscriptions")
          .insert({
            user_id: userId,
            plan_id: planId,
            plan_type: "premium",
            status: "active",
            start_date: startDate.toISOString(),
            expires_at: expiresAt.toISOString(),
            payment_method: "paytr",
            paytr_order_id: merchant_oid,
            payment_subscription_reference: merchant_oid,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        newSubscription = data
        subError = error
      }

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
        paytr_conversation_id: merchant_oid, // PayTR uses same ID for both
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (txError) {
        console.error("[paytr-callback] Failed to create transaction record:", txError)
      }

      // Create invoice with unique number using merchant_oid (always unique)
      const invoiceNumber = `INV-${merchant_oid}`
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

      // DEBUG: Kart saklama parametrelerini logla
      console.log("[paytr-callback] Card Storage Check - utoken received:", utoken ? "YES" : "NO", utoken || "")
      console.log("[paytr-callback] NOTE: ctoken is NOT returned in callback - will fetch via CAPI LIST")

      // Kart saklama bilgilerini kaydet (CAPI)
      // NOT: Callback'te sadece utoken döner, ctoken için CAPI LIST çağırmalıyız
      if (utoken) {
        console.log("[paytr-callback] utoken received, saving and fetching card details via CAPI LIST...")

        // 1. Önce paytr_user_tokens tablosuna utoken'ı kaydet
        // NOT: Constraint adı "paytr_user_tokens_user_id_key" olduğu için onConflict kullanamıyoruz
        // Önce kontrol edip sonra insert veya update yapacağız
        const { data: existingUtoken } = await supabase
          .from("paytr_user_tokens")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle()

        let utokenError = null
        if (existingUtoken) {
          // Update existing
          const { error } = await supabase
            .from("paytr_user_tokens")
            .update({
              utoken: utoken,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
          utokenError = error
        } else {
          // Insert new
          const { error } = await supabase
            .from("paytr_user_tokens")
            .insert({
              user_id: userId,
              utoken: utoken,
              updated_at: new Date().toISOString(),
            })
          utokenError = error
        }

        if (utokenError) {
          console.error("[paytr-callback] Failed to save utoken:", utokenError)
        } else {
          console.log("[paytr-callback] ✓ utoken saved successfully")
        }

        // 2. CAPI LIST çağır - utoken ile kart bilgilerini al
        try {
          console.log("[paytr-callback] Calling CAPI LIST to get ctoken...")
          const cardList = await paytrClient.listSavedCards(utoken)

          console.log("[paytr-callback] CAPI LIST response:", cardList)

          // Kartlar varsa kaydet
          if (cardList && Array.isArray(cardList) && cardList.length > 0) {
            console.log(`[paytr-callback] Found ${cardList.length} saved card(s)`)

            for (const card of cardList) {
              const { error: cardError } = await supabase
                .from("paytr_saved_cards")
                .upsert(
                  {
                    user_id: userId,
                    utoken: utoken,
                    ctoken: card.ctoken,
                    last_4: card.last_4 || "",
                    card_holder_name: card.c_name || null,
                    expiry_month: card.month || "",
                    expiry_year: card.year || "",
                    require_cvv: card.require_cvv === "1",
                    bank_name: card.c_bank || null,
                    card_brand: card.c_brand || null,
                    card_type: card.c_type || null,
                    card_schema: card.schema || null,
                    is_business_card: card.businessCard === "y",
                    is_default: true, // İlk kart varsayılan
                    is_active: true,
                    last_used_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                  { onConflict: "ctoken" }
                )

              if (cardError) {
                console.error("[paytr-callback] Failed to save card:", cardError)
              } else {
                console.log("[paytr-callback] ✓ Card saved - ctoken:", card.ctoken, "last_4:", card.last_4)
              }
            }
          } else {
            console.warn("[paytr-callback] ⚠️ CAPI LIST returned no cards")
          }
        } catch (capiError: any) {
          console.error("[paytr-callback] ❌ CAPI LIST error:", capiError.message)
        }

      } else {
        // Token bilgileri gelmedi - kart saklanamadı
        console.warn("[paytr-callback] ⚠️ Card storage tokens NOT received from PayTR")
        console.warn("  Possible reasons:")
        console.warn("  1. 'Kartımı güvenli bir şekilde sakla' checkbox was not checked")
        console.warn("  2. PayTR CAPI feature is not enabled for this merchant account")
        console.warn("  3. PayTR test mode does not support card storage")
        console.warn("  4. Check PayTR panel settings for CAPI activation")
        console.warn("  → Contact PayTR support to enable CAPI (Card Storage) feature")
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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  // If no merchant_oid, check for status parameter (fallback)
  const status = searchParams.get("status")
  if (!merchant_oid) {
    if (status === "success") {
      return NextResponse.redirect(`${baseUrl}/uygulama/odeme/basarili`, 303)
    } else {
      const reason = searchParams.get("failed_reason_msg") || "unknown"
      return NextResponse.redirect(`${baseUrl}/uygulama/ayarlar?payment=failed&reason=${encodeURIComponent(reason)}`, 303)
    }
  }

  // Check pending subscription status to determine if payment was successful
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data: pendingSubscription } = await supabase
    .from("pending_subscriptions")
    .select("status")
    .eq("conversation_id", merchant_oid)
    .single()

  if (pendingSubscription?.status === "completed") {
    return NextResponse.redirect(`${baseUrl}/uygulama/odeme/basarili`, 303)
  } else {
    const reason = searchParams.get("failed_reason_msg") || "Payment verification pending"
    return NextResponse.redirect(`${baseUrl}/uygulama/ayarlar?payment=failed&reason=${encodeURIComponent(reason)}`, 303)
  }
}
