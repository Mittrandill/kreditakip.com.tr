/** @type {import('next').NextConfig} */
const nextConfig = {
  // PRODUCTION READY: Enable type checking and linting during builds
  // Remove these overrides and fix all TypeScript/ESLint errors
  eslint: {
    // Set to false to enable linting during builds
    // TODO: Fix all ESLint errors and set this to false
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Set to false to enable type checking during builds
    // TODO: Fix all TypeScript errors and set this to false
    ignoreBuildErrors: false,
  },
  images: {
    // Enable Next.js image optimization for better performance
    unoptimized: false,
    // Blog görsellerinin geldiği adresler. Her adrese izin vermek sitenin görsel
    // kotasını başkalarının kullanmasına açıyordu; yeni kaynak buraya eklenir.
    remotePatterns: [
      { protocol: 'https', hostname: 'oymjjceuiotxfbpwsdym.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.ibb.co' },
      { protocol: 'https', hostname: 'i.hizliresim.com' },
    ],
    // Optimize edilen görsel 31 gün önbellekte kalır (varsayılan 60 sn).
    minimumCacheTTL: 2678400,
    // Configure image formats
    formats: ['image/avif', 'image/webp'],
  },
  // Performance optimizations
  swcMinify: true,
  // Compress responses
  compress: true,
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  // Fix Jest worker crash
  experimental: {
    workerThreads: false,
    cpus: 1
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://o120955.ingest.sentry.io https://generativelanguage.googleapis.com https://va.vercel-scripts.com",
              "frame-src 'self'",
              "form-action 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }
        ]
      }
    ]
  }
}

export default nextConfig
