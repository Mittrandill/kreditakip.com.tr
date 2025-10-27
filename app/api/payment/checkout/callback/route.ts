import { type NextRequest, NextResponse } from "next/server"
import { IyzipaySubscriptionClient } from "@/lib/iyzipay-client"
import { createClient } from "@supabase/supabase-js"
import { sendInvoiceNotification } from "@/lib/email/invoice-notification"

export const runtime = "nodejs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

/**
 * PCI-DSS UYUMLU: Checkout Form Callback Handler
 * Kullanıcı ödemeyi tamamladıktan sonra Iyzico buraya yönlendirir
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[checkout-callback] Payment callback received")

    // Build base URL from environment or request
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`

    const body = await request.formData()
    const token = body.get("token") as string

    if (!token) {
      console.error("[checkout-callback] No token in callback")
      return NextResponse.redirect(`${baseUrl}/uygulama/ayarlar?payment=failed&reason=no_token`, 303)
    }

    console.log("[checkout-callback] Token:", token)

    // Initialize Iyzico client
    const iyzipayClient = new IyzipaySubscriptionClient({
      apiKey: process.env.IYZICO_API_KEY!,
      secretKey: process.env.IYZICO_SECRET_KEY!,
      uri: process.env.IYZICO_BASE_URL!,
    })

    // Retrieve payment result from Iyzico
    const result = await iyzipayClient.retrieveCheckoutFormResult(token)

    console.log("[checkout-callback] Payment result:", {
      status: result.status,
      paymentStatus: result.paymentStatus,
      paymentId: result.paymentId,
      fraudStatus: result.fraudStatus,
    })

    if (result.status !== "success" || result.paymentStatus !== "SUCCESS") {
      console.error("[checkout-callback] Payment failed:", result.errorMessage)
      return NextResponse.redirect(
        `${baseUrl}/uygulama/ayarlar?payment=failed&reason=${encodeURIComponent(result.errorMessage || "unknown")}`,
        303
      )
    }

    // Payment successful - create subscription
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get pending payment info
    const { data: pendingPayment } = await supabase
      .from("pending_payments")
      .select("*")
      .eq("token", token)
      .single()

    if (!pendingPayment) {
      console.error("[checkout-callback] Pending payment not found")
      return NextResponse.redirect(`${baseUrl}/uygulama/ayarlar?payment=failed&reason=payment_not_found`, 303)
    }

    const userId = pendingPayment.user_id
    const planId = pendingPayment.plan_id

    console.log("[checkout-callback] Creating subscription for user:", userId)

    // Get plan details
    const { data: plan } = await supabase.from("subscription_plans").select("*").eq("id", planId).single()

    if (!plan) {
      console.error("[checkout-callback] Plan not found")
      return NextResponse.redirect(`${baseUrl}/uygulama/ayarlar?payment=failed&reason=plan_not_found`, 303)
    }

    console.log("[checkout-callback] Plan details:", { planId, billing_interval: plan.billing_interval })

    // Calculate expiry date
    const startDate = new Date()
    const expiresAt = new Date(startDate)

    // Check billing_interval from plan
    if (plan.billing_interval === "yearly" || plan.billing_interval === 12) {
      console.log("[checkout-callback] Setting yearly expiry (+ 1 year)")
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    } else {
      console.log("[checkout-callback] Setting monthly expiry (+ 1 month)")
      expiresAt.setMonth(expiresAt.getMonth() + 1)
    }

    console.log("[checkout-callback] Calculated dates:", {
      startDate: startDate.toISOString(),
      expiresAt: expiresAt.toISOString(),
    })

    // Create subscription
    const { data: newSubscription, error: subError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan_id: planId,
        plan_type: "premium",
        status: "active",
        start_date: startDate.toISOString(),
        expires_at: expiresAt.toISOString(),
        payment_method: "iyzico_checkout",
        iyzico_payment_id: result.paymentId,
        iyzico_subscription_reference: result.paymentId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (subError || !newSubscription) {
      console.error("[checkout-callback] Subscription creation failed:", subError)
      return NextResponse.redirect(`${baseUrl}/uygulama/ayarlar?payment=failed&reason=subscription_error`, 303)
    }

    // Update usage limits
    const premiumLimit = plan.billing_interval === "yearly" ? 9999999 : 999999

    const { error: usageError } = await supabase
      .from("usage_tracking")
      .upsert(
        {
          user_id: userId,
          feature_type: "ocr_analysis",
          limit_count: premiumLimit,
          used_count: 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,feature_type" },
      )

    if (usageError) {
      console.error("[checkout-callback] Usage update failed:", usageError)
      // Don't fail - subscription is created
    }

    // Mark pending payment as completed
    await supabase
      .from("pending_payments")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("token", token)

    // Create payment transaction / invoice record
    const { error: txError } = await supabase.from("payment_transactions").insert({
      user_id: userId,
      subscription_id: newSubscription.id,
      amount: plan.price,
      currency: plan.currency || "TRY",
      status: "completed",
      payment_method: "iyzico_checkout",
      iyzico_payment_id: result.paymentId || null,
      iyzico_conversation_id: result.conversationId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (txError) {
      console.error("[checkout-callback] Failed to create transaction record:", txError)
      // Don't fail - subscription is created
    } else {
      console.log("[checkout-callback] Payment transaction record created successfully")
    }

    // Create pending invoice for admin to upload PDF
    const invoiceNumber = `INV-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${newSubscription.id.slice(0, 8).toUpperCase()}`
    const { error: invoiceError } = await supabase.from("invoices").insert({
      user_id: userId,
      subscription_id: newSubscription.id,
      payment_id: result.paymentId,
      invoice_number: invoiceNumber,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: plan.price,
      currency: plan.currency || "TRY",
      status: "pending", // Pending until admin uploads PDF
      description: `Abonelik Ödemesi - ${plan.name}`,
    })

    if (invoiceError) {
      console.error("[checkout-callback] Failed to create invoice:", invoiceError)
      // Don't fail - subscription is created
    } else {
      console.log("[checkout-callback] Pending invoice created:", invoiceNumber)
    }

    // Save billing info to billing_info table for admin panel
    if (pendingPayment.metadata?.billingInfo) {
      const billingInfo = pendingPayment.metadata.billingInfo
      console.log("[checkout-callback] Saving billing info to database")

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
      } else {
        console.log("[checkout-callback] Billing info saved successfully")
      }
    }

    // Send invoice notification email to admin
    if (pendingPayment.metadata?.billingInfo) {
      console.log("[checkout-callback] Sending invoice notification email to info@kreditakip.com.tr")

      const emailResult = await sendInvoiceNotification({
        userId,
        subscriptionId: newSubscription.id,
        planName: plan.name,
        planId: plan.id,
        amount: plan.price,
        currency: plan.currency || "TRY",
        paymentId: result.paymentId,
        billingInfo: pendingPayment.metadata.billingInfo,
        paymentDate: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
      })

      if (emailResult.success) {
        console.log("[checkout-callback] Invoice notification sent successfully, messageId:", emailResult.messageId)
      } else {
        console.error("[checkout-callback] Failed to send invoice notification:", emailResult.error)
        // Don't fail - subscription is created, email is not critical
      }
    }

    console.log("[checkout-callback] Subscription created successfully")
    console.log("[checkout-callback] Redirecting to success page")

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
