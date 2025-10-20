import type React from "react"
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"

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
    "Kredi kartı ekstrenizi saniyeler içinde akıllı ödeme planına dönüştürün. OCR teknolojisi, yapay zeka destekli risk analizi ve detaylı finansal raporlama ile kredi yönetiminin geleceğini keşfedin.",
  keywords: [
    "kredi takip",
    "kredi kartı yönetimi",
    "ödeme planı",
    "OCR teknoloji",
    "kredi kartı ekstresi",
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
      "Kredi kartı ekstrenizi saniyeler içinde akıllı ödeme planına dönüştürün. OCR teknolojisi ve yapay zeka destekli finansal yönetim platformu.",
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
      "Kredi kartı ekstrenizi saniyeler içinde akıllı ödeme planına dönüştürün. OCR teknolojisi ve yapay zeka destekli finansal yönetim.",
    images: ["/logo.png"],
    creator: "@kreditakip",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/logo.png",
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
      </body>
    </html>
  )
}
