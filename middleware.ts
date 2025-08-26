import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

const RATE_LIMIT_MAP = new Map()

function rateLimit(ip: string, limit = 100, windowMs = 60000): boolean {
  const now = Date.now()
  const windowStart = now - windowMs

  if (!RATE_LIMIT_MAP.has(ip)) {
    RATE_LIMIT_MAP.set(ip, [])
  }

  const requests = RATE_LIMIT_MAP.get(ip).filter((time: number) => time > windowStart)

  if (requests.length >= limit) {
    return false
  }

  requests.push(now)
  RATE_LIMIT_MAP.set(ip, requests)
  return true
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const ip = request.ip ?? request.headers.get("x-forwarded-for") ?? "unknown"

  if (request.nextUrl.pathname.startsWith("/api/")) {
    if (!rateLimit(ip, 100, 60000)) {
      return new NextResponse("Too Many Requests", { status: 429 })
    }
  }

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": process.env.NODE_ENV === "production" ? "https://kreditakip.com.tr" : "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    })
  }

  // OAuth callback için özel handling
  if (request.nextUrl.pathname === "/auth/callback") {
    const code = request.nextUrl.searchParams.get("code")
    const error = request.nextUrl.searchParams.get("error")

    if (error) {
      console.error("OAuth error in middleware:", error)
      return NextResponse.redirect(new URL("/giris", request.url))
    }

    if (code) {
      // Code varsa callback sayfasına devam et
      return NextResponse.next()
    }

    // Code yoksa giriş sayfasına yönlendir
    return NextResponse.redirect(new URL("/giris", request.url))
  }

  if (request.nextUrl.pathname.startsWith("/uygulama")) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value
            },
            set() {},
            remove() {},
          },
        },
      )

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        return NextResponse.redirect(new URL("/giris", request.url))
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      return NextResponse.redirect(new URL("/giris", request.url))
    }
  }

  return response
}

export const config = {
  matcher: ["/api/:path*", "/auth/callback", "/uygulama/:path*", "/((?!_next/static|_next/image|favicon.ico).*)"],
}
