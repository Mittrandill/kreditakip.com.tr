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
  // Security headers for PayTR and Paddle integration
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.paddle.com https://sandbox-cdn.paddle.com https://*.paddle.com https://public.profitwell.com https://va.vercel-scripts.com https://www.paytr.com https://*.paytr.com",
              "style-src 'self' 'unsafe-inline' https://cdn.paddle.com https://sandbox-cdn.paddle.com https://www.paytr.com https://*.paytr.com",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.paddle.com https://sandbox-api.paddle.com https://*.paddle.com https://*.supabase.co https://o120955.ingest.sentry.io https://generativelanguage.googleapis.com https://cdn.paddle.com https://sandbox-cdn.paddle.com https://va.vercel-scripts.com https://www.paytr.com https://*.paytr.com",
              "frame-src 'self' https://sandbox-checkout.paddle.com https://checkout.paddle.com https://sandbox-buy.paddle.com https://buy.paddle.com https://sandbox-checkout-service.paddle.com https://*.paddle.com https://www.paytr.com https://*.paytr.com",
              "form-action 'self' https://www.paytr.com https://*.paytr.com",
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
