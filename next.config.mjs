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
  }
}

export default nextConfig
