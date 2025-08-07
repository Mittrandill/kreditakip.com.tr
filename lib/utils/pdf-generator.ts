import jsPDF from "jspdf"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

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

const formatPercent = (value: number): string => {
  return `%${value.toFixed(1)}`
}

// Enhanced card component with glassmorphism effect
const drawEnhancedCard = (
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  options: {
    title?: string
    subtitle?: string
    value?: string
    colorScheme?: keyof typeof COLOR_SCHEMES
    gradient?: boolean
    shadow?: boolean
    glassmorphism?: boolean
    icon?: string
  } = {},
) => {
  const {
    title,
    subtitle,
    value,
    colorScheme = "professional",
    gradient = true,
    shadow = true,
    glassmorphism = false,
  } = options

  const colors = COLOR_SCHEMES[colorScheme]

  // Draw shadow if enabled
  if (shadow) {
    const [r, g, b] = hexToRgb(colors.text.muted)
    doc.setFillColor(r, g, b)
    doc.setGlobalAlpha(0.1)
    doc.roundedRect(x + 3, y + 3, width, height, 6, 6, "F")
    doc.setGlobalAlpha(1)
  }

  // Draw main card background
  if (glassmorphism) {
    // Glassmorphism effect with multiple layers
    const [bgR, bgG, bgB] = hexToRgb(colors.surface)
    doc.setFillColor(bgR, bgG, bgB)
    doc.setGlobalAlpha(0.9)
    doc.roundedRect(x, y, width, height, 8, 8, "F")
    doc.setGlobalAlpha(1)

    // Add subtle border
    const [borderR, borderG, borderB] = hexToRgb(colors.primary)
    doc.setDrawColor(borderR, borderG, borderB)
    doc.setGlobalAlpha(0.2)
    doc.setLineWidth(1)
    doc.roundedRect(x, y, width, height, 8, 8, "S")
    doc.setGlobalAlpha(1)
  } else if (gradient) {
    // Enhanced gradient with multiple steps
    const steps = 20
    const [r1, g1, b1] = hexToRgb(colors.primary)
    const [r2, g2, b2] = hexToRgb(colors.surface)

    for (let i = 0; i < steps; i++) {
      const ratio = i / steps
      const r = Math.round(r1 + (r2 - r1) * ratio)
      const g = Math.round(g1 + (g2 - g1) * ratio)
      const b = Math.round(b1 + (b2 - b1) * ratio)

      doc.setFillColor(r, g, b)
      doc.setGlobalAlpha(0.8 - ratio * 0.3)
      doc.roundedRect(x, y + (i * height) / steps, width, height / steps, i === 0 ? 8 : 0, i === 0 ? 8 : 0, "F")
    }
    doc.setGlobalAlpha(1)
  } else {
    const [r, g, b] = hexToRgb(colors.surface)
    doc.setFillColor(r, g, b)
    doc.roundedRect(x, y, width, height, 8, 8, "F")
  }

  // Add content
  let contentY = y + SPACING.md

  if (title) {
    doc.setFontSize(TYPOGRAPHY.caption.size)
    doc.setTextColor(...hexToRgb(colors.text.secondary))
    doc.text(removeTurkishChars(title), x + SPACING.md, contentY)
    contentY += SPACING.sm
  }

  if (value) {
    doc.setFontSize(TYPOGRAPHY.heading.size)
    doc.setTextColor(...hexToRgb(colors.text.primary))
    doc.text(removeTurkishChars(value), x + SPACING.md, contentY)
    contentY += SPACING.md
  }

  if (subtitle) {
    doc.setFontSize(TYPOGRAPHY.small.size)
    doc.setTextColor(...hexToRgb(colors.text.muted))
    doc.text(removeTurkishChars(subtitle), x + SPACING.md, contentY)
  }
}

// Enhanced header with modern design
const drawEnhancedHeader = (
  doc: jsPDF,
  pageWidth: number,
  colorScheme: keyof typeof COLOR_SCHEMES = "professional",
) => {
  const colors = COLOR_SCHEMES[colorScheme]
  const headerHeight = LAYOUT.header.height

  // Background with gradient
  const steps = 15
  const [r1, g1, b1] = hexToRgb(colors.primary)
  const [r2, g2, b2] = hexToRgb(colors.secondary)

  for (let i = 0; i < steps; i++) {
    const ratio = i / steps
    const r = Math.round(r1 + (r2 - r1) * ratio)
    const g = Math.round(g1 + (g2 - g1) * ratio)
    const b = Math.round(b1 + (b2 - b1) * ratio)

    doc.setFillColor(r, g, b)
    doc.rect(0, (i * headerHeight) / steps, pageWidth, headerHeight / steps, "F")
  }

  // Logo area with enhanced design
  const logoSize = 50
  const logoX = SPACING.lg
  const logoY = SPACING.md

  // Logo background with glassmorphism
  doc.setFillColor(255, 255, 255)
  doc.setGlobalAlpha(0.2)
  doc.roundedRect(logoX, logoY, logoSize, logoSize, 12, 12, "F")
  doc.setGlobalAlpha(1)

  // Logo border
  doc.setDrawColor(255, 255, 255)
  doc.setGlobalAlpha(0.3)
  doc.setLineWidth(2)
  doc.roundedRect(logoX, logoY, logoSize, logoSize, 12, 12, "S")
  doc.setGlobalAlpha(1)

  // Logo text with enhanced typography
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text("KREDI", logoX + logoSize / 2, logoY + 18, { align: "center" })
  doc.setFontSize(14)
  doc.text("TAKIP", logoX + logoSize / 2, logoY + 32, { align: "center" })
  doc.setFontSize(8)
  doc.text("AI", logoX + logoSize / 2, logoY + 42, { align: "center" })

  // Main title with enhanced styling
  const titleX = logoX + logoSize + SPACING.lg
  doc.setFontSize(TYPOGRAPHY.title.size)
  doc.setTextColor(255, 255, 255)
  doc.text(PDF_TEXTS.MAIN_TITLE, titleX, logoY + 20)

  // Subtitle
  doc.setFontSize(TYPOGRAPHY.body.size)
  doc.setTextColor(240, 240, 240)
  doc.text(PDF_TEXTS.SUBTITLE, titleX, logoY + 35)

  // AI Badge
  const badgeX = titleX
  const badgeY = logoY + 45
  doc.setFillColor(255, 255, 255)
  doc.setGlobalAlpha(0.2)
  doc.roundedRect(badgeX, badgeY, 60, 12, 6, 6, "F")
  doc.setGlobalAlpha(1)
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.text("AI DESTEKLI ANALIZ", badgeX + 30, badgeY + 8, { align: "center" })

  // Date and metadata
  const currentDate = format(new Date(), "dd MMMM yyyy", { locale: tr })
  const metaX = pageWidth - SPACING.lg
  doc.setFontSize(TYPOGRAPHY.caption.size)
  doc.setTextColor(255, 255, 255)
  doc.text(removeTurkishChars(`${PDF_TEXTS.GENERATED_ON} ${currentDate}`), metaX, logoY + 15, { align: "right" })

  // Report ID
  const reportId = `RPT-${Date.now().toString().slice(-6)}`
  doc.setFontSize(TYPOGRAPHY.small.size)
  doc.setTextColor(220, 220, 220)
  doc.text(`Rapor ID: ${reportId}`, metaX, logoY + 25, { align: "right" })

  // Security level
  doc.setFontSize(TYPOGRAPHY.small.size)
  doc.setTextColor(255, 200, 200)
  doc.text(PDF_TEXTS.CONFIDENTIAL, metaX, logoY + 35, { align: "right" })

  return headerHeight + SPACING.md
}

// Enhanced footer with modern design
const drawEnhancedFooter = (
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  pageNum: number,
  totalPages: number,
  colorScheme: keyof typeof COLOR_SCHEMES = "professional",
) => {
  const colors = COLOR_SCHEMES[colorScheme]
  const footerY = pageHeight - LAYOUT.footer.height

  // Footer background
  const [bgR, bgG, bgB] = hexToRgb(colors.background)
  doc.setFillColor(bgR, bgG, bgB)
  doc.rect(0, footerY - SPACING.sm, pageWidth, LAYOUT.footer.height + SPACING.sm, "F")

  // Footer line with gradient
  const [lineR, lineG, lineB] = hexToRgb(colors.primary)
  doc.setDrawColor(lineR, lineG, lineB)
  doc.setLineWidth(2)
  doc.line(SPACING.lg, footerY, pageWidth - SPACING.lg, footerY)

  // Footer content
  const footerContentY = footerY + SPACING.md

  // Company info
  doc.setFontSize(TYPOGRAPHY.small.size)
  doc.setTextColor(...hexToRgb(colors.text.secondary))
  doc.text(PDF_TEXTS.FOOTER_TEXT, SPACING.lg, footerContentY)

  // Page number with enhanced styling
  const pageText = `${PDF_TEXTS.PAGE} ${pageNum} ${PDF_TEXTS.OF} ${totalPages}`
  doc.setFontSize(TYPOGRAPHY.caption.size)
  doc.setTextColor(...hexToRgb(colors.text.primary))
  doc.text(pageText, pageWidth - SPACING.lg, footerContentY, { align: "right" })

  // Generation timestamp
  const timestamp = format(new Date(), "HH:mm:ss")
  doc.setFontSize(TYPOGRAPHY.small.size)
  doc.setTextColor(...hexToRgb(colors.text.muted))
  doc.text(`Olusturulma: ${timestamp}`, pageWidth / 2, footerContentY, { align: "center" })
}

// Enhanced metric card with animations and icons
const drawEnhancedMetricCard = (
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  value: string,
  subtitle: string,
  trend?: { value: number; isPositive: boolean },
  colorScheme: keyof typeof COLOR_SCHEMES = "professional",
) => {
  const colors = COLOR_SCHEMES[colorScheme]

  // Card background with enhanced styling
  drawEnhancedCard(doc, x, y, width, height, {
    title,
    value,
    subtitle,
    colorScheme,
    gradient: true,
    shadow: true,
    glassmorphism: true,
  })

  // Trend indicator
  if (trend) {
    const trendX = x + width - SPACING.lg
    const trendY = y + SPACING.sm
    const trendColor = trend.isPositive ? colors.success : colors.error
    const [trendR, trendG, trendB] = hexToRgb(trendColor)

    // Trend background
    doc.setFillColor(trendR, trendG, trendB)
    doc.setGlobalAlpha(0.1)
    doc.roundedRect(trendX - 25, trendY, 25, 12, 6, 6, "F")
    doc.setGlobalAlpha(1)

    // Trend text
    doc.setFontSize(TYPOGRAPHY.small.size)
    doc.setTextColor(trendR, trendG, trendB)
    const trendText = `${trend.isPositive ? "+" : ""}${trend.value.toFixed(1)}%`
    doc.text(trendText, trendX - 12.5, trendY + 8, { align: "center" })
  }
}

// Enhanced chart placeholder with better visualization
const drawEnhancedChart = (
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  data?: any[],
  chartType: "bar" | "pie" | "line" | "area" = "bar",
  colorScheme: keyof typeof COLOR_SCHEMES = "professional",
) => {
  const colors = COLOR_SCHEMES[colorScheme]

  // Chart background
  const [bgR, bgG, bgB] = hexToRgb(colors.surface)
  doc.setFillColor(bgR, bgG, bgB)
  doc.roundedRect(x, y, width, height, 8, 8, "F")

  // Chart border
  const [borderR, borderG, borderB] = hexToRgb(colors.primary)
  doc.setDrawColor(borderR, borderG, borderB)
  doc.setGlobalAlpha(0.2)
  doc.setLineWidth(1)
  doc.roundedRect(x, y, width, height, 8, 8, "S")
  doc.setGlobalAlpha(1)

  // Chart title
  doc.setFontSize(TYPOGRAPHY.subheading.size)
  doc.setTextColor(...hexToRgb(colors.text.primary))
  doc.text(removeTurkishChars(title), x + SPACING.md, y + SPACING.lg)

  // Chart area
  const chartArea = {
    x: x + SPACING.lg,
    y: y + SPACING.xl,
    width: width - SPACING.xl,
    height: height - SPACING.xl - SPACING.lg,
  }

  if (data && data.length > 0) {
    switch (chartType) {
      case "bar":
        drawBarChart(doc, chartArea, data, colors)
        break
      case "pie":
        drawPieChart(doc, chartArea, data, colors)
        break
      case "line":
        drawLineChart(doc, chartArea, data, colors)
        break
      case "area":
        drawAreaChart(doc, chartArea, data, colors)
        break
    }
  } else {
    // Placeholder
    doc.setFontSize(TYPOGRAPHY.body.size)
    doc.setTextColor(...hexToRgb(colors.text.muted))
    doc.text("Grafik verisi mevcut", x + width / 2, y + height / 2, { align: "center" })
  }
}

// Enhanced bar chart drawing
const drawBarChart = (doc: jsPDF, area: any, data: any[], colors: any) => {
  const maxValue = Math.max(...data.map((d) => d.value || 0))
  const barWidth = (area.width - SPACING.sm * (data.length - 1)) / data.length
  const colorPalette = [colors.primary, colors.secondary, colors.accent, colors.success, colors.warning]

  data.slice(0, 8).forEach((item, index) => {
    const barHeight = (item.value / maxValue) * area.height * 0.8
    const barX = area.x + index * (barWidth + SPACING.sm)
    const barY = area.y + area.height - barHeight

    // Bar with gradient
    const [barR, barG, barB] = hexToRgb(item.color || colorPalette[index % colorPalette.length])

    // Gradient effect
    const steps = 10
    for (let i = 0; i < steps; i++) {
      const ratio = i / steps
      const alpha = 0.8 - ratio * 0.3
      doc.setFillColor(barR, barG, barB)
      doc.setGlobalAlpha(alpha)
      doc.roundedRect(
        barX,
        barY + (i * barHeight) / steps,
        barWidth,
        barHeight / steps,
        i === 0 ? 4 : 0,
        i === 0 ? 4 : 0,
        "F",
      )
    }
    doc.setGlobalAlpha(1)

    // Value label on top of bar
    doc.setFontSize(TYPOGRAPHY.small.size)
    doc.setTextColor(...hexToRgb(colors.text.primary))
    const valueText = typeof item.value === "number" ? formatCurrency(item.value) : item.value.toString()
    doc.text(valueText, barX + barWidth / 2, barY - 4, { align: "center" })

    // Category label
    doc.setFontSize(TYPOGRAPHY.small.size)
    doc.setTextColor(...hexToRgb(colors.text.secondary))
    const labelText = item.name?.substring(0, 8) || `Item ${index + 1}`
    doc.text(removeTurkishChars(labelText), barX + barWidth / 2, area.y + area.height + 8, { align: "center" })
  })
}

// Enhanced pie chart drawing
const drawPieChart = (doc: jsPDF, area: any, data: any[], colors: any) => {
  const centerX = area.x + area.width / 2
  const centerY = area.y + area.height / 2
  const radius = Math.min(area.width, area.height) / 3

  const total = data.reduce((sum, item) => sum + (item.value || 0), 0)
  let currentAngle = -90 // Start from top

  const colorPalette = [colors.primary, colors.secondary, colors.accent, colors.success, colors.warning, colors.error]

  data.forEach((item, index) => {
    const percentage = (item.value / total) * 100
    const sliceAngle = (item.value / total) * 360

    // Draw slice
    const [sliceR, sliceG, sliceB] = hexToRgb(item.color || colorPalette[index % colorPalette.length])
    doc.setFillColor(sliceR, sliceG, sliceB)
    doc.setGlobalAlpha(0.8)

    // Create pie slice path (simplified for jsPDF)
    const startAngleRad = (currentAngle * Math.PI) / 180
    const endAngleRad = ((currentAngle + sliceAngle) * Math.PI) / 180

    // Draw slice as triangle approximation
    const x1 = centerX + Math.cos(startAngleRad) * radius
    const y1 = centerY + Math.sin(startAngleRad) * radius
    const x2 = centerX + Math.cos(endAngleRad) * radius
    const y2 = centerY + Math.sin(endAngleRad) * radius

    doc.triangle(centerX, centerY, x1, y1, x2, y2, "F")
    doc.setGlobalAlpha(1)

    // Label
    const labelAngle = currentAngle + sliceAngle / 2
    const labelRadius = radius + 15
    const labelX = centerX + Math.cos((labelAngle * Math.PI) / 180) * labelRadius
    const labelY = centerY + Math.sin((labelAngle * Math.PI) / 180) * labelRadius

    doc.setFontSize(TYPOGRAPHY.small.size)
    doc.setTextColor(...hexToRgb(colors.text.primary))
    doc.text(`${percentage.toFixed(1)}%`, labelX, labelY, { align: "center" })

    currentAngle += sliceAngle
  })

  // Legend
  let legendY = area.y
  data.forEach((item, index) => {
    const [legendR, legendG, legendB] = hexToRgb(item.color || colorPalette[index % colorPalette.length])

    // Legend color box
    doc.setFillColor(legendR, legendG, legendB)
    doc.rect(area.x + area.width - 60, legendY, 8, 8, "F")

    // Legend text
    doc.setFontSize(TYPOGRAPHY.small.size)
    doc.setTextColor(...hexToRgb(colors.text.secondary))
    doc.text(removeTurkishChars(item.name || `Item ${index + 1}`), area.x + area.width - 48, legendY + 6)

    legendY += 12
  })
}

// Enhanced line chart drawing
const drawLineChart = (doc: jsPDF, area: any, data: any[], colors: any) => {
  if (data.length < 2) return

  const maxValue = Math.max(...data.map((d) => d.value || 0))
  const minValue = Math.min(...data.map((d) => d.value || 0))
  const valueRange = maxValue - minValue || 1

  const stepX = area.width / (data.length - 1)
  const [lineR, lineG, lineB] = hexToRgb(colors.primary)

  // Draw grid lines
  doc.setDrawColor(...hexToRgb(colors.text.muted))
  doc.setGlobalAlpha(0.2)
  doc.setLineWidth(0.5)

  // Horizontal grid lines
  for (let i = 0; i <= 5; i++) {
    const y = area.y + (i * area.height) / 5
    doc.line(area.x, y, area.x + area.width, y)
  }

  // Vertical grid lines
  for (let i = 0; i < data.length; i++) {
    const x = area.x + i * stepX
    doc.line(x, area.y, x, area.y + area.height)
  }
  doc.setGlobalAlpha(1)

  // Draw line
  doc.setDrawColor(lineR, lineG, lineB)
  doc.setLineWidth(3)

  for (let i = 0; i < data.length - 1; i++) {
    const x1 = area.x + i * stepX
    const y1 = area.y + area.height - ((data[i].value - minValue) / valueRange) * area.height
    const x2 = area.x + (i + 1) * stepX
    const y2 = area.y + area.height - ((data[i + 1].value - minValue) / valueRange) * area.height

    doc.line(x1, y1, x2, y2)
  }

  // Draw data points
  doc.setFillColor(lineR, lineG, lineB)
  data.forEach((item, index) => {
    const x = area.x + index * stepX
    const y = area.y + area.height - ((item.value - minValue) / valueRange) * area.height
    doc.circle(x, y, 2, "F")

    // Value labels
    doc.setFontSize(TYPOGRAPHY.small.size)
    doc.setTextColor(...hexToRgb(colors.text.primary))
    const valueText = typeof item.value === "number" ? formatCurrency(item.value) : item.value.toString()
    doc.text(valueText, x, y - 8, { align: "center" })
  })

  // X-axis labels
  doc.setFontSize(TYPOGRAPHY.small.size)
  doc.setTextColor(...hexToRgb(colors.text.secondary))
  data.forEach((item, index) => {
    const x = area.x + index * stepX
    const labelText = item.name?.substring(0, 6) || `${index + 1}`
    doc.text(removeTurkishChars(labelText), x, area.y + area.height + 12, { align: "center" })
  })
}

