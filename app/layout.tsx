import type React from "react"
import type { Metadata, Viewport } from "next"
import { Poppins } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"
import { initPerformanceMonitoring } from "@/lib/performance"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
})

export const metadata: Metadata = {
  title: "Kredi Takip - Kredi yönetiminin geleceği.",
  description: "Transform your credit statements into smart digital payment plans in seconds with OCR technology.",
  keywords: "kredi takip, kredi yönetimi, finansal planlama, borç takibi, kredi kartı yönetimi",
  authors: [{ name: "Kredi Takip Team" }],
  creator: "Kredi Takip",
  publisher: "Kredi Takip",
  robots: "index, follow",
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://kreditakip.com.tr",
    title: "Kredi Takip - Kredi yönetiminin geleceği",
    description: "Transform your credit statements into smart digital payment plans in seconds with OCR technology.",
    siteName: "Kredi Takip",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kredi Takip - Kredi yönetiminin geleceği",
    description: "Transform your credit statements into smart digital payment plans in seconds with OCR technology.",
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#10b981" />
      </head>
      <body className={cn("font-sans antialiased min-h-screen", poppins.variable)}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                try {
                  (${initPerformanceMonitoring.toString()})();
                } catch (e) {
                  // Performance monitoring failed to initialize
                }
              }
            `,
          }}
        />
        <div id="root">{children}</div>
      </body>
    </html>
  )
}
