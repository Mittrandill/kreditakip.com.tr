import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  // Refresh session if expired - this is crucial for API routes
  await supabase.auth.getUser()

  // SECURITY FIX: Add security headers
  const headers = response.headers

  // Prevent clickjacking attacks
  headers.set("X-Frame-Options", "DENY")

  // Prevent MIME type sniffing
  headers.set("X-Content-Type-Options", "nosniff")

  // Enable XSS protection in older browsers
  headers.set("X-XSS-Protection", "1; mode=block")

  // Control referrer information
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  // Content Security Policy - Paddle ve Vercel için gerekli domain'ler
  headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.paddle.com https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://cdn.paddle.com",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://api.paddle.com https://sandbox-api.paddle.com https://o120955.ingest.sentry.io https://generativelanguage.googleapis.com https://cdn.paddle.com https://va.vercel-scripts.com",
      "frame-src 'self' https://checkout.paddle.com https://sandbox-checkout.paddle.com https://sandbox-checkout-service.paddle.com",
      "frame-ancestors 'none'",
    ].join('; ') + ';',
  )

  // Permissions Policy (formerly Feature Policy)
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  // HSTS - Force HTTPS (only in production)
  if (process.env.NODE_ENV === "production") {
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
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
      return response
    }

    return NextResponse.redirect(new URL("/giris", request.url))
  }

  return response
}

export const config = {
  matcher: [
    "/auth/callback",
    "/api/((?!cron).*)", // Exclude /api/cron/* routes from middleware
    "/uygulama/:path*"
  ],
}
