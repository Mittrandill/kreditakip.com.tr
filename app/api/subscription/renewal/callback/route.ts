import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createHash } from "crypto"
import {
  sendRenewalSuccessNotification,
  sendRenewalFailedNotification,
} from "@/lib/email/subscription-notification"
import { logSecurityEvent } from "@/lib/security-utils"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

/**
 * PayTR 3D Secure Renewal Callback Handler
 *
 * POST: Receives callbacks from PayTR after 3D Secure payment completion
 * GET: Redirects user back to app after payment (success or failure)
 */

/**
 * GET handler - Redirects user back to app after payment
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const merchantOid = searchParams.get("merchant_oid")
  const status = searchParams.get("status") // "success" or "failed"

  if (!merchantOid) {
    return NextResponse.redirect(new URL("/uygulama/ayarlar?payment=error", request.url))
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Check pending payment status
  const { data: pendingPayment } = await supabase
    .from("pending_renewal_payments")
    .select("status")
    .eq("merchant_oid", merchantOid)
    .single()

  if (!pendingPayment) {
    return NextResponse.redirect(new URL("/uygulama/ayarlar?payment=not_found", request.url))
  }

  // Redirect based on status
  if (pendingPayment.status === "completed") {
    return NextResponse.redirect(new URL("/uygulama/ayarlar?payment=success", request.url))
  } else if (pendingPayment.status === "failed") {
    return NextResponse.redirect(new URL("/uygulama/ayarlar?payment=failed", request.url))
  } else {
    // Still pending - user may need to wait for bank processing
    return NextResponse.redirect(new URL("/uygulama/ayarlar?payment=processing", request.url))
  }
}

/**
 * POST handler - Receives PayTR callback after payment completion
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Extract PayTR callback parameters
    const merchantOid = formData.get("merchant_oid") as string
    const status = formData.get("status") as string // "success" or "failed"
    const totalAmount = formData.get("total_amount") as string
    const hash = formData.get("hash") as string
    const failedReasonCode = formData.get("failed_reason_code") as string
    const failedReasonMsg = formData.get("failed_reason_msg") as string
    const testMode = formData.get("test_mode") as string
    const paymentType = formData.get("payment_type") as string
    const currency = formData.get("currency") as string
    const paymentAmount = formData.get("payment_amount") as string

    console.log("[renewal-callback] Received callback:", {
      merchant_oid: merchantOid,
      status,
      total_amount: totalAmount,
      test_mode: testMode,
    })

    if (!merchantOid || !status || !hash) {
      console.error("[renewal-callback] Missing required parameters")
      return new Response("OK", { status: 200 }) // Return OK to prevent PayTR retries
    }

    // Verify hash signature
    const merchantKey = process.env.PAYTR_MERCHANT_KEY!
    const merchantSalt = process.env.PAYTR_MERCHANT_SALT!

    const hashStr = merchantOid + merchantSalt + status + totalAmount
    const calculatedHash = createHash("sha256")
      .update(hashStr + merchantKey)
      .digest("base64")

    if (hash !== calculatedHash) {
      console.error("[renewal-callback] Hash verification failed")
      return new Response("OK", { status: 200 })
    }

    console.log("[renewal-callback] Hash verified successfully")

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Find pending renewal payment
    const { data: pendingPayment, error: fetchError } = await supabase
      .from("pending_renewal_payments")
      .select(`
        *,
        subscriptions!inner(*),
        profiles!inner(id, email, first_name, last_name)
      `)
      .eq("merchant_oid", merchantOid)
      .single()

    if (fetchError || !pendingPayment) {
      console.error("[renewal-callback] Pending payment not found:", merchantOid)
      return new Response("OK", { status: 200 })
    }

    const userId = pendingPayment.user_id
    const subscription = pendingPayment.subscriptions
    const profile = pendingPayment.profiles

    // Handle payment SUCCESS
    if (status === "success") {
      console.log(`[renewal-callback] Processing successful payment for user ${userId}`)

      const now = new Date()
      const currentExpiry = new Date(subscription.expires_at)
      const newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000) // +30 days

      // Update subscription - renew and clear grace period
      await supabase
        .from("subscriptions")
        .update({
          expires_at: newExpiry.toISOString(),
          status: "active",
          grace_period_started_at: null,
          grace_period_ends_at: null,
          requires_payment_action: false,
          suspended_at: null,
          updated_at: now.toISOString(),
        })
        .eq("id", subscription.id)

      // Mark pending payment as completed
      await supabase
        .from("pending_renewal_payments")
        .update({
          status: "completed",
          completed_at: now.toISOString(),
          paytr_response: {
            status,
            total_amount: totalAmount,
            payment_type: paymentType,
            currency,
            test_mode: testMode,
          },
        })
        .eq("id", pendingPayment.id)

      // Record payment in paytr_recurring_payments
      await supabase.from("paytr_recurring_payments").insert({
        user_id: userId,
        subscription_id: subscription.id,
        merchant_oid: merchantOid,
        utoken: pendingPayment.utoken,
        ctoken: pendingPayment.ctoken,
        amount: parseFloat(totalAmount),
        currency: currency || "TRY",
        payment_status: "completed",
        is_3d_secure: true,
        user_approval_at: now.toISOString(),
        payment_url: pendingPayment.payment_url,
        response_data: {
          status,
          payment_type: paymentType,
          test_mode: testMode,
        },
      })

      // Reset usage limits if user was previously suspended
      if (subscription.status === "suspended") {
        await supabase
          .from("usage_tracking")
          .update({
            limit_count: 0,
            updated_at: now.toISOString(),
          })
          .eq("user_id", userId)
          .eq("feature_type", "risk_analysis")
      }

      // Security log: Successful renewal
      await logSecurityEvent(supabase, {
        userId,
        eventType: "payment_success",
        ipAddress: request.headers.get("x-forwarded-for") || "paytr-callback",
        userAgent: "PayTR 3D Secure Callback",
        riskScore: 0,
        riskFactors: [],
        metadata: {
          merchant_oid: merchantOid,
          subscription_id: subscription.id,
          amount: totalAmount,
          renewal_type: "3d_secure_callback",
          new_expiry: newExpiry.toISOString(),
        },
      })

      // Send success email
      if (profile?.email) {
        await sendRenewalSuccessNotification({
          userName: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email,
          userEmail: profile.email,
          planName: subscription.plan_id,
          amount: parseFloat(totalAmount),
          currency: currency || "TRY",
          newExpiryDate: newExpiry.toISOString(),
        })
      }

      console.log(`[renewal-callback] Successfully renewed subscription for user ${userId}`)
    }
    // Handle payment FAILURE
    else if (status === "failed") {
      console.log(`[renewal-callback] Payment failed for user ${userId}: ${failedReasonMsg}`)

      const now = new Date()

      // Mark pending payment as failed
      await supabase
        .from("pending_renewal_payments")
        .update({
          status: "failed",
          completed_at: now.toISOString(),
          error_message: failedReasonMsg || `Failed with code: ${failedReasonCode}`,
          paytr_response: {
            status,
            failed_reason_code: failedReasonCode,
            failed_reason_msg: failedReasonMsg,
            total_amount: totalAmount,
            test_mode: testMode,
          },
        })
        .eq("id", pendingPayment.id)

      // Record failed payment
      await supabase.from("paytr_recurring_payments").insert({
        user_id: userId,
        subscription_id: subscription.id,
        merchant_oid: merchantOid,
        utoken: pendingPayment.utoken,
        ctoken: pendingPayment.ctoken,
        amount: parseFloat(totalAmount),
        currency: currency || "TRY",
        payment_status: "failed",
        is_3d_secure: true,
        payment_url: pendingPayment.payment_url,
        error_message: failedReasonMsg,
        response_data: {
          status,
          failed_reason_code: failedReasonCode,
          failed_reason_msg: failedReasonMsg,
          test_mode: testMode,
        },
      })

      // Security log: Failed payment
      await logSecurityEvent(supabase, {
        userId,
        eventType: "payment_failed",
        ipAddress: request.headers.get("x-forwarded-for") || "paytr-callback",
        userAgent: "PayTR 3D Secure Callback",
        riskScore: 0,
        riskFactors: [],
        metadata: {
          merchant_oid: merchantOid,
          subscription_id: subscription.id,
          amount: totalAmount,
          renewal_type: "3d_secure_callback",
          error_code: failedReasonCode,
          error_message: failedReasonMsg,
        },
      })

      // Send failure email with option to retry
      if (profile?.email) {
        // User can request new payment link from settings
        await sendRenewalFailedNotification({
          userName: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email,
          userEmail: profile.email,
          planName: subscription.plan_id,
          amount: parseFloat(totalAmount),
          currency: currency || "TRY",
          failureReason: failedReasonMsg || "Ödeme başarısız oldu",
          retryUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/uygulama/ayarlar`,
        })
      }

      console.log(`[renewal-callback] Recorded failed payment for user ${userId}`)
    }

    // Return OK to PayTR
    return new Response("OK", { status: 200 })
  } catch (error: any) {
    console.error("[renewal-callback] Error processing callback:", error)
    // Still return OK to prevent PayTR retries
    return new Response("OK", { status: 200 })
  }
}
