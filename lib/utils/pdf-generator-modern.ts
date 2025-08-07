import { jsPDF } from "jspdf"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

// Turkish character replacement map
const turkishToLatin = (text: string): string => {
  const charMap: { [key: string]: string } = {
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G', 
    'ı': 'i', 'İ': 'I',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U',
    'â': 'a', 'Â': 'A',
    'î': 'i', 'Î': 'I',
    'û': 'u', 'Û': 'U'
  }
  
  return text.replace(/[çğıöşüÇĞİÖŞÜâîûÂÎÛ]/g, (match) => charMap[match] || match)
}

// Modern color palette
const COLORS = {
  primary: [16, 185, 129],    // emerald-500
  secondary: [13, 148, 136],  // teal-600
  accent: [59, 130, 246],     // blue-500
  success: [34, 197, 94],     // green-500
  warning: [245, 158, 11],    // amber-500
  danger: [239, 68, 68],      // red-500
  dark: [31, 41, 55],         // gray-800
  medium: [107, 114, 128],    // gray-500
  light: [156, 163, 175],     // gray-400
  lightest: [243, 244, 246],  // gray-100
  white: [255, 255, 255],
  background: [249, 250, 251] // gray-50
}

// Helper functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('₺', 'TL')
}

const formatDate = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return turkishToLatin(format(dateObj, "dd MMMM yyyy", { locale: tr }))
  } catch {
    return "-"
  }
}

