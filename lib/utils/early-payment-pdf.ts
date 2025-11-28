import type { jsPDF } from "jspdf"

interface EarlyPaymentData {
  hesaplamaForm: {
    erkenOdemeTutari: string
  }
  hesaplamaResult: {
    toplamTasarruf: number
    yeniKalanBorc: number
    faizTasarrufu: number
    eskiToplamFaiz: number
    eskiToplamOdeme: number
    kalanAnaPara: number
    yeniToplamFaiz: number
    yeniToplamOdeme: number
  }
  dynamicStats: {
    remainingDebt: number
  }
  krediDetay: {
    credit_code?: string
    banks?: {
      name?: string
      logo_url?: string | null
    } | null
  } | null
  user: {
    email?: string
    user_metadata?: {
      full_name?: string
    }
  } | null
}

const safeText = (text: string | number | null | undefined): string => {
  if (text === null || text === undefined) return ""
  return String(text)
    .replace(/ğ/g, "g")
    .replace(/Ğ/g, "G")
    .replace(/ü/g, "u")
    .replace(/Ü/g, "U")
    .replace(/ş/g, "s")
    .replace(/Ş ​​/g, "S")
    .replace(/ı/g, "i")
    .replace(/İ/g, "I")
    .replace(/ö/g, "o")
    .replace(/Ö/g, "O")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "C")
}

const formatMoney = (amount: number): string => {
  const formatted = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
  return safeText(formatted + " TL")
}

const formatDate = (date: Date): string => {
  return safeText(date.toLocaleDateString("tr-TR"))
}

const loadImageAsBase64 = async (imagePath: string): Promise<string> => {
  try {
    const response = await fetch(imagePath)
    if (!response.ok) {
      throw new Error(`Failed to load image: ${imagePath}`)
    }
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error(`Failed to read image: ${imagePath}`))
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    throw error
  }
}

const addGradientRect = (
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  color1: [number, number, number],
  color2: [number, number, number]
) => {
  const steps = 20
  for (let i = 0; i < steps; i++) {
    const ratio = i / steps
    const r = Math.round(color1[0] + (color2[0] - color1[0]) * ratio)
    const g = Math.round(color1[1] + (color2[1] - color1[1]) * ratio)
    const b = Math.round(color1[2] + (color2[2] - color1[2]) * ratio)
    doc.setFillColor(r, g, b)
    doc.rect(x, y + (height / steps) * i, width, height / steps, "F")
  }
}

const COLORS = {
  primary: [16, 185, 129] as [number, number, number],
  secondary: [20, 184, 166] as [number, number, number],
  accent: [13, 148, 136] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
  warning: [251, 146, 60] as [number, number, number],
  danger: [239, 68, 68] as [number, number, number],
  dark: [30, 41, 59] as [number, number, number],
  gray: [100, 116, 139] as [number, number, number],
  lightGray: [241, 245, 249] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
}