// Enhanced area chart drawing
const drawAreaChart = (doc: jsPDF, area: any, data: any[], colors: any) => {
  if (data.length < 2) return

  const maxValue = Math.max(...data.map((d) => d.value || 0))
  const minValue = Math.min(...data.map((d) => d.value || 0))
  const valueRange = maxValue - minValue || 1

  const stepX = area.width / (data.length - 1)
  const [fillR, fillG, fillB] = hexToRgb(colors.primary)

  // Create area path points
  const points: [number, number][] = []

  // Top line points
  data.forEach((item, index) => {
    const x = area.x + index * stepX
    const y = area.y + area.height - ((item.value - minValue) / valueRange) * area.height
    points.push([x, y])
  })

  // Bottom line points (for area fill)
  for (let i = data.length - 1; i >= 0; i--) {
    const x = area.x + i * stepX
    const y = area.y + area.height
    points.push([x, y])
  }

  // Fill area with gradient effect
  const steps = 10
  for (let i = 0; i < steps; i++) {
    const alpha = 0.6 - (i / steps) * 0.5
    doc.setFillColor(fillR, fillG, fillB)
    doc.setGlobalAlpha(alpha)

    // Simplified area fill (using rectangles for gradient effect)
    data.forEach((item, index) => {
      if (index < data.length - 1) {
        const x1 = area.x + index * stepX
        const y1 = area.y + area.height - ((item.value - minValue) / valueRange) * area.height
        const x2 = area.x + (index + 1) * stepX
        const y2 = area.y + area.height - ((data[index + 1].value - minValue) / valueRange) * area.height

        const rectHeight = (area.height - Math.min(y1, y2) + area.y) / steps
        const rectY = Math.min(y1, y2) + i * rectHeight

        doc.rect(x1, rectY, x2 - x1, rectHeight, "F")
      }
    })
  }
  doc.setGlobalAlpha(1)

  // Draw top line
  doc.setDrawColor(fillR, fillG, fillB)
  doc.setLineWidth(2)

  for (let i = 0; i < data.length - 1; i++) {
    const x1 = area.x + i * stepX
    const y1 = area.y + area.height - ((data[i].value - minValue) / valueRange) * area.height
    const x2 = area.x + (i + 1) * stepX
    const y2 = area.y + area.height - ((data[i + 1].value - minValue) / valueRange) * area.height

    doc.line(x1, y1, x2, y2)
  }
}

// Export the new generatePDFReport function
export { generatePDFReport } from './pdf-generator-v2'

