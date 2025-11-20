import type React from "react"
import type { Metadata, Viewport } from "next"
import { Poppins } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { CookieConsent } from "@/components/cookie-consent"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://kreditakip.com.tr"),
  title: {
    default: "Kredi Takip - Akıllı Kredi Yönetimi ve Ödeme Planlama",
    template: "%s | Kredi Takip",
  },
  description:
    "Kredi ödeme planınızı saniyeler içinde akıllı ödeme planına dönüştürün. OCR teknolojisi, yapay zeka destekli AI Finansal Sağlık Özeti ve detaylı finansal raporlama ile kredi yönetiminin geleceğini keşfedin.",
  keywords: [
    "kredi takip",
    "kredi borç yönetimi",
    "ödeme planı",
    "OCR teknoloji",
    "kredi ödeme planı",
    "borç yönetimi",
    "finansal planlama",
    "kredi analizi",
    "yapay zeka finans",
    "akıllı ödeme",
    "taksit hesaplama",
    "kredi limiti takibi",
  ],
  authors: [{ name: "Kredi Takip" }],
  creator: "Kredi Takip",
  publisher: "Kredi Takip",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://kreditakip.com.tr",
    siteName: "Kredi Takip",
    title: "Kredi Takip - Akıllı Kredi Yönetimi ve Ödeme Planlama",
    description:
      "Kredi ödeme planınızı saniyeler içinde akıllı ödeme planına dönüştürün. OCR teknolojisi ve yapay zeka destekli finansal yönetim platformu.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Kredi Takip - Akıllı Kredi Yönetimi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kredi Takip - Akıllı Kredi Yönetimi",
    description:
      "Kredi ödeme planınızı saniyeler içinde akıllı ödeme planına dönüştürün. OCR teknolojisi ve yapay zeka destekli finansal yönetim.",
    images: ["/logo.png"],
    creator: "@kreditakipcomtr",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://kreditakip.com.tr",
  },
  category: "Finance",
  verification: {
    google: "google-site-verification-code",
    yandex: "yandex-verification-code",
  },
    generator: 'v0.app'
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#10b981' },
    { media: '(prefers-color-scheme: dark)', color: '#059669' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={cn("font-sans antialiased", poppins.variable)}>
        {children}
        <CookieConsent />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
