import { type NextRequest, NextResponse } from "next/server"
import { IyzipaySubscriptionClient } from "@/lib/iyzipay-client"
import { createClient } from "@supabase/supabase-js"
import { sendNewSubscriptionNotification } from "@/lib/email/subscription-notification"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

/**
 * PCI-DSS UYUMLU: RECURRING SUBSCRIPTION Checkout Form Callback Handler
 * Kullanıcı subscription ödemeyi tamamladıktan sonra Iyzico buraya yönlendirir
 * Bu handler recurring subscription bilgilerini alır ve veritabanını günceller
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[subscription-callback] Recurring subscription callback received")

    // Build base URL from environment or request
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`

    const body = await request.formData()
    const token = body.get("token") as string

    if (!token) {
      console.error("[subscription-callback] No token in callback")
      return NextResponse.redirect(`${baseUrl}/uygulama/ayarlar?payment=failed&reason=no_token`, 303)
    }

    console.log("[subscription-callback] Token:", token)

    // Initialize Iyzico client
    const iyzipayClient = new IyzipaySubscriptionClient({
      apiKey: process.env.IYZICO_API_KEY!,
      secretKey: process.env.IYZICO_SECRET_KEY!,
      uri: process.env.IYZICO_BASE_URL!,
    })

    // Retrieve subscription result from Iyzico
    const result = await iyzipayClient.retrieveSubscriptionCheckoutFormResult(token)

    console.log("[subscription-callback] Subscription result:", {
      status: result.status,
      subscriptionStatus: result.data?.subscriptionStatus,
      referenceCode: result.data?.referenceCode,
      customerReferenceCode: result.data?.customerReferenceCode,
    })

    if (result.status !== "success" || !result.data) {
      console.error("[subscription-callback] Subscription creation failed:", result.errorMessage)
      return NextResponse.redirect(
        `${baseUrl}/uygulama/ayarlar?payment=failed&reason=${encodeURIComponent(result.errorMessage || "unknown")}`,
        303,
      )
    }

    const subscriptionData = result.data

    // Subscription başarılı - veritabanını güncelle
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get pending subscription info
    const { data: pendingSubscription } = await supabase
      .from("pending_subscriptions")
      .select("*")
      .eq("token", token)
      .single()

    if (!pendingSubscription) {
      console.error("[subscription-callback] Pending subscription not found")
      return NextResponse.redirect(`${baseUrl}/uygulama/ayarlar?payment=failed&reason=subscription_not_found`, 303)
    }

    const userId = pendingSubscription.user_id
    const planId = pendingSubscription.plan_id

    console.log("[subscription-callback] Creating subscription record for user:", userId)

    // Get plan details
    const { data: plan } = await supabase.from("subscription_plans").select("*").eq("id", planId).single()

    if (!plan) {
      console.error("[subscription-callback] Plan not found")
      return NextResponse.redirect(`${baseUrl}/uygulama/ayarlar?payment=failed&reason=plan_not_found`, 303)
    }

    // Calculate expiry date based on plan
    const startDate = new Date(subscriptionData.startDate || Date.now())
    const expiresAt = new Date(startDate)

    if (plan.billing_period === "yearly") {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    } else if (plan.billing_period === "monthly") {
      expiresAt.setMonth(expiresAt.getMonth() + 1)
    } else {
      // lifetime
      expiresAt.setFullYear(expiresAt.getFullYear() + 100)
    }

    console.log("[subscription-callback] Calculated dates:", {
      startDate: startDate.toISOString(),
      expiresAt: expiresAt.toISOString(),
      billingPeriod: plan.billing_period,
    })

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
          payment_method: "iyzico_subscription",
          iyzico_subscription_reference: subscriptionData.referenceCode,
          iyzico_subscription_id: subscriptionData.referenceCode,
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
      console.error("[subscription-callback] Subscription creation failed:", subError)
      return NextResponse.redirect(`${baseUrl}/uygulama/ayarlar?payment=failed&reason=subscription_error`, 303)
    }

    console.log("[subscription-callback] Subscription created successfully:", newSubscription.id)

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
      console.error("[subscription-callback] Usage update failed:", usageError)
      // Don't fail - subscription is created
    }

    // Mark pending subscription as completed
    await supabase
      .from("pending_subscriptions")
      .update({
        status: "completed",
        subscription_reference: subscriptionData.referenceCode,
        updated_at: new Date().toISOString(),
      })
      .eq("token", token)

    // Create payment transaction record
    const { error: txError } = await supabase.from("payment_transactions").insert({
      user_id: userId,
      subscription_id: newSubscription.id,
      plan_id: planId,
      amount: plan.price,
      currency: plan.currency || "TRY",
      status: "completed",
      payment_method: "iyzico_subscription",
      iyzico_payment_id: subscriptionData.referenceCode,
      iyzico_conversation_id: pendingSubscription.conversation_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (txError) {
      console.error("[subscription-callback] Failed to create transaction record:", txError)
      // Don't fail - subscription is created
    }

    // Create pending invoice
    const invoiceNumber = `INV-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-${newSubscription.id.slice(0, 8).toUpperCase()}`
    const { error: invoiceError } = await supabase.from("invoices").insert({
      user_id: userId,
      subscription_id: newSubscription.id,
      payment_id: subscriptionData.referenceCode,
      invoice_number: invoiceNumber,
      invoice_date: new Date().toISOString().split("T")[0],
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      amount: plan.price,
      currency: plan.currency || "TRY",
      status: "pending",
      description: `Recurring Abonelik - ${plan.name}`,
    })

    if (invoiceError) {
      console.error("[subscription-callback] Failed to create invoice:", invoiceError)
    } else {
      console.log("[subscription-callback] Invoice created:", invoiceNumber)
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
        amount: plan.price,
        currency: plan.currency || "TRY",
        startDate: startDate.toISOString(),
        expiresAt: expiresAt.toISOString(),
      })

      if (emailResult.success) {
        console.log("[subscription-callback] Subscription notification sent successfully")
      } else {
        console.error("[subscription-callback] Failed to send subscription notification:", emailResult.error)
      }
    }

    console.log("[subscription-callback] Recurring subscription activated successfully")
    console.log("[subscription-callback] Redirecting to success page")

    // Redirect to success page
    return NextResponse.redirect(`${baseUrl}/uygulama/odeme/basarili`, 303)
  } catch (error: any) {
    console.error("[subscription-callback] Callback error:", error)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    return NextResponse.redirect(
      `${baseUrl}/uygulama/ayarlar?payment=failed&reason=${encodeURIComponent(error.message)}`,
      303,
    )
  }
}

/**
 * GET handler for testing
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 })
  }

  // Same logic as POST but from query parameter
  return POST(request)
}
