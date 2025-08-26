import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json()

    // In production, send to monitoring service (Sentry, LogRocket, etc.)
    if (process.env.NODE_ENV === "production") {
      // Example: Send to external monitoring service
      // await sendToSentry(errorData)
      // await sendToLogRocket(errorData)
    }

    // Log to server console for now
    console.error("Client Error Report:", {
      id: errorData.id,
      type: errorData.type,
      severity: errorData.severity,
      message: errorData.message,
      userId: errorData.userId,
      url: errorData.url,
      timestamp: errorData.timestamp,
      context: errorData.context,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error logging failed:", error)
    return NextResponse.json({ error: "Failed to log error" }, { status: 500 })
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
  })
}
