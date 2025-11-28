import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const checkoutId = searchParams.get("checkout_id")
    const paddleCustomerId = searchParams.get("paddle_customer_id")
    const subscriptionId = searchParams.get("subscription_id")

    if (!checkoutId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/uygulama/premium?error=missing_checkout_id`
      )
    }

    // Redirect to success page with parameters
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
      `${request.nextUrl.protocol}//${request.nextUrl.host}`

    const redirectUrl = new URL("/uygulama/abonelik", baseUrl)
    redirectUrl.searchParams.set("success", "true")
    if (subscriptionId) redirectUrl.searchParams.set("subscription_id", subscriptionId)
    if (paddleCustomerId) redirectUrl.searchParams.set("paddle_customer_id", paddleCustomerId)

    return NextResponse.redirect(redirectUrl.toString())
  } catch (error: any) {
    console.error("[Paddle Success] Error:", error)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
      `${request.nextUrl.protocol}//${request.nextUrl.host}`

    return NextResponse.redirect(
      `${baseUrl}/uygulama/premium?error=internal_error`
    )
  }
}