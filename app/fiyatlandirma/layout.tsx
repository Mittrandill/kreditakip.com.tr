import { generatePageMetadata } from "@/lib/seo-config"

export const metadata = generatePageMetadata({
  title: "Fiyatlandırma - Premium Planlar",
  description:
    "Kredi Takip premium planları ve fiyatları. Aylık 199₺ veya yıllık 1,990₺ ile sınırsız OCR analizi, risk değerlendirmesi ve gelişmiş finansal raporlama özelliklerine erişin. İlk 1 analiz ücretsiz!",
  path: "/fiyatlandirma",
  keywords: [
    "kredi takip fiyat",
    "premium plan",
    "ödeme planı fiyatlandırma",
    "ücretsiz kredi takip",
    "kredi yönetimi ücretleri",
    "OCR analiz fiyatı",
  ],
  images: ["/financial-dashboard.png"],
})

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