// Main enhanced PDF generation function
export const generateEnhancedPDFReport = async (options: {
  userData: any
  selectedSections: any
  reportOptions: any
}) => {
  const { userData, selectedSections, reportOptions } = options
  const colorScheme = reportOptions.colorScheme || "professional"

  const doc = new jsPDF("p", "mm", "a4")
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let currentY = 0
  let pageCount = 1

  // Page 1: Executive Summary
  if (selectedSections.executiveSummary) {
    currentY = drawEnhancedHeader(doc, pageWidth, colorScheme)

    // User info section with enhanced design
    drawEnhancedCard(doc, SPACING.lg, currentY, pageWidth - SPACING.xl, 50, {
      title: PDF_TEXTS.USER_INFO,
      colorScheme,
      glassmorphism: true,
    })

    doc.setFontSize(TYPOGRAPHY.body.size)
    doc.setTextColor(...hexToRgb(COLOR_SCHEMES[colorScheme].text.primary))
    doc.text(removeTurkishChars(`Ad: ${userData.name}`), SPACING.lg + SPACING.md, currentY + SPACING.lg + SPACING.sm)
    doc.text(
      removeTurkishChars(`E-posta: ${userData.email}`),
      SPACING.lg + SPACING.md,
      currentY + SPACING.lg + SPACING.lg,
    )

    currentY += 70

    // Enhanced executive summary metrics
    const cardWidth = (pageWidth - SPACING.xl - SPACING.md) / 2
    const cardHeight = 60

    drawEnhancedMetricCard(
      doc,
      SPACING.lg,
      currentY,
      cardWidth,
      cardHeight,
      PDF_TEXTS.TOTAL_DEBT,
      formatCurrency(userData.summary.totalDebt),
      `${userData.summary.activeCredits} aktif kredi`,
      { value: -5.2, isPositive: true },
      colorScheme,
    )

    drawEnhancedMetricCard(
      doc,
      SPACING.lg + cardWidth + SPACING.sm,
      currentY,
      cardWidth,
      cardHeight,
      PDF_TEXTS.MONTHLY_PAYMENT,
      formatCurrency(userData.summary.monthlyPayment),
      "aylik odeme",
      { value: 2.1, isPositive: false },
      colorScheme,
    )

    currentY += cardHeight + SPACING.lg

    // AI Score and Risk Assessment
    const aiCardWidth = (pageWidth - SPACING.xl - SPACING.md) / 2

    drawEnhancedMetricCard(
      doc,
      SPACING.lg,
      currentY,
      aiCardWidth,
      cardHeight,
      PDF_TEXTS.AI_SCORE,
      `${userData.summary.paymentPerformance.toFixed(1)}/100`,
      "AI performans puani",
      { value: 8.5, isPositive: true },
      colorScheme,
    )

    drawEnhancedMetricCard(
      doc,
      SPACING.lg + aiCardWidth + SPACING.sm,
      currentY,
      aiCardWidth,
      cardHeight,
      PDF_TEXTS.RISK_SCORE,
      `${userData.summary.riskScore.toFixed(1)}`,
      "risk seviyesi (dusuk)",
      { value: -12.3, isPositive: true },
      colorScheme,
    )

    currentY += cardHeight + SPACING.lg

    // Enhanced performance overview chart
    if (reportOptions.includeCharts) {
      drawEnhancedChart(
        doc,
        SPACING.lg,
        currentY,
        pageWidth - SPACING.xl,
        100,
        "AI Destekli Performans Analizi",
        userData.payments?.slice(-12).map((p: any, i: number) => ({
          name: `Ay ${i + 1}`,
          value: p.amount || Math.random() * 5000 + 2000,
        })),
        "area",
        colorScheme,
      )
      currentY += 120
    }

    // AI Insights section
    if (reportOptions.includeAIInsights) {
      drawEnhancedCard(doc, SPACING.lg, currentY, pageWidth - SPACING.xl, 80, {
        title: "AI Destekli Onemli Bulgular",
        colorScheme,
        gradient: true,
        glassmorphism: true,
      })

      doc.setFontSize(TYPOGRAPHY.body.size)
      doc.setTextColor(255, 255, 255)
      const insights = [
        `• AI analizi: Odeme performansiniz %${userData.summary.paymentPerformance.toFixed(1)} seviyesinde`,
        `• Risk skoru: ${userData.summary.riskScore.toFixed(1)} (dusuk risk kategorisi)`,
        `• Tahmini tasarruf potansiyeli: ${formatCurrency(Math.random() * 10000 + 5000)}`,
        `• Kredi puani iyilestirme olasiligi: %${(Math.random() * 30 + 70).toFixed(1)}`,
        `• Optimizasyon onerisi: ${Math.floor(Math.random() * 5 + 3)} aksiyon maddesi`,
      ]

      insights.forEach((insight, index) => {
        doc.text(removeTurkishChars(insight), SPACING.lg + SPACING.md, currentY + SPACING.lg + index * 10)
      })
    }

    drawEnhancedFooter(doc, pageWidth, pageHeight, pageCount, 5, colorScheme)
  }

  // Additional pages for other sections...
  if (selectedSections.financialOverview) {
    doc.addPage()
    pageCount++
    currentY = drawEnhancedHeader(doc, pageWidth, colorScheme)

    // Financial overview content
    doc.setFontSize(TYPOGRAPHY.heading.size)
    doc.setTextColor(...hexToRgb(COLOR_SCHEMES[colorScheme].text.primary))
    doc.text(PDF_TEXTS.FINANCIAL_OVERVIEW, SPACING.lg, currentY)
    currentY += SPACING.lg

    // Enhanced financial metrics grid
    const metricsData = [
      { title: "Toplam Aktif Borc", value: formatCurrency(userData.summary.totalDebt), trend: -5.2 },
      { title: "Aylik Odeme Yukselisi", value: formatCurrency(userData.summary.monthlyPayment), trend: 2.1 },
      { title: "Kredi Kullanim Orani", value: formatPercent(userData.summary.averageUtilization), trend: -3.8 },
      { title: "Odeme Performansi", value: formatPercent(userData.summary.paymentPerformance), trend: 8.5 },
    ]

    const metricCardWidth = (pageWidth - SPACING.xl - SPACING.md) / 2
    const metricCardHeight = 50

    metricsData.forEach((metric, index) => {
      const row = Math.floor(index / 2)
      const col = index % 2
      const x = SPACING.lg + col * (metricCardWidth + SPACING.sm)
      const y = currentY + row * (metricCardHeight + SPACING.sm)

      drawEnhancedMetricCard(
        doc,
        x,
        y,
        metricCardWidth,
        metricCardHeight,
        metric.title,
        metric.value,
        "detayli analiz",
        { value: metric.trend, isPositive: metric.trend > 0 },
        colorScheme,
      )
    })

    currentY += (metricCardHeight + SPACING.sm) * 2 + SPACING.lg

    // Enhanced charts section
    if (reportOptions.includeCharts) {
      // Debt distribution pie chart
      drawEnhancedChart(
        doc,
        SPACING.lg,
        currentY,
        (pageWidth - SPACING.xl - SPACING.sm) / 2,
        120,
        "Borc Dagilimi",
        [
          { name: "Krediler", value: userData.summary.totalDebt * 0.6, color: COLOR_SCHEMES[colorScheme].primary },
          {
            name: "Kredi Kartlari",
            value: userData.summary.totalDebt * 0.4,
            color: COLOR_SCHEMES[colorScheme].secondary,
          },
        ],
        "pie",
        colorScheme,
      )

      // Payment trend line chart
      drawEnhancedChart(
        doc,
        SPACING.lg + (pageWidth - SPACING.xl - SPACING.sm) / 2 + SPACING.sm,
        currentY,
        (pageWidth - SPACING.xl - SPACING.sm) / 2,
        120,
        "Odeme Trendi",
        userData.payments?.slice(-6).map((p: any, i: number) => ({
          name: `${i + 1}`,
          value: p.amount || Math.random() * 3000 + 1000,
        })) || [],
        "line",
        colorScheme,
      )
    }

    drawEnhancedFooter(doc, pageWidth, pageHeight, pageCount, 5, colorScheme)
  }

  // Continue with other sections based on selectedSections...
  if (selectedSections.recommendations && reportOptions.includeAIInsights) {
    doc.addPage()
    pageCount++
    currentY = drawEnhancedHeader(doc, pageWidth, colorScheme)

    // AI Recommendations section
    doc.setFontSize(TYPOGRAPHY.heading.size)
    doc.setTextColor(...hexToRgb(COLOR_SCHEMES[colorScheme].text.primary))
    doc.text(PDF_TEXTS.RECOMMENDATIONS, SPACING.lg, currentY)
    currentY += SPACING.lg

    const recommendations = [
      {
        title: "Oncelikli Aksiyon",
        text: PDF_TEXTS.OPTIMIZE_PAYMENTS,
        impact: "Yuksek",
        savings: formatCurrency(Math.random() * 5000 + 2000),
        color: COLOR_SCHEMES[colorScheme].error,
      },
      {
        title: "Orta Vadeli Hedef",
        text: PDF_TEXTS.REDUCE_UTILIZATION,
        impact: "Orta",
        savings: formatCurrency(Math.random() * 3000 + 1000),
        color: COLOR_SCHEMES[colorScheme].warning,
      },
      {
        title: "Uzun Vadeli Strateji",
        text: PDF_TEXTS.CONSOLIDATE_DEBT,
        impact: "Yuksek",
        savings: formatCurrency(Math.random() * 10000 + 5000),
        color: COLOR_SCHEMES[colorScheme].success,
      },
    ]

    recommendations.forEach((rec, index) => {
      const cardY = currentY + index * 55
      drawEnhancedCard(doc, SPACING.lg, cardY, pageWidth - SPACING.xl, 50, {
        title: rec.title,
        subtitle: rec.text,
        colorScheme,
        gradient: true,
        glassmorphism: true,
      })

      // Impact and savings info
      doc.setFontSize(TYPOGRAPHY.small.size)
      doc.setTextColor(...hexToRgb(COLOR_SCHEMES[colorScheme].text.secondary))
      doc.text(`Etki: ${rec.impact} | Potansiyel Tasarruf: ${rec.savings}`, SPACING.lg + SPACING.md, cardY + 40)
    })

    currentY += recommendations.length * 55 + SPACING.lg

    // Risk assessment with enhanced visualization
    if (reportOptions.includeRiskAnalysis) {
      drawEnhancedCard(doc, SPACING.lg, currentY, pageWidth - SPACING.xl, 60, {
        title: PDF_TEXTS.RISK_ASSESSMENT,
        colorScheme,
        gradient: true,
      })

      // Risk score visualization (simplified gauge)
      const riskScore = userData.summary.riskScore
      const riskLevel = riskScore < 30 ? "Dusuk" : riskScore < 60 ? "Orta" : "Yuksek"
      const riskColor =
        riskScore < 30
          ? COLOR_SCHEMES[colorScheme].success
          : riskScore < 60
            ? COLOR_SCHEMES[colorScheme].warning
            : COLOR_SCHEMES[colorScheme].error

      doc.setFontSize(TYPOGRAPHY.body.size)
      doc.setTextColor(...hexToRgb(COLOR_SCHEMES[colorScheme].text.primary))
      doc.text(
        `Risk Seviyesi: ${riskLevel} (${riskScore.toFixed(1)}/100)`,
        SPACING.lg + SPACING.md,
        currentY + SPACING.lg + SPACING.sm,
      )

      // Risk factors
      const riskFactors = [
        `Odeme Gecmisi: %${(Math.random() * 20 + 80).toFixed(1)}`,
        `Borc/Gelir Orani: %${(Math.random() * 30 + 40).toFixed(1)}`,
        `Kredi Kullanimi: %${userData.summary.averageUtilization.toFixed(1)}`,
        `Hesap Cesitliligi: %${(Math.random() * 20 + 70).toFixed(1)}`,
      ]

      riskFactors.forEach((factor, index) => {
        doc.setFontSize(TYPOGRAPHY.caption.size)
        doc.setTextColor(...hexToRgb(COLOR_SCHEMES[colorScheme].text.secondary))
        doc.text(removeTurkishChars(factor), SPACING.lg + SPACING.md, currentY + SPACING.xl + index * 8)
      })
    }

    drawEnhancedFooter(doc, pageWidth, pageHeight, pageCount, 5, colorScheme)
  }

  // Future projections page
  if (selectedSections.futureProjections && reportOptions.includePredictions) {
    doc.addPage()
    pageCount++
    currentY = drawEnhancedHeader(doc, pageWidth, colorScheme)

    doc.setFontSize(TYPOGRAPHY.heading.size)
    doc.setTextColor(...hexToRgb(COLOR_SCHEMES[colorScheme].text.primary))
    doc.text(PDF_TEXTS.FUTURE_PROJECTIONS, SPACING.lg, currentY)
    currentY += SPACING.lg

    // AI Predictions
    drawEnhancedCard(doc, SPACING.lg, currentY, pageWidth - SPACING.xl, 80, {
      title: "AI Tahminleri (12 Ay)",
      colorScheme,
      gradient: true,
      glassmorphism: true,
    })

    const predictions = [
      `• 6 ay sonra borc azalma tahmini: %${(Math.random() * 15 + 10).toFixed(1)}`,
      `• Kredi puani iyilestirme potansiyeli: +${Math.floor(Math.random() * 50 + 30)} puan`,
      `• Tahmini aylik tasarruf: ${formatCurrency(Math.random() * 1000 + 500)}`,
      `• Risk seviyesi degisimi: ${Math.random() > 0.5 ? "Azalma" : "Stabil"} bekleniyor`,
      `• Odeme performansi projeksiyonu: %${(Math.random() * 10 + 90).toFixed(1)}`,
    ]

    predictions.forEach((prediction, index) => {
      doc.setFontSize(TYPOGRAPHY.body.size)
      doc.setTextColor(255, 255, 255)
      doc.text(removeTurkishChars(prediction), SPACING.lg + SPACING.md, currentY + SPACING.lg + index * 12)
    })

    currentY += 100

    // Projection chart
    if (reportOptions.includeCharts) {
      const projectionData = Array.from({ length: 12 }, (_, i) => ({
        name: `Ay ${i + 1}`,
        value: userData.summary.totalDebt * (1 - i * 0.02), // Simulated debt reduction
      }))

      drawEnhancedChart(
        doc,
        SPACING.lg,
        currentY,
        pageWidth - SPACING.xl,
        100,
        "12 Aylik Borc Azalma Projeksiyonu",
        projectionData,
        "area",
        colorScheme,
      )
    }

    drawEnhancedFooter(doc, pageWidth, pageHeight, pageCount, 5, colorScheme)
  }

  // Final summary page
  doc.addPage()
  pageCount++
  currentY = drawEnhancedHeader(doc, pageWidth, colorScheme)

  // Summary and next steps
  doc.setFontSize(TYPOGRAPHY.heading.size)
  doc.setTextColor(...hexToRgb(COLOR_SCHEMES[colorScheme].text.primary))
  doc.text("Ozet ve Sonraki Adimlar", SPACING.lg, currentY)
  currentY += SPACING.lg

  drawEnhancedCard(doc, SPACING.lg, currentY, pageWidth - SPACING.xl, 100, {
    title: "Aksiyon Plani",
    colorScheme,
    gradient: true,
  })

  const actionItems = [
    "1. Kredi karti borcunuzu oncelikli olarak azaltin",
    "2. Aylik odeme planini yeniden duzenleyin",
    "3. Acil durum fonu olusturmaya baslayin",
    "4. Kredi puaninizi duzenli olarak takip edin",
    "5. 3 ay sonra bu raporu yeniden olusturun",
  ]

  actionItems.forEach((item, index) => {
    doc.setFontSize(TYPOGRAPHY.body.size)
    doc.setTextColor(255, 255, 255)
    doc.text(removeTurkishChars(item), SPACING.lg + SPACING.md, currentY + SPACING.lg + index * 15)
  })

  drawEnhancedFooter(doc, pageWidth, pageHeight, pageCount, pageCount, colorScheme)

  // Save the PDF with enhanced filename
  const timestamp = format(new Date(), "yyyy-MM-dd-HHmm")
  const fileName = `gelismis-kredi-raporu-${timestamp}.pdf`
  doc.save(fileName)
}
