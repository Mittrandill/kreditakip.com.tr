import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
import { IyzipaySubscriptionClient } from "@/lib/iyzipay-client"
import { createClient } from "@supabase/supabase-js"
import { sendInvoiceNotification } from "@/lib/email/invoice-notification"
import { sendNewSubscriptionNotification } from "@/lib/email/subscription-notification"

export const runtime = "nodejs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

/**
 * PCI-DSS UYUMLU: Checkout Form Callback Handler
 * Kullanıcı ödemeyi tamamladıktan sonra Iyzico buraya yönlendirir
 */
export async function POST(request: NextRequest) {
  try {
    // Build base URL from environment or request
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`

    const body = await request.formData()
    const token = body.get("token") as string

    if (!token) {
      console.error("[checkout-callback] No token in callback")
      return NextResponse.redirect(`${baseUrl}/uygulama/ayarlar?payment=failed&reason=no_token`, 303)
    }

    // Initialize Iyzico client
    const iyzipayClient = new IyzipaySubscriptionClient({
      apiKey: process.env.IYZICO_API_KEY!,
      secretKey: process.env.IYZICO_SECRET_KEY!,
      uri: process.env.IYZICO_BASE_URL!,
    })

    // Retrieve RECURRING SUBSCRIPTION result from Iyzico
    const result = await iyzipayClient.retrieveSubscriptionCheckoutFormResult(token)

    if (result.status !== "success" || !result.data) {
      console.error("[checkout-callback] Subscription creation failed:", result.errorCode, result.errorMessage)
      return NextResponse.redirect(
        `${baseUrl}/uygulama/ayarlar?payment=failed&reason=${encodeURIComponent(result.errorMessage || "unknown")}`,
        303,
      )
    }

    const subscriptionData = result.data

    // Subscription successful - create subscription record
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Try pending_payments first (old flow), then pending_subscriptions (new flow)
    let userId: string | null = null
    let planId: string | null = null
    let billingInfoMetadata: any = null

    const { data: pendingPayment } = await supabase.from("pending_payments").select("*").eq("token", token).single()

    if (pendingPayment) {
      userId = pendingPayment.user_id
      planId = pendingPayment.plan_id
      billingInfoMetadata = pendingPayment.metadata
    } else {
      // Check pending_subscriptions
      const { data: pendingSubscription } = await supabase
        .from("pending_subscriptions")
        .select("*")
        .eq("token", token)
        .single()

      if (pendingSubscription) {
        userId = pendingSubscription.user_id
        planId = pendingSubscription.plan_id
      }
    }

    if (!userId || !planId) {
      console.error("[checkout-callback] Pending payment/subscription not found")
      return NextResponse.redirect(`${baseUrl}/uygulama/ayarlar?payment=failed&reason=payment_not_found`, 303)
    }

    // Get plan details
    const { data: plan } = await supabase.from("subscription_plans").select("*").eq("id", planId).single()

    if (!plan) {
      console.error("[checkout-callback] Plan not found")
      return NextResponse.redirect(`${baseUrl}/uygulama/ayarlar?payment=failed&reason=plan_not_found`, 303)
    }

    // Calculate expiry date based on subscription start date from iyzico
    const startDate = new Date(subscriptionData.startDate || Date.now())
    const expiresAt = new Date(startDate)

    // Check billing_period from plan
    if (plan.billing_period === "yearly") {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    } else if (plan.billing_period === "monthly") {
      expiresAt.setMonth(expiresAt.getMonth() + 1)
    } else {
      // lifetime
      expiresAt.setFullYear(expiresAt.getFullYear() + 100)
    }

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .single()

    let newSubscription
    let subError

    if (existingSubscription) {
      // Update existing active subscription
      const { data, error } = await supabase
        .from("subscriptions")
        .update({
          plan_id: planId,
          plan_type: "premium",
          status: "active",
          start_date: startDate.toISOString(),
          expires_at: expiresAt.toISOString(),
          payment_method: "iyzico_subscription",
          iyzico_subscription_reference: subscriptionData.referenceCode,
          iyzico_subscription_id: subscriptionData.referenceCode,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSubscription.id)
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
          payment_method: "iyzico_subscription",
          iyzico_subscription_reference: subscriptionData.referenceCode,
          iyzico_subscription_id: subscriptionData.referenceCode,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      newSubscription = data
      subError = error
    }

    if (subError || !newSubscription) {
      console.error("[checkout-callback] Subscription creation failed:", subError)
      return NextResponse.redirect(`${baseUrl}/uygulama/ayarlar?payment=failed&reason=subscription_error`, 303)
    }

    // Update usage limits
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
      console.error("[checkout-callback] Usage update failed:", usageError)
      // Don't fail - subscription is created
    }

    // Mark pending payment/subscription as completed
    if (pendingPayment) {
      await supabase
        .from("pending_payments")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("token", token)
    }

    await supabase
      .from("pending_subscriptions")
      .update({
        status: "completed",
        subscription_reference: subscriptionData.referenceCode,
        updated_at: new Date().toISOString(),
      })
      .eq("token", token)

    // Create payment transaction record for recurring subscription
    const { error: txError } = await supabase.from("payment_transactions").insert({
      user_id: userId,
      subscription_id: newSubscription.id,
      plan_id: planId,
      amount: plan.price,
      currency: plan.currency || "TRY",
      status: "completed",
      payment_method: "iyzico_subscription",
      iyzico_payment_id: subscriptionData.referenceCode,
      iyzico_conversation_id: token,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (txError) {
      console.error("[checkout-callback] Failed to create transaction record:", txError)
      // Don't fail - subscription is created
    }

    // Create pending invoice for admin to upload PDF
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
      console.error("[checkout-callback] Failed to create invoice:", invoiceError)
      // Don't fail - subscription is created
    }

    // Save billing info to billing_info table for admin panel
    if (billingInfoMetadata?.billingInfo) {
      const billingInfo = billingInfoMetadata.billingInfo

      const { error: billingError } = await supabase
        .from("billing_info")
        .upsert(
          {
            user_id: userId,
            full_name: billingInfo.fullName,
            email: billingInfo.email,
            phone: billingInfo.phone,
            address: billingInfo.address,
            city: billingInfo.city,
            district: billingInfo.district || null,
            postal_code: billingInfo.zipCode || "",
            country: "Türkiye",
            tax_number: billingInfo.taxNumber || null,
            tax_office: billingInfo.taxOffice || null,
            identity_number: billingInfo.identityNumber || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )

      if (billingError) {
        console.error("[checkout-callback] Failed to save billing info:", billingError)
        // Don't fail - subscription is created
      }
    }

    // Send NEW SUBSCRIPTION notification email to admin

    const { data: userProfile } = await supabase
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("id", userId)
      .single()

    if (userProfile) {
      const userName = `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || userProfile.email

      const subscriptionEmailResult = await sendNewSubscriptionNotification({
        userName,
        userEmail: userProfile.email,
        planName: plan.name,
        amount: plan.price,
        currency: plan.currency || "TRY",
        startDate: startDate.toISOString(),
        expiresAt: expiresAt.toISOString(),
      })

      if (!subscriptionEmailResult.success) {
        console.error("[checkout-callback] Failed to send subscription notification:", subscriptionEmailResult.error)
      }
    }

    // Send invoice notification email to admin
    if (billingInfoMetadata?.billingInfo) {

      const emailResult = await sendInvoiceNotification({
        userId,
        subscriptionId: newSubscription.id,
        planName: plan.name,
        planId: plan.id,
        amount: plan.price,
        currency: plan.currency || "TRY",
        paymentId: subscriptionData.referenceCode,
        billingInfo: billingInfoMetadata.billingInfo,
        paymentDate: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
      })

      if (!emailResult.success) {
        console.error("[checkout-callback] Failed to send invoice notification:", emailResult.error)
        // Don't fail - subscription is created, email is not critical
      }
    }

    // Redirect to success page with 303 See Other to convert POST to GET
    return NextResponse.redirect(`${baseUrl}/uygulama/odeme/basarili`, 303)
  } catch (error: any) {
    console.error("[checkout-callback] Callback error:", error)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    return NextResponse.redirect(
      `${baseUrl}/uygulama/ayarlar?payment=failed&reason=${encodeURIComponent(error.message)}`,
      303
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
