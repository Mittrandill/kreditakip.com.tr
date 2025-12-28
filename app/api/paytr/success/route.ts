import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * GET /api/paytr/success
 *
 * Success redirect after PayTR payment
 * Redirects user to success page
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const orderId = searchParams.get("order_id")
  const type = searchParams.get("type") // "checkout" or "renewal"

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  // Redirect to success page with parameters
  const redirectUrl = new URL("/uygulama/odeme/basarili", appUrl)

  if (orderId) {
    redirectUrl.searchParams.set("order_id", orderId)
  }

  if (type === "renewal") {
    redirectUrl.searchParams.set("type", "renewal")
  }

  return NextResponse.redirect(redirectUrl.toString())
}
