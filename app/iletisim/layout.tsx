import { generatePageMetadata } from "@/lib/seo-config"

export const metadata = generatePageMetadata({
  title: "İletişim - Destek ve İş Birliği",
  description:
    "Kredi Takip ile iletişime geçin. Sorularınız, önerileriniz veya iş birliği teklifleriniz için bize ulaşın. 7/24 müşteri desteği ve hızlı geri dönüş garantisi.",
  path: "/iletisim",
  keywords: ["kredi takip iletişim", "müşteri desteği", "destek talebi", "iş birliği", "yardım"],
})

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
