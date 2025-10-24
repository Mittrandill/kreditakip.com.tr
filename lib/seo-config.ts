import type { Metadata } from "next"

export const seoConfig = {
  baseUrl: "https://kreditakip.com.tr",
  siteName: "Kredi Takip",
  defaultTitle: "Kredi Takip - Akıllı Kredi Yönetimi ve Ödeme Planlama",
  defaultDescription:
    "Kredi kartı ekstrenizi saniyeler içinde akıllı ödeme planına dönüştürün. OCR teknolojisi, yapay zeka destekli risk analizi ve detaylı finansal raporlama.",
  twitterHandle: "@kreditakipcomtr",
}

export function generatePageMetadata({
  title,
  description,
  path = "",
  images,
  keywords,
}: {
  title?: string
  description?: string
  path?: string
  images?: string[]
  keywords?: string[]
}): Metadata {
  const pageTitle = title ? `${title} | ${seoConfig.siteName}` : seoConfig.defaultTitle
  const pageDescription = description || seoConfig.defaultDescription
  const pageUrl = `${seoConfig.baseUrl}${path}`
  const pageImages = images || ["/logo.png"]

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: keywords || [],
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: pageUrl,
      siteName: seoConfig.siteName,
      images: pageImages,
      locale: "tr_TR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      images: pageImages,
      creator: seoConfig.twitterHandle,
    },
    alternates: {
      canonical: pageUrl,
    },
  }
}
