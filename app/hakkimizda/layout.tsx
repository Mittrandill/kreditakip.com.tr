import { generatePageMetadata } from "@/lib/seo-config"

export const metadata = generatePageMetadata({
  title: "Hakkımızda - Kredi Yönetiminde Yenilikçi Çözümler",
  description:
    "Kredi Takip, yapay zeka ve OCR teknolojisi ile kredi yönetimini kolaylaştıran yenilikçi bir finansal yönetim platformudur. Misyonumuz, her bireyin finansal özgürlüğüne ulaşmasına yardımcı olmak.",
  path: "/hakkimizda",
  keywords: [
    "kredi takip hakkında",
    "finansal teknoloji",
    "fintech türkiye",
    "OCR teknoloji",
    "yapay zeka finans",
    "kredi yönetimi şirketi",
  ],
})

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