export async function generateEarlyPaymentPDF(data: EarlyPaymentData): Promise<void> {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF()

  const { hesaplamaForm, hesaplamaResult, dynamicStats, krediDetay, user } = data

  // Load logos
  let whiteLogo: string | null = null
  let bankLogo: string | null = null

  try {
    whiteLogo = await loadImageAsBase64("/logo-white.png")
  } catch (error) {
  }

  try {
    const bankLogoUrl = krediDetay?.banks?.logo_url
    if (bankLogoUrl) {
      bankLogo = await loadImageAsBase64(bankLogoUrl)
    }
  } catch (error) {
  }

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15

  // ============ COVER PAGE (Same as pdf-generator) ============
  addGradientRect(doc, 0, 0, pageWidth, pageHeight, COLORS.primary, COLORS.accent)

  // Decorative circles
  doc.setFillColor(255, 255, 255)
  doc.setGState(doc.GState({ opacity: 0.03 }))
  doc.circle(pageWidth * 0.85, pageHeight * 0.15, 60, "F")
  doc.circle(pageWidth * 0.15, pageHeight * 0.85, 50, "F")
  doc.circle(pageWidth * 0.25, pageHeight * 0.4, 35, "F")
  doc.circle(pageWidth * 0.75, pageHeight * 0.6, 40, "F")
  doc.setGState(doc.GState({ opacity: 1 }))

  // Logo section
  const logoY = pageHeight * 0.28
  const logoWidth = 125
  const logoHeight = 25

  if (whiteLogo) {
    try {
      doc.addImage(whiteLogo, "PNG", pageWidth / 2 - logoWidth / 2, logoY - logoHeight / 2, logoWidth, logoHeight)
    } catch (error) {
      doc.setTextColor(...COLORS.white)
      doc.setFontSize(24)
      doc.setFont("helvetica", "bold")
      doc.text("Kredi Takip", pageWidth / 2, logoY + 5, { align: "center" })
    }
  } else {
    doc.setTextColor(...COLORS.white)
    doc.setFontSize(24)
    doc.setFont("helvetica", "bold")
    doc.text("Kredi Takip", pageWidth / 2, logoY + 5, { align: "center" })
  }

  // Main title
  const titleY = pageHeight * 0.48
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(36)
  doc.setFont("helvetica", "bold")
  doc.text(safeText("ERKEN ODEME"), pageWidth / 2, titleY, { align: "center" })
  doc.setFontSize(36)
  doc.text(safeText("HESAPLAMA"), pageWidth / 2, titleY + 22, { align: "center" })

  // Separator line
  doc.setDrawColor(...COLORS.white)
  doc.setLineWidth(0.5)
  doc.setGState(doc.GState({ opacity: 0.5 }))
  const lineWidth = 80
  doc.line(pageWidth / 2 - lineWidth / 2, titleY + 54, pageWidth / 2 + lineWidth / 2, titleY + 54)
  doc.setGState(doc.GState({ opacity: 1 }))

  // Subtitle
  doc.setFontSize(13)
  doc.setFont("helvetica", "normal")
  doc.setGState(doc.GState({ opacity: 0.9 }))
  doc.text(safeText("Detayli Tasarruf Analizi"), pageWidth / 2, titleY + 66, { align: "center" })
  doc.setGState(doc.GState({ opacity: 1 }))

  // User info and report date (without card background)
  const coverCardY = pageHeight * 0.68

  // User info
  if (user?.email || user?.user_metadata?.full_name) {
    doc.setTextColor(...COLORS.white)
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text(
      safeText(user?.user_metadata?.full_name || user?.email || "Kullanici"),
      pageWidth / 2,
      coverCardY + 22,
      { align: "center" }
    )

    // Divider
    doc.setDrawColor(...COLORS.white)
    doc.setGState(doc.GState({ opacity: 0.3 }))
    doc.line(pageWidth / 2 - 30, coverCardY + 30, pageWidth / 2 + 30, coverCardY + 30)
    doc.setGState(doc.GState({ opacity: 1 }))
  }

  // Report date
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.setGState(doc.GState({ opacity: 0.85 }))
  doc.text(safeText("RAPOR TARiHi"), pageWidth / 2, coverCardY + 40, { align: "center" })
  doc.setGState(doc.GState({ opacity: 1 }))

  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text(formatDate(new Date()), pageWidth / 2, coverCardY + 50, { align: "center" })

  // ============ NEW PAGE - CONTENT ============
  doc.addPage()
  let yPos = 0

  // Header gradient (reduced by 50%)
  addGradientRect(doc, 0, 0, pageWidth, 15, COLORS.primary, COLORS.accent)

  // Bank logo and name on left
  let leftStartX = margin
  if (bankLogo) {
    try {
      const logoSize = 6 // Reduced by 75% from 25
      doc.addImage(bankLogo, "PNG", margin, 2, logoSize, logoSize)
      leftStartX = margin + logoSize + 3
    } catch (error) {
    }
  } else {
  }

  // Bank name next to logo
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  const bankName = safeText(krediDetay?.banks?.name || "")
  if (bankName) {
    doc.text(bankName, leftStartX, 8)
  }

  // Title below bank info
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text("Erken Odeme Hesaplama", leftStartX, 13)

  // Date - right aligned
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.text(formatDate(new Date()), pageWidth - margin, 10, { align: "right" })

  yPos = 22

  // ============ METRIC CARDS (Matching pdf-generator dimensions) ============
  const cardWidth = (pageWidth - 2 * margin - 30) / 4
  const cardHeight = 17 // Reduced by 60% from 42
  const spacing = 10

  const metrics = [
    { title: "Erken Odeme", value: formatMoney(Number.parseFloat(hesaplamaForm.erkenOdemeTutari)), color: COLORS.primary },
    { title: "Tasarruf", value: formatMoney(hesaplamaResult.toplamTasarruf), color: COLORS.success },
    { title: "Yeni Borc", value: formatMoney(hesaplamaResult.yeniKalanBorc), color: COLORS.warning },
    { title: "Faiz Tasarrufu", value: formatMoney(hesaplamaResult.faizTasarrufu), color: COLORS.danger },
  ]

  metrics.forEach((metric, index) => {
    const x = margin + index * (cardWidth + spacing)

    // Card background
    doc.setFillColor(...COLORS.white)
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.5)
    doc.rect(x, yPos, cardWidth, cardHeight, "FD")

    // Top colored bar (reduced)
    doc.setFillColor(...metric.color)
    doc.rect(x, yPos, cardWidth, 1.2, "F")

    // Title (matching positions from pdf-generator)
    doc.setFontSize(5)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...COLORS.gray)
    doc.text(safeText(metric.title).toUpperCase(), x + 2, yPos + 6)

    // Value (matching size and position from pdf-generator)
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...COLORS.dark)
    doc.text(safeText(metric.value), x + 2, yPos + 12)
  })

  yPos += cardHeight + 5 // Adjusted spacing

  // ============ COMPARISON SECTION (Matching pdf-generator styling) ============
  doc.setFillColor(...COLORS.lightGray)
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 9, 2, 2, "F") // Reduced by 60%
  doc.setFillColor(...COLORS.secondary)
  doc.rect(margin, yPos, 2, 9, "F") // Reduced by 60%
  doc.setTextColor(...COLORS.dark)
  doc.setFontSize(7) // Reduced
  doc.setFont("helvetica", "bold")
  doc.text(safeText("DURUM KARSILASTIRMASI"), margin + 6, yPos + 6) // Adjusted position

  yPos += 11 // Adjusted spacing

  // Modern comparison table (matching pdf-generator)
  const totalWidth = pageWidth - 2 * margin
  const rowHeight = 8 // Reduced by 60% from 20
  const headerHeight = 10 // Reduced by 60% from 25

  // Header
  doc.setFillColor(...COLORS.secondary)
  doc.rect(margin, yPos, totalWidth, headerHeight, "F")

  doc.setTextColor(...COLORS.white)
  doc.setFontSize(7) // Increased by 2 points
  doc.setFont("helvetica", "bold")

  doc.text(safeText("DURUM"), margin + 3, yPos + 7) // Adjusted position
  doc.text(safeText("ANA PARA"), margin + 40, yPos + 7)
  doc.text(safeText("TOPLAM FAiZ"), margin + 80, yPos + 7)
  doc.text(safeText("TOPLAM ODEME"), margin + 120, yPos + 7)

  yPos += headerHeight

  // Row 1 - Mevcut
  doc.setFillColor(248, 248, 248)
  doc.rect(margin, yPos, totalWidth, rowHeight, "F")

  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.1)
  doc.line(margin, yPos + rowHeight, pageWidth - margin, yPos + rowHeight)

  doc.setTextColor(...COLORS.dark)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7) // Increased by 2 points

  doc.text(safeText("Mevcut"), margin + 3, yPos + 5.5) // Adjusted position
  doc.setTextColor(...COLORS.danger)
  doc.setFont("helvetica", "bold")
  doc.text(formatMoney(dynamicStats.remainingDebt), margin + 40, yPos + 5.5)
  doc.setTextColor(...COLORS.warning)
  doc.text(formatMoney(hesaplamaResult.eskiToplamFaiz), margin + 80, yPos + 5.5)
  doc.setTextColor(...COLORS.dark)
  doc.text(formatMoney(hesaplamaResult.eskiToplamOdeme), margin + 120, yPos + 5.5)

  yPos += rowHeight

  // Row 2 - Yeni
  doc.setTextColor(...COLORS.dark)
  doc.setFont("helvetica", "normal")
  doc.text(safeText("Yeni"), margin + 3, yPos + 5.5) // Adjusted position
  doc.setTextColor(...COLORS.success)
  doc.setFont("helvetica", "bold")
  doc.text(formatMoney(hesaplamaResult.kalanAnaPara), margin + 40, yPos + 5.5)
  doc.setTextColor(...COLORS.success)
  doc.text(formatMoney(hesaplamaResult.yeniToplamFaiz), margin + 80, yPos + 5.5)
  doc.setTextColor(...COLORS.dark)
  doc.text(formatMoney(hesaplamaResult.yeniToplamOdeme), margin + 120, yPos + 5.5)

  doc.setDrawColor(220, 220, 220)
  doc.line(margin, yPos + rowHeight, pageWidth - margin, yPos + rowHeight)

  // ============ MODERN FOOTER (Matching pdf-generator) ============
  addGradientRect(doc, 0, pageHeight - 8, pageWidth, 8, COLORS.primary, COLORS.accent)

  doc.setTextColor(...COLORS.white)
  doc.setFontSize(8)

  // Left - Website
  doc.setFont("helvetica", "bold")
  doc.text("kreditakip.com.tr", margin, pageHeight - 3)

  // Center - Tagline
  doc.setFont("helvetica", "normal")
  doc.text("Finansal ozgurluge giden yol", pageWidth / 2, pageHeight - 3, { align: "center" })

  // Right - Page number
  doc.setFont("helvetica", "bold")
  doc.text("1 / 1", pageWidth - margin, pageHeight - 3, { align: "right" })

  doc.save(`erken-odeme-hesaplama-${krediDetay?.credit_code}.pdf`)
}