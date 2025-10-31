import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current session info
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Create a session object from current session
    const sessionsData = session ? [session] : []
    const sessionsError = null

    if (sessionsError) {
      console.error("Error fetching sessions:", sessionsError)
      // Return current session only as fallback
      const currentSession = {
        id: "current",
        user_agent: request.headers.get("user-agent") || "Unknown Browser",
        created_at: new Date().toISOString(),
        is_current: true,
      }
      return NextResponse.json({ sessions: [currentSession] })
    }

    // Parse user agents and format sessions
    const sessions = (sessionsData || []).map((session: any, index: number) => {
      const userAgent = session.user_agent || "Unknown Browser"
      const device = parseUserAgent(userAgent)

      return {
        id: session.id || `session-${index}`,
        device: device,
        location: "Türkiye", // Location detection can be added later with IP geolocation
        lastActive: formatDate(session.created_at || new Date().toISOString()),
        created_at: session.created_at,
        is_current: index === 0, // First session is usually current
      }
    })

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error("Sessions fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { sessionId } = await request.json()

    if (!sessionId || sessionId === "current") {
      return NextResponse.json({ error: "Cannot revoke current session" }, { status: 400 })
    }

    // Sign out - this will revoke all sessions except current
    // Note: Supabase doesn't support revoking specific sessions in client SDK
    // This is a simplified implementation
    await supabase.auth.signOut({ scope: "others" })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Session revoke error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function parseUserAgent(userAgent: string): string {
  if (userAgent.includes("Chrome") && !userAgent.includes("Edge") && !userAgent.includes("OPR")) {
    if (userAgent.includes("Mobile")) {
      return "Chrome - Mobile"
    }
    return "Chrome - Desktop"
  }
  if (userAgent.includes("Firefox")) {
    return "Firefox - Desktop"
  }
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    if (userAgent.includes("Mobile") || userAgent.includes("iPhone")) {
      return "Safari - iPhone"
    }
    if (userAgent.includes("iPad")) {
      return "Safari - iPad"
    }
    return "Safari - Desktop"
  }
  if (userAgent.includes("Edge")) {
    return "Edge - Desktop"
  }
  if (userAgent.includes("OPR") || userAgent.includes("Opera")) {
    return "Opera - Desktop"
  }
  if (userAgent.includes("Android")) {
    return "Chrome - Android"
  }

  return "Unknown Browser"
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 5) {
    return "Şimdi"
  } else if (diffMins < 60) {
    return `${diffMins} dakika önce`
  } else if (diffHours < 24) {
    return `${diffHours} saat önce`
  } else if (diffDays === 1) {
    return "1 gün önce"
  } else if (diffDays < 7) {
    return `${diffDays} gün önce`
  } else {
    return date.toLocaleDateString("tr-TR")
  }
}
