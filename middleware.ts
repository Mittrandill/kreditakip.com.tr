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
  matcher: ["/auth/callback", "/api/:path*", "/uygulama/:path*"],
}
