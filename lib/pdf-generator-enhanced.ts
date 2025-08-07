import jsPDF from "jspdf"
import "jspdf-autotable"

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

// Enhanced color palettes
const COLOR_SCHEMES = {
  professional: {
    primary: "#059669", // emerald-600
    secondary: "#0d9488", // teal-600
    accent: "#3b82f6", // blue-600
    success: "#10b981", // emerald-500
    warning: "#f59e0b", // amber-500
    error: "#ef4444", // red-500
    background: "#f8fafc", // slate-50
    surface: "#ffffff",
    text: {
      primary: "#1f2937", // gray-800
      secondary: "#6b7280", // gray-500
      muted: "#9ca3af", // gray-400
    },
  },
  modern: {
    primary: "#8b5cf6", // violet-500
    secondary: "#ec4899", // pink-500
    accent: "#f59e0b", // amber-500
    success: "#10b981",
    warning: "#f97316", // orange-500
    error: "#ef4444",
    background: "#fafafa",
    surface: "#ffffff",
    text: {
      primary: "#18181b", // zinc-900
      secondary: "#71717a", // zinc-500
      muted: "#a1a1aa", // zinc-400
    },
  },
  minimal: {
    primary: "#6b7280", // gray-500
    secondary: "#374151", // gray-700
    accent: "#1f2937", // gray-800
    success: "#059669",
    warning: "#d97706", // amber-600
    error: "#dc2626", // red-600
    background: "#f9fafb", // gray-50
    surface: "#ffffff",
    text: {
      primary: "#111827", // gray-900
      secondary: "#4b5563", // gray-600
      muted: "#9ca3af", // gray-400
    },
  },
}

// Enhanced typography system
const TYPOGRAPHY = {
  title: { size: 28, weight: "bold", lineHeight: 1.2 },
  heading: { size: 24, weight: "bold", lineHeight: 1.3 },
  subheading: { size: 18, weight: "bold", lineHeight: 1.4 },
  body: { size: 12, weight: "normal", lineHeight: 1.5 },
  caption: { size: 10, weight: "normal", lineHeight: 1.4 },
  small: { size: 8, weight: "normal", lineHeight: 1.3 },
  large: { size: 14, weight: "normal", lineHeight: 1.5 },
}

// Enhanced spacing system
const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
}

// Enhanced layout constants
const LAYOUT = {
  margin: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },
  header: {
    height: 80,
    padding: 16,
  },
  footer: {
    height: 40,
    padding: 12,
  },
  section: {
    padding: 16,
    margin: 12,
  },
}

// Turkish character mapping for PDF compatibility
const removeTurkishChars = (text: string): string => {
  const charMap: { [key: string]: string } = {
    ç: "c",
    Ç: "C",
    ğ: "g",
    Ğ: "G",
    ı: "i",
    İ: "I",
    ö: "o",
    Ö: "O",
    ş: "s",
    Ş: "S",
    ü: "u",
    Ü: "U",
    â: "a",
    Â: "A",
    î: "i",
    Î: "I",
    û: "u",
    Û: "U",
  }
  return text.replace(/[çğıöşüÇĞİÖŞÜâîûÂÎÛ]/g, (match) => charMap[match] || match)
}

// Enhanced PDF-safe text constants
const PDF_TEXTS = {
  MAIN_TITLE: "GELISMIS KREDI TAKIP RAPORU",
  SUBTITLE: "AI Destekli Kapsamli Finansal Analiz ve Performans Raporu",
  GENERATED_ON: "Rapor Tarihi:",
  USER_INFO: "Kullanici Bilgileri",
  EXECUTIVE_SUMMARY: "Yonetici Ozeti",
  FINANCIAL_OVERVIEW: "Finansal Genel Bakis",
  CREDIT_ANALYSIS: "Kredi Analizi",
  PAYMENT_HISTORY: "Odeme Gecmisi",
  CREDIT_CARD_ANALYSIS: "Kredi Karti Analizi",
  BANK_DISTRIBUTION: "Banka Dagilimi",
  PERFORMANCE_METRICS: "Performans Metrikleri",
  RISK_ASSESSMENT: "Risk Degerlendirmesi",
  AI_INSIGHTS: "AI Icgoruleri",
  RECOMMENDATIONS: "Oneriler ve Aksiyon Plani",
  FUTURE_PROJECTIONS: "Gelecek Projeksiyonlari",
  DETAILED_TABLES: "Detayli Tablolar",
  CHARTS: "Grafikler ve Gorseller",
  APPENDIX: "Ekler ve Detaylar",
  FOOTER_TEXT: "Bu rapor KrediTakip AI tarafindan otomatik olarak olusturulmustur.",
  PAGE: "Sayfa",
  OF: "/",
  CONFIDENTIAL: "GIZLI - Sadece yetkili personel icin",

  // Enhanced metrics
  TOTAL_DEBT: "Toplam Borc",
  MONTHLY_PAYMENT: "Aylik Odeme",
  ACTIVE_CREDITS: "Aktif Kredi",
  CREDIT_CARDS: "Kredi Karti",
  PAYMENT_PERFORMANCE: "Odeme Performansi",
  UTILIZATION_RATE: "Kullanim Orani",
  RISK_SCORE: "Risk Skoru",
  AI_SCORE: "AI Puani",

  // Status indicators
  EXCELLENT: "Mukemmel",
  GOOD: "Iyi",
  AVERAGE: "Orta",
  POOR: "Zayif",
  CRITICAL: "Kritik",

  // AI recommendations
  OPTIMIZE_PAYMENTS: "Odeme planini optimize edin",
  REDUCE_UTILIZATION: "Kart kullanim oranini azaltin",
  CONSOLIDATE_DEBT: "Borc konsolidasyonu dusunun",
  EMERGENCY_FUND: "Acil durum fonu olusturun",
  REFINANCE_CREDITS: "Kredi yeniden finansmani degerlendirin",
  IMPROVE_CREDIT_SCORE: "Kredi puaninizi artirin",
}

// Utility functions
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [Number.parseInt(result[1], 16), Number.parseInt(result[2], 16), Number.parseInt(result[3], 16)]
    : [107, 114, 128]
}

const formatCurrency = (amount: number): string => {
  return (
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace("₺", "") + " TL"
  )
}

interface UserData {
  name: string
  email: string
  credits: Array<{
    bankName?: string
    creditType?: string
    remainingDebt: number
    monthlyPayment: number
    interestRate: number
    status: string
  }>
  payments: Array<{
    date: string
    bankName?: string
    amount: number
    status: string
  }>
  creditCards: Array<{
    bankName?: string
    creditLimit: number
    currentDebt: number
    utilizationRate: number
  }>
  summary: {
    totalDebt: number
    monthlyPayment: number
    activeCredits: number
    activeCreditCards: number
    averageUtilization: number
    paymentPerformance: number
    riskScore: number
  }
}

interface PDFData {
  title: string
  subtitle?: string
  data: any[]
  charts?: any[]
  summary?: any
  insights?: string[]
}

// Main enhanced PDF generation function
export async function generateEnhancedPDFReport(data: PDFData): Promise<void> {
  const doc = new jsPDF()

  // Set font for Turkish characters
  doc.setFont("helvetica")

  let yPosition = 20

  // Header
  doc.setFontSize(20)
  doc.setTextColor(40, 40, 40)
  doc.text(data.title, 20, yPosition)
  yPosition += 15

  if (data.subtitle) {
    doc.setFontSize(12)
    doc.setTextColor(100, 100, 100)
    doc.text(data.subtitle, 20, yPosition)
    yPosition += 20
  }

  // Summary section
  if (data.summary) {
    doc.setFontSize(14)
    doc.setTextColor(40, 40, 40)
    doc.text("Özet", 20, yPosition)
    yPosition += 10

    doc.setFontSize(10)
    Object.entries(data.summary).forEach(([key, value]) => {
      doc.text(`${key}: ${value}`, 20, yPosition)
      yPosition += 6
    })
    yPosition += 10
  }

  // Data table
  if (data.data && data.data.length > 0) {
    const tableColumns = Object.keys(data.data[0])
    const tableRows = data.data.map((item) => Object.values(item))
    ;(doc as any).autoTable({
      head: [tableColumns],
      body: tableRows,
      startY: yPosition,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    })

    yPosition = (doc as any).lastAutoTable.finalY + 20
  }

  // Insights section
  if (data.insights && data.insights.length > 0) {
    doc.setFontSize(14)
    doc.setTextColor(40, 40, 40)
    doc.text("Önemli Bulgular", 20, yPosition)
    yPosition += 10

    doc.setFontSize(10)
    data.insights.forEach((insight, index) => {
      doc.text(`${index + 1}. ${insight}`, 20, yPosition)
      yPosition += 6
    })
  }

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Sayfa ${i} / ${pageCount} - ${new Date().toLocaleDateString("tr-TR")}`,
      20,
      doc.internal.pageSize.height - 10,
    )
  }

  // Save the PDF
  doc.save(`${data.title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`)
}