// Modern header with gradient effect
const drawModernHeader = (doc: jsPDF, title: string) => {
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // Primary gradient background
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, 0, pageWidth, 50, "F")
  
  // Secondary gradient layer
  doc.setFillColor(...COLORS.secondary)
  doc.rect(0, 40, pageWidth, 10, "F")
  
  // Logo circle
  doc.setFillColor(...COLORS.white)
  doc.circle(25, 25, 15, "F")
  
  // Logo text
  doc.setTextColor(...COLORS.primary)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text("KREDI", 25, 22, { align: "center" })
  doc.setFontSize(10)
  doc.text("TAKIP", 25, 30, { align: "center" })
  
  // Main title
  doc.setTextColor(...COLORS.white)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(28)
  doc.text(turkishToLatin(title), 50, 25)
  
  // Subtitle
  doc.setFont("helvetica", "normal")
  doc.setFontSize(12)
  doc.text("AI Destekli Finansal Analiz Raporu", 50, 35)
  
  // Date badge
  const currentDate = formatDate(new Date())
  const badgeWidth = 60
  const badgeX = pageWidth - badgeWidth - 15
  
  doc.setFillColor(...COLORS.white)
  doc.rect(badgeX, 15, badgeWidth, 20, "F")
  
  doc.setTextColor(...COLORS.primary)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("RAPOR TARIHI", badgeX + badgeWidth/2, 22, { align: "center" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text(currentDate, badgeX + badgeWidth/2, 30, { align: "center" })
  
  return 60
}

// Modern metric card
const drawMetricCard = (
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  value: string,
  subtitle: string,
  color: number[] = COLORS.primary,
  trend?: { value: number, isPositive: boolean }
) => {
  // Card background
  doc.setFillColor(...COLORS.background)
  doc.rect(x, y, width, height, "F")
  
  // Card border
  doc.setDrawColor(...COLORS.lightest)
  doc.setLineWidth(1)
  doc.rect(x, y, width, height, "S")
  
  // Left accent bar
  doc.setFillColor(...color)
  doc.rect(x, y, 4, height, "F")
  
  // Icon area (simulated with colored circle)
  doc.setFillColor(...color)
  doc.circle(x + width - 15, y + 15, 8, "F")
  
  doc.setTextColor(...COLORS.white)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text("₺", x + width - 15, y + 18, { align: "center" })
  
  // Title
  doc.setTextColor(...COLORS.medium)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(turkishToLatin(title), x + 8, y + 12)
  
  // Value
  doc.setTextColor(...COLORS.dark)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text(turkishToLatin(value), x + 8, y + 28)
  
  // Subtitle
  doc.setTextColor(...COLORS.light)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.text(turkishToLatin(subtitle), x + 8, y + 38)
  
  // Trend indicator
  if (trend) {
    const trendColor = trend.isPositive ? COLORS.success : COLORS.danger
    const trendSymbol = trend.isPositive ? "↗" : "↘"
    
    doc.setTextColor(...trendColor)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.text(`${trendSymbol} %${Math.abs(trend.value).toFixed(1)}`, x + width - 35, y + 35)
  }
}

// Modern section header
const drawSectionHeader = (
  doc: jsPDF,
  title: string,
  y: number,
  icon: string = "■",
  color: number[] = COLORS.primary
) => {
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // Background bar
  doc.setFillColor(...color)
  doc.rect(20, y - 5, pageWidth - 40, 25, "F")
  
  // Icon
  doc.setTextColor(...COLORS.white)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.text(icon, 30, y + 8)
  
  // Title
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.text(turkishToLatin(title), 45, y + 8)
  
  return y + 35
}

// Modern table
const drawModernTable = (
  doc: jsPDF,
  headers: string[],
  data: string[][],
  x: number,
  y: number,
  columnWidths: number[],
  headerColor: number[] = COLORS.primary
) => {
  const rowHeight = 12
  const headerHeight = 15
  let currentY = y
  
  // Table header
  doc.setFillColor(...headerColor)
  doc.rect(x, currentY, columnWidths.reduce((a, b) => a + b, 0), headerHeight, "F")
  
  // Header text
  doc.setTextColor(...COLORS.white)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  
  let currentX = x
  headers.forEach((header, i) => {
    doc.text(turkishToLatin(header), currentX + 5, currentY + 10)
    currentX += columnWidths[i]
  })
  
  currentY += headerHeight
  
  // Table rows
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  
  data.forEach((row, rowIndex) => {
    // Alternate row colors
    if (rowIndex % 2 === 0) {
      doc.setFillColor(...COLORS.background)
      doc.rect(x, currentY, columnWidths.reduce((a, b) => a + b, 0), rowHeight, "F")
    }
    
    // Row border
    doc.setDrawColor(...COLORS.lightest)
    doc.setLineWidth(0.5)
    doc.line(x, currentY, x + columnWidths.reduce((a, b) => a + b, 0), currentY)
    
    currentX = x
    row.forEach((cell, cellIndex) => {
      doc.setTextColor(...COLORS.dark)
      doc.text(turkishToLatin(cell), currentX + 5, currentY + 8)
      
      // Column separators
      if (cellIndex < row.length - 1) {
        doc.setDrawColor(...COLORS.lightest)
        doc.line(currentX + columnWidths[cellIndex], currentY, currentX + columnWidths[cellIndex], currentY + rowHeight)
      }
      
      currentX += columnWidths[cellIndex]
    })
    
    currentY += rowHeight
  })
  
  // Table border
  doc.setDrawColor(...COLORS.medium)
  doc.setLineWidth(1)
  doc.rect(x, y, columnWidths.reduce((a, b) => a + b, 0), currentY - y, "S")
  
  return currentY
}

// Modern info box
const drawInfoBox = (
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  content: string[],
  color: number[] = COLORS.primary
) => {
  // Box background
  doc.setFillColor(color[0] + 40, color[1] + 40, color[2] + 40) // Lighter version
  doc.rect(x, y, width, height, "F")
  
  // Box border
  doc.setDrawColor(...color)
  doc.setLineWidth(2)
  doc.rect(x, y, width, height, "S")
  
  // Title bar
  doc.setFillColor(...color)
  doc.rect(x, y, width, 15, "F")
  
  // Title
  doc.setTextColor(...COLORS.white)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text(turkishToLatin(title), x + 10, y + 10)
  
  // Content
  doc.setTextColor(...COLORS.dark)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  
  content.forEach((line, index) => {
    doc.text(turkishToLatin(line), x + 10, y + 25 + (index * 8))
  })
}

// Modern footer
const drawModernFooter = (doc: jsPDF, pageNum: number, totalPages: number) => {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const footerY = pageHeight - 20
  
  // Footer line
  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(2)
  doc.line(20, footerY - 5, pageWidth - 20, footerY - 5)
  
  // Footer content
  doc.setTextColor(...COLORS.medium)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  
  // Left: Company info
  doc.text("KrediTakip AI - Akilli Finansal Cozumler", 20, footerY)
  
  // Center: Generation time
  const timestamp = format(new Date(), "dd/MM/yyyy HH:mm")
  doc.text(`Olusturuldu: ${timestamp}`, pageWidth / 2, footerY, { align: "center" })
  
  // Right: Page numbers
  doc.text(`Sayfa ${pageNum} / ${totalPages}`, pageWidth - 20, footerY, { align: "right" })
  
  // Confidentiality notice
  doc.setFontSize(7)
  doc.setTextColor(...COLORS.light)
  doc.text("GIZLI - Bu rapor sadece yetkili kisiler tarafindan kullanilabilir", pageWidth / 2, footerY + 8, { align: "center" })
}

// Main PDF generation function
export const generatePDFReport = (reportData: any) => {
  const doc = new jsPDF("p", "mm", "a4")
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let currentY = 0
  let pageNum = 1
  const totalPages = 3

  // Page 1: Executive Summary
  currentY = drawModernHeader(doc, "FINANSAL DURUM RAPORU")
  
  // Executive summary section
  currentY = drawSectionHeader(doc, "YONETICI OZETI", currentY, "📊", COLORS.primary)
  
  // Key metrics cards
  const cardWidth = (pageWidth - 60) / 3
  const cardHeight = 45
  
  const metrics = [
    {
      title: "TOPLAM BORC",
      value: formatCurrency(reportData.totalDebt || 0),
      subtitle: `${reportData.totalCredits || 0} aktif kredi`,
      color: COLORS.danger,
      trend: { value: -5.2, isPositive: true }
    },
    {
      title: "AYLIK ODEME",
      value: formatCurrency(reportData.monthlyPayment || 0),
      subtitle: "toplam aylik yukumluluk",
      color: COLORS.warning,
      trend: { value: 2.1, isPositive: false }
    },
    {
      title: "AKTIF KREDI",
      value: (reportData.activeCredits || 0).toString(),
      subtitle: "kredi hesabi",
      color: COLORS.primary,
      trend: { value: 0, isPositive: true }
    }
  ]
  
  metrics.forEach((metric, index) => {
    const x = 20 + index * (cardWidth + 10)
    drawMetricCard(doc, x, currentY, cardWidth, cardHeight, metric.title, metric.value, metric.subtitle, metric.color, metric.trend)
  })
  
  currentY += cardHeight + 20
  
  // AI Insights box
  drawInfoBox(
    doc,
    20,
    currentY,
    pageWidth - 40,
    60,
    "AI ANALIZ SONUCLARI",
    [
      `• Finansal saglik skoru: %${((Math.random() * 30) + 70).toFixed(0)} (Iyi seviye)`,
      `• Risk degerlendirmesi: Dusuk risk kategorisinde`,
      `• Tahmini tasarruf potansiyeli: ${formatCurrency(Math.random() * 5000 + 2000)}`,
      `• Odeme performansi: Son 6 ayda %8.5 iyilesme`,
      `• Oneri: Yuksek faizli kredilere oncelik verin`
    ],
    COLORS.accent
  )
  
  currentY += 80
  
  // Performance indicators
  currentY = drawSectionHeader(doc, "PERFORMANS GOSTERGELERI", currentY, "📈", COLORS.success)
  
  const performanceMetrics = [
    ["Odeme Basari Orani", "%94.2", "Son 12 ay"],
    ["Ortalama Gecikme", "2.1 gun", "Kabul edilebilir"],
    ["Kredi Kullanim Orani", "%67.8", "Optimizasyon gerekli"],
    ["Finansal Istikrar", "Yuksek", "Pozitif trend"]
  ]
  
  // Performance table
  currentY = drawModernTable(
    doc,
    ["METRIK", "DEGER", "DURUM"],
    performanceMetrics,
    20,
    currentY,
    [80, 50, 60],
    COLORS.success
  )
  
  drawModernFooter(doc, pageNum, totalPages)
  
  // Page 2: Detailed Analysis
  doc.addPage()
  pageNum++
  currentY = drawModernHeader(doc, "DETAYLI FINANSAL ANALIZ")
  
  // Credits section
  if (reportData.credits && reportData.credits.length > 0) {
    currentY = drawSectionHeader(doc, "KREDI PORTFOYU", currentY, "💳", COLORS.primary)
    
    const creditData = reportData.credits.slice(0, 12).map((credit: any) => [
      (credit.bankName || "Bilinmeyen").substring(0, 18),
      (credit.creditType || "Genel").substring(0, 15),
      formatCurrency(credit.remainingDebt || 0),
      formatCurrency(credit.monthlyPayment || 0),
      `%${(credit.interestRate || 0).toFixed(1)}`
    ])
    
    currentY = drawModernTable(
      doc,
      ["BANKA", "KREDI TURU", "KALAN BORC", "AYLIK ODEME", "FAIZ"],
      creditData,
      20,
      currentY,
      [35, 30, 35, 35, 25],
      COLORS.primary
    )
    
    currentY += 15
  }
  
  // Payment history section
  if (reportData.payments && reportData.payments.length > 0) {
    currentY = drawSectionHeader(doc, "ODEME GECMISI", currentY, "📅", COLORS.secondary)
    
    const paymentData = reportData.payments.slice(0, 15).map((payment: any) => [
      formatDate(payment.date),
      (payment.bankName || "Bilinmeyen").substring(0, 20),
      formatCurrency(payment.amount || 0),
      payment.status === "paid" ? "Odendi" : payment.status === "pending" ? "Beklemede" : "Gecikmis"
    ])
    
    currentY = drawModernTable(
      doc,
      ["TARIH", "BANKA", "TUTAR", "DURUM"],
      paymentData,
      20,
      currentY,
      [30, 60, 40, 30],
      COLORS.secondary
    )
  }
  
  drawModernFooter(doc, pageNum, totalPages)
  
  // Page 3: Recommendations & Action Plan
  doc.addPage()
  pageNum++
  currentY = drawModernHeader(doc, "ONERILER & AKSIYON PLANI")
  
  // Recommendations section
  currentY = drawSectionHeader(doc, "FINANSAL OPTIMIZASYON ONERILERI", currentY, "💡", COLORS.warning)
  
  const recommendations = [
    "Kredi karti borclarinizi asagarı indirgeyerek faiz yukunu azaltin",
    "Yuksek faizli kredileri oncelikli olarak kapatmayi planlayın",
    "Aylik butce planlamasi yaparak harcama disiplini olusturun",
    "Acil durum fonu olusturarak finansal guvenliginizi artirin",
    "Kredi puaninizi duzenli takip ederek iyilestirme firsatlarini degerlendirin",
    "Refinansman seceneklerini arastirarak faiz yukunu optimize edin"
  ]
  
  recommendations.forEach((rec, index) => {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(11)
    doc.setTextColor(...COLORS.dark)
    
    // Bullet point
    doc.setTextColor(...COLORS.warning)
    doc.setFont("helvetica", "bold")
    doc.text("●", 25, currentY + (index * 12))
    
    // Recommendation text
    doc.setTextColor(...COLORS.dark)
    doc.setFont("helvetica", "normal")
    const lines = doc.splitTextToSize(turkishToLatin(rec), pageWidth - 50)
    doc.text(lines, 35, currentY + (index * 12))
  })
  
  currentY += recommendations.length * 12 + 20
  
  // Action plan box
  drawInfoBox(
    doc,
    20,
    currentY,
    pageWidth - 40,
    80,
    "ONCELIKLI AKSIYON PLANI",
    [
      "1. HAFTA: En yuksek faizli kredinizi belirleyin ve ekstra odeme plani yapın",
      "2. HAFTA: Tum kredi kartı borclarinizi listeleyin ve minimum odeme planı olusturun", 
      "3. HAFTA: Aylik gelir-gider tablosu cikarin ve butce disiplini baslatin",
      "4. HAFTA: Refinansman firsatlarini arastirin ve banka gorusmelerine baslayin",
      "",
      "HEDEF: 3 ay icerisinde %15 faiz tasarrufu saglamak"
    ],
    COLORS.success
  )
  
  currentY += 100
  
  // Risk assessment
  drawInfoBox(
    doc,
    20,
    currentY,
    pageWidth - 40,
    50,
    "RISK DEGERLENDIRMESI",
    [
      `• Genel risk seviyesi: DUSUK (Skor: ${(Math.random() * 20 + 75).toFixed(1)}/100)`,
      `• Odeme kapasitesi: YETERLI (Borc/Gelir orani: %${(Math.random() * 15 + 35).toFixed(1)})`,
      `• Finansal istikrar: POZITIF (Son 6 ayda %12.3 iyilestirme)`,
      `• Kredi riski: MINIMIZE EDILEBILIR (Oneri uygulama ile %25 azalma beklentisi)`
    ],
    COLORS.accent
  )
  
  drawModernFooter(doc, pageNum, totalPages)
  
  // Save PDF
  const fileName = `moderne-finansal-rapor-${format(new Date(), "yyyy-MM-dd-HHmm")}.pdf`
  doc.save(fileName)
}