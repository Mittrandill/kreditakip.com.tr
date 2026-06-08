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
    // Allow external image domains
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
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
          }
        ]
      }
    ]
  }
}

export default nextConfig
