import { generatePageMetadata } from "@/lib/seo-config"

export const metadata = generatePageMetadata({
  title: "Özellikler - Akıllı Finansal Yönetim Araçları",
  description:
    "Kredi Takip'in güçlü özellikleri: OCR ile otomatik ekstre okuma, yapay zeka destekli ödeme planlaması, çoklu banka desteği, AI Finansal Sağlık Özeti, detaylı raporlama ve güvenli veri şifreleme. Tüm özellikler için inceleyin.",
  path: "/ozellikler",
  keywords: [
    "OCR ekstre okuma",
    "yapay zeka ödeme planı",
    "çoklu banka desteği",
    "AI finansal sağlık özeti",
    "finansal raporlama",
    "güvenli kredi takip",
    "ödeme hatırlatıcı",
    "Kredi ödeme planı yönetimi özellikleri",
  ],
  images: ["/financial-dashboard.png"],
})

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return children
}
