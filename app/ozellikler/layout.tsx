import { generatePageMetadata } from "@/lib/seo-config"

export const metadata = generatePageMetadata({
  title: "Özellikler - Akıllı Finansal Yönetim Araçları",
  description:
    "Kredi Takip'in güçlü özellikleri: OCR ile otomatik ekstre okuma, yapay zeka destekli ödeme planlaması, çoklu banka desteği, risk analizi, detaylı raporlama ve güvenli veri şifreleme. Tüm özellikler için inceleyin.",
  path: "/ozellikler",
  keywords: [
    "OCR ekstre okuma",
    "yapay zeka ödeme planı",
    "çoklu banka desteği",
    "kredi risk analizi",
    "finansal raporlama",
    "güvenli kredi takip",
    "ödeme hatırlatıcı",
    "kredi kartı yönetimi özellikleri",
  ],
  images: ["/financial-dashboard.png"],
})

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return children
}
