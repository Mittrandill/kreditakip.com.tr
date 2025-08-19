import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // OAuth callback için özel handling
  if (request.nextUrl.pathname === '/auth/callback') {
    const code = request.nextUrl.searchParams.get('code')
    const error = request.nextUrl.searchParams.get('error')
    
    console.log('Middleware auth callback:', { code: !!code, error })
    
    if (error) {
      console.error('OAuth error in middleware:', error)
      return NextResponse.redirect(new URL('/giris', request.url))
    }
    
    if (code) {
      // Code varsa callback sayfasına devam et
      return NextResponse.next()
    }
    
    // Code yoksa giriş sayfasına yönlendir
    return NextResponse.redirect(new URL('/giris', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/auth/callback',
  ],
}
