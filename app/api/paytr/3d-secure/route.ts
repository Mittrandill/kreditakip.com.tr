import { type NextRequest, NextResponse } from "next/server"
import { kvStorage } from "@/lib/kv"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * GET /api/paytr/3d-secure?token=xxx
 *
 * Serves the 3D Secure HTML page
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")

    if (!token) {
      return new NextResponse("Missing token", { status: 400 })
    }

    // Get HTML from KV storage
    const html = await kvStorage.get(token)

    if (!html) {
      return new NextResponse("Invalid or expired token", { status: 404 })
    }

    // Delete after serving (one-time use)
    await kvStorage.delete(token)

    // Return HTML with proper headers
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Frame-Options": "SAMEORIGIN", // Allow iframe from same origin
      },
    })
  } catch (error: any) {
    console.error("[PayTR 3D Secure] Error:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}

/**
 * POST /api/paytr/3d-secure
 *
 * Stores the 3D Secure HTML and returns a token
 */
export async function POST(request: NextRequest) {
  try {
    const { html } = await request.json()

    if (!html) {
      return NextResponse.json(
        { error: "Missing html" },
        { status: 400 }
      )
    }

    // Generate unique token
    const token = `3ds_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Store HTML in KV storage with 5 minute expiration
    await kvStorage.set(token, html, 5 * 60) // 300 seconds = 5 minutes

    return NextResponse.json({
      success: true,
      token,
      url: `/api/paytr/3d-secure?token=${token}`,
    })
  } catch (error: any) {
    console.error("[PayTR 3D Secure] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
