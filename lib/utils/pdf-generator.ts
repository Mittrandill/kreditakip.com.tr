import { jsPDF } from "jspdf"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

// Modern renk paleti
const COLORS = {
  primary: [16, 185, 129] as [number, number, number], // Emerald
  secondary: [20, 184, 166] as [number, number, number], // Teal
  accent: [13, 148, 136] as [number, number, number], // Dark Teal
  success: [34, 197, 94] as [number, number, number], // Green
  warning: [251, 146, 60] as [number, number, number], // Orange
  danger: [239, 68, 68] as [number, number, number], // Red
  info: [59, 130, 246] as [number, number, number], // Blue
  dark: [30, 41, 59] as [number, number, number], // Slate-800
  gray: [100, 116, 139] as [number, number, number], // Slate-500
  lightGray: [241, 245, 249] as [number, number, number], // Slate-100
  white: [255, 255, 255] as [number, number, number],
}

// Banka logo yolları mapping
const BANK_LOGO_PATHS: Record<string, string> = {
  // Yapı Kredi variations
  "Yapı Kredi": "/bank-icons/yapi-kredi.png",
  "Yapı Kredi Bankası": "/bank-icons/yapi-kredi.png",
  "Yapı ve Kredi Bankası A.Ş.": "/bank-icons/yapi-kredi.png",
  "Yapı ve Kredi": "/bank-icons/yapi-kredi.png",
  YapıKredi: "/bank-icons/yapi-kredi.png",

  // Garanti variations
  Garanti: "/bank-icons/garanti.png",
  "Garanti BBVA": "/bank-icons/garanti.png",
  "Türkiye Garanti Bankası": "/bank-icons/garanti.png",
  "Türkiye Garanti Bankası A.Ş.": "/bank-icons/garanti.png",
  "Garanti Bankası": "/bank-icons/garanti.png",

  // Akbank variations
  Akbank: "/bank-icons/akbank.png",
  "Akbank T.A.Ş.": "/bank-icons/akbank.png",

  // İş Bankası variations
  "İş Bankası": "/bank-icons/is-bankasi.png",
  "Türkiye İş Bankası": "/bank-icons/is-bankasi.png",
  "Türkiye İş Bankası A.Ş.": "/bank-icons/is-bankasi.png",
  İşbank: "/bank-icons/is-bankasi.png",

  // Ziraat Bankası variations
  "Ziraat Bankası": "/bank-icons/ziraat.png",
  "T.C. Ziraat Bankası A.Ş.": "/bank-icons/ziraat.png",
  "TC Ziraat Bankası": "/bank-icons/ziraat.png",
  Ziraat: "/bank-icons/ziraat.png",

  // VakıfBank variations
  VakıfBank: "/bank-icons/vakifbank.png",
  "Türkiye Vakıflar Bankası": "/bank-icons/vakifbank.png",
  "Türkiye Vakıflar Bankası T.A.O.": "/bank-icons/vakifbank.png",
  "Vakıflar Bankası": "/bank-icons/vakifbank.png",
  "Vakıf Bankası": "/bank-icons/vakifbank.png",

  // Halkbank variations
  Halkbank: "/bank-icons/halkbank.png",
  "Türkiye Halk Bankası A.Ş.": "/bank-icons/halkbank.png",
  "Halk Bankası": "/bank-icons/halkbank.png",
  "T. Halk Bankası A.Ş.": "/bank-icons/halkbank.png",

  // DenizBank variations
  DenizBank: "/bank-icons/denizbank.png",
  "DenizBank A.Ş.": "/bank-icons/denizbank.png",
  Denizbank: "/bank-icons/denizbank.png",

  // Enpara Bank variations
  "Enpara Bank": "/bank-icons/enpara.png",
  "Enpara Bank A.Ş.": "/bank-icons/enpara.png",
  "Enpara.com": "/bank-icons/enpara.png",
  Enpara: "/bank-icons/enpara.png",

  // Fibabanka variations
  Fibabanka: "/bank-icons/fibabanka.png",
  "Fibabanka A.Ş.": "/bank-icons/fibabanka.png",

  // QNB Finansbank variations
  "QNB Finansbank": "/bank-icons/qnb.png",
  "QNB Finansbank A.Ş.": "/bank-icons/qnb.png",
  Finansbank: "/bank-icons/qnb.png",

  // TEB variations
  TEB: "/bank-icons/teb.png",
  "Türkiye Ekonomi Bankası A.Ş.": "/bank-icons/teb.png",
  "Türk Ekonomi Bankası": "/bank-icons/teb.png",

  // ING variations
  ING: "/bank-icons/ing.png",
  "ING Bank A.Ş.": "/bank-icons/ing.png",
  "ING Bank": "/bank-icons/ing.png",

  // Şekerbank variations
  "Şekerbank T.A.Ş.": "/bank-icons/sekerbank.png",
  Şekerbank: "/bank-icons/sekerbank.png",

  // Anadolubank variations
  "Anadolubank A.Ş.": "/bank-icons/anadolubank.png",
  Anadolubank: "/bank-icons/anadolubank.png",

  // Turkish Bank variations
  "Turkish Bank A.Ş.": "/bank-icons/turkish-bank.png",
  "Turkish Bank": "/bank-icons/turkish-bank.png",

  // Citibank variations
  "Citibank A.Ş.": "/bank-icons/citibank.png",
  Citibank: "/bank-icons/citibank.png",

  // Deutsche Bank variations
  "Deutsche Bank A.Ş.": "/bank-icons/deutsche-bank.png",
  "Deutsche Bank": "/bank-icons/deutsche-bank.png",

  // Alternatif Bank variations
  "Alternatif Bank A.Ş.": "/bank-icons/alternatif-bank.png",
  "Alternatif Bank": "/bank-icons/alternatif-bank.png",

  // Burgan Bank variations
  "Burgan Bank A.Ş.": "/bank-icons/burgan-bank.png",
  "Burgan Bank": "/bank-icons/burgan-bank.png",

  // ICBC Turkey Bank variations
  "ICBC Turkey Bank A.Ş.": "/bank-icons/icbc-turkey-bank.png",
  "ICBC Turkey Bank": "/bank-icons/icbc-turkey-bank.png",

  // MUFG Bank Turkey variations
  "MUFG Bank Turkey A.Ş.": "/bank-icons/mufg-bank-turkey.png",
  "MUFG Bank Turkey": "/bank-icons/mufg-bank-turkey.png",

  // Odeabank variations
  "Odeabank A.Ş.": "/bank-icons/odeabank.png",
  Odeabank: "/bank-icons/odeabank.png",

  // Rabobank variations
  "Rabobank A.Ş.": "/bank-icons/rabobank.png",
  Rabobank: "/bank-icons/rabobank.png",

  // HSBC variations
  "HSBC Bank A.Ş.": "/bank-icons/hsbc-bank.png",
  "HSBC Bank": "/bank-icons/hsbc-bank.png",
  HSBC: "/bank-icons/hsbc-bank.png",

  // Intesa Sanpaolo variations
  "Intesa Sanpaolo S.p.A.": "/bank-icons/intesa-sanpaolo.png",
  "Intesa Sanpaolo": "/bank-icons/intesa-sanpaolo.png",

  // Habib Bank variations
  "Habib Bank Limited": "/bank-icons/habib-bank-limited.png",
  "Habib Bank": "/bank-icons/habib-bank-limited.png",

  // Bank Mellat variations
  "Bank Mellat": "/bank-icons/bank-mellat.png",
  Mellat: "/bank-icons/bank-mellat.png",

  // JPMorgan Chase variations
  "JPMorgan Chase Bank N.A.": "/bank-icons/jpmorgan-chase-bank.png",
  "JPMorgan Chase": "/bank-icons/jpmorgan-chase-bank.png",
  JPMorgan: "/bank-icons/jpmorgan-chase-bank.png",

  // Société Générale variations
  "Société Générale (SA)": "/bank-icons/societe-generale.png",
  "Société Générale": "/bank-icons/societe-generale.png",

  // Katılım Bankaları
  "Ziraat Katılım Bankası A.Ş.": "/bank-icons/ziraat-katilim-bankasi.png",
  "Ziraat Katılım": "/bank-icons/ziraat-katilim-bankasi.png",

  "Vakıf Katılım Bankası A.Ş.": "/bank-icons/vakif-katilim-bankasi.png",
  "Vakıf Katılım": "/bank-icons/vakif-katilim-bankasi.png",

  "Türkiye Emlak Katılım Bankası A.Ş.": "/bank-icons/turkiye-emlak-katilim-bankasi.png",
  "Emlak Katılım": "/bank-icons/turkiye-emlak-katilim-bankasi.png",

  "Kuveyt Türk Katılım Bankası A.Ş.": "/bank-icons/kuveyt-turk-katilim-bankasi.png",
  "Kuveyt Türk": "/bank-icons/kuveyt-turk-katilim-bankasi.png",
  Albaraka: "/bank-icons/albaraka-turk-katilim-bankasi.png",

  "Türkiye Finans Katılım Bankası A.Ş.": "/bank-icons/turkiye-finans-katilim-bankasi.png",
  "Türkiye Finans": "/bank-icons/turkiye-finans-katilim-bankasi.png",

  "Hayat Finans Katılım Bankası A.Ş.": "/bank-icons/hayat-finans-katilim-bankasi.png",
  "Hayat Finans": "/bank-icons/hayat-finans-katilim-bankasi.png",

  "Dünya Katılım Bankası A.Ş.": "/bank-icons/dunya-katilim-bankasi.png",
  "Dünya Katılım": "/bank-icons/dunya-katilim-bankasi.png",

  // Kalkınma ve Yatırım Bankaları
  "İller Bankası A.Ş.": "/bank-icons/iller-bankasi.png",
  "İller Bankası": "/bank-icons/iller-bankasi.png",
  İlbank: "/bank-icons/iller-bankasi.png",

  "Türk Eximbank": "/bank-icons/turk-eximbank.png",
  Eximbank: "/bank-icons/turk-eximbank.png",

  "Türkiye Kalkınma ve Yatırım Bankası A.Ş.": "/bank-icons/turkiye-kalkinma-ve-yatirim-bankasi.png",
  "Kalkınma Bankası": "/bank-icons/turkiye-kalkinma-ve-yatirim-bankasi.png",
  TKYB: "/bank-icons/turkiye-kalkinma-ve-yatirim-bankasi.png",

  "Türkiye Sınai Kalkınma Bankası A.Ş.": "/bank-icons/turkiye-sinai-kalkinma-bankasi.png",
  "Sınai Kalkınma": "/bank-icons/turkiye-sinai-kalkinma-bankasi.png",
  TSKB: "/bank-icons/turkiye-sinai-kalkinma-bankasi.png",

  "Aktif Yatırım Bankası A.Ş.": "/bank-icons/aktif-yatirim-bankasi.png",
  "Aktif Yatırım": "/bank-icons/aktif-yatirim-bankasi.png",

  "Nurol Yatırım Bankası A.Ş.": "/bank-icons/nurol-yatirim-bankasi.png",
  "Nurol Yatırım": "/bank-icons/nurol-yatirim-bankasi.png",

  "Pasha Yatırım Bankası A.Ş.": "/bank-icons/pasha-yatirim-bankasi.png",
  "PASHA Yatırım Bankası A.Ş.": "/bank-icons/pasha-yatirim-bankasi.png",
  "Pasha Yatırım": "/bank-icons/pasha-yatirim-bankasi.png",

  "BankPozitif Kredi ve Kalkınma Bankası A.Ş.": "/bank-icons/bankpozitif-kredi-ve-kalkinma-bankasi.png",
  BankPozitif: "/bank-icons/bankpozitif-kredi-ve-kalkinma-bankasi.png",

  "Merrill Lynch Yatırım Bank A.Ş.": "/bank-icons/merrill-lynch-yatirim-bank.png",
  "Merrill Lynch": "/bank-icons/merrill-lynch-yatirim-bank.png",

  "Golden Global Yatırım Bankası A.Ş.": "/bank-icons/golden-global-yatirim-bankasi.png",
  "Golden Global": "/bank-icons/golden-global-yatirim-bankasi.png",

  "GSD Yatırım Bankası A.Ş.": "/bank-icons/gsd-yatirim-bankasi.png",
  "GSD Yatırım": "/bank-icons/gsd-yatirim-bankasi.png",
  GSD: "/bank-icons/gsd-yatirim-bankasi.png",

  "İstanbul Takas ve Saklama Bankası A.Ş.": "/bank-icons/istanbul-takas-ve-saklama-bankasi.png",
  "İstanbul Takas": "/bank-icons/istanbul-takas-ve-saklama-bankasi.png",
  Takasbank: "/bank-icons/istanbul-takas-ve-saklama-bankasi.png",

  "Diler Yatırım Bankası A.Ş.": "/bank-icons/diler-yatirim-bankasi.png",
  "Diler Yatırım": "/bank-icons/diler-yatirim-bankasi.png",

  "Standard Chartered Yatırım Bankası Türk A.Ş.": "/bank-icons/standard-chartered-yatirim-bankasi-turk.png",
  "Standard Chartered": "/bank-icons/standard-chartered-yatirim-bankasi-turk.png",

  // Dijital Bankalar
  "Colendi Bank A.Ş.": "/bank-icons/colendi-bank.png",
  "Colendi Bank": "/bank-icons/colendi-bank.png",
  Colendi: "/bank-icons/colendi-bank.png",

  // TMSF Bankaları
  "Adabank A.Ş.": "/bank-icons/adabank.png",
  Adabank: "/bank-icons/adabank.png",

  "Birleşik Fon Bankası A.Ş.": "/bank-icons/birlesik-fon-bankasi.png",
  "Birleşik Fon": "/bank-icons/birlesik-fon-bankasi.png",

  "Türk Ticaret Bankası A.Ş.": "/bank-icons/turk-ticaret-bankasi.png",
  "Türk Ticaret": "/bank-icons/turk-ticaret-bankasi.png",
}

// Türkçe karakterleri güvenli hale getir
const safeText = (text: string | number | null | undefined): string => {
  if (text === null || text === undefined) return ""
  // jsPDF Türkçe karakterleri desteklemediği için Latin karşılıklarını kullan
  return String(text)
    .replace(/ğ/g, "g")
    .replace(/Ğ/g, "G")
    .replace(/ü/g, "u")
    .replace(/Ü/g, "U")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "S")
    .replace(/ı/g, "i")
    .replace(/İ/g, "I")
    .replace(/ö/g, "o")
    .replace(/Ö/g, "O")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "C")
}

const formatCurrency = (amount: number): string => {
  return (
    new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + " TL"
  )
}

class ModernPDFGenerator {
  private doc: jsPDF
  private pageWidth: number
  private pageHeight: number
  private margin: number
  private currentY: number
  private data: any
  private pageNumber = 1

  constructor(doc: jsPDF, data: any) {
    this.doc = doc
    this.pageWidth = doc.internal.pageSize.getWidth()
    this.pageHeight = doc.internal.pageSize.getHeight()
    this.margin = 25
    this.currentY = this.margin
    this.data = data
  }

  private addGradientRect(
    x: number,
    y: number,
    width: number,
    height: number,
    startColor: [number, number, number],
    endColor: [number, number, number],
  ) {
    const steps = 20
    const stepHeight = height / steps

    for (let i = 0; i < steps; i++) {
      const ratio = i / steps
      const r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * ratio)
      const g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * ratio)
      const b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * ratio)

      this.doc.setFillColor(r, g, b)
      this.doc.rect(x, y + i * stepHeight, width, stepHeight + 0.5, "F")
    }
  }

  private addModernHeader() {
    // Gradient arka plan
    this.addGradientRect(0, 0, this.pageWidth, 80, COLORS.primary, COLORS.accent)

    // Dekoratif daireler
    this.doc.setFillColor(255, 255, 255)
    this.doc.setGState(this.doc.GState({ opacity: 0.1 }))
    for (let i = 0; i < 5; i++) {
      this.doc.circle(this.pageWidth - 50 - i * 30, 40, 60, "F")
    }
    this.doc.setGState(this.doc.GState({ opacity: 1 }))

    // Logo placeholder
    this.doc.setFillColor(...COLORS.white)
    this.doc.roundedRect(this.margin, 25, 30, 30, 3, 3, "F")
    this.doc.setTextColor(...COLORS.primary)
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("KT", this.margin + 15, 43, { align: "center" })

    // Başlık
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(22)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(safeText("KREDI PORTFOY RAPORU"), this.margin + 45, 40)

    this.doc.setFontSize(11)
    this.doc.setFont("helvetica", "normal")
    this.doc.text(safeText("Detaylı Finansal Analiz"), this.margin + 45, 55)

    // Sağ taraf bilgileri
    const rightX = this.pageWidth - this.margin - 100
    this.doc.setFontSize(10)
    this.doc.setTextColor(...COLORS.white)
    const dateStr = format(new Date(), "dd MMMM yyyy", { locale: tr })
    this.doc.text(safeText(dateStr), rightX, 35)

    if (this.data.userData?.name) {
      this.doc.setFont("helvetica", "bold")
      this.doc.text(safeText(this.data.userData.name), rightX, 50)
    }

    this.currentY = 100
  }

  private addModernMetricCards(
    metrics: Array<{
      title: string
      value: string
      subtitle?: string
      color?: keyof typeof COLORS
      icon?: string
    }>,
  ) {
    this.checkPageBreak(80)

    const cardWidth = (this.pageWidth - 2 * this.margin - 30) / 4
    const cardHeight = 70

    metrics.forEach((metric, index) => {
      const x = this.margin + index * (cardWidth + 10)
      const color = COLORS[metric.color || "primary"]

      // Kart arka planı
      this.doc.setFillColor(...COLORS.white)
      this.doc.setDrawColor(230, 230, 230)
      this.doc.roundedRect(x, this.currentY, cardWidth, cardHeight, 4, 4, "FD")

      // Üst renkli çizgi
      this.doc.setFillColor(...color)
      this.doc.rect(x, this.currentY, cardWidth, 3, "F")

      // İkon arka planı
      if (metric.icon) {
        this.doc.setFillColor(...color)
        this.doc.setGState(this.doc.GState({ opacity: 0.1 }))
        this.doc.circle(x + cardWidth - 20, this.currentY + 25, 15, "F")
        this.doc.setGState(this.doc.GState({ opacity: 1 }))

        this.doc.setTextColor(...color)
        this.doc.setFontSize(16)
        this.doc.text(metric.icon, x + cardWidth - 20, this.currentY + 30, { align: "center" })
      }

      // Başlık
      this.doc.setFontSize(9)
      this.doc.setFont("helvetica", "normal")
      this.doc.setTextColor(...COLORS.gray)
      this.doc.text(safeText(metric.title).toUpperCase(), x + 10, this.currentY + 20)

      // Değer
      this.doc.setFontSize(18)
      this.doc.setFont("helvetica", "bold")
      this.doc.setTextColor(...COLORS.dark)
      this.doc.text(safeText(metric.value), x + 10, this.currentY + 40)

      // Alt başlık
      if (metric.subtitle) {
        this.doc.setFontSize(8)
        this.doc.setFont("helvetica", "normal")
        this.doc.setTextColor(...COLORS.gray)
        this.doc.text(safeText(metric.subtitle), x + 10, this.currentY + 55)
      }
    })

    this.currentY += cardHeight + 30
  }

  private addModernSection(title: string, icon = "", color: keyof typeof COLORS = "primary") {
    this.checkPageBreak(40)

    // Bölüm başlığı
    this.doc.setFillColor(...COLORS.lightGray)
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 35, 5, 5, "F")

    // Renkli vurgu çizgisi
    this.doc.setFillColor(...COLORS[color])
    this.doc.roundedRect(this.margin, this.currentY, 4, 35, 2, 2, "F")

    // İkon
    if (icon) {
      this.doc.setTextColor(...COLORS[color])
      this.doc.setFontSize(18)
      this.doc.text(icon, this.margin + 15, this.currentY + 22)
    }

    // Başlık
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(safeText(title), this.margin + (icon ? 35 : 15), this.currentY + 22)

    this.currentY += 45
  }

  private addModernTable(
    headers: string[],
    rows: string[][],
    options?: {
      headerColor?: keyof typeof COLORS
      alternateRows?: boolean
      columnWidths?: number[]
    },
  ) {
    const opts = {
      headerColor: "primary" as keyof typeof COLORS,
      alternateRows: true,
      ...options,
    }

    const totalWidth = this.pageWidth - 2 * this.margin
    const colWidths = opts.columnWidths || headers.map(() => totalWidth / headers.length)
    const rowHeight = 35
    const headerHeight = 40

    this.checkPageBreak(headerHeight + rows.length * rowHeight)

    // Tablo başlığı gradient
    this.addGradientRect(this.margin, this.currentY, totalWidth, headerHeight, COLORS[opts.headerColor], COLORS.accent)

    // Başlık metinleri
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(11)
    this.doc.setFont("helvetica", "bold")

    let xPos = this.margin
    headers.forEach((header, i) => {
      this.doc.text(safeText(header).toUpperCase(), xPos + 15, this.currentY + 25)
      xPos += colWidths[i]
    })

    this.currentY += headerHeight

    // Tablo satırları
    rows.forEach((row, rowIndex) => {
      // Alternatif satır renkleri
      if (opts.alternateRows && rowIndex % 2 === 0) {
        this.doc.setFillColor(248, 250, 252)
        this.doc.rect(this.margin, this.currentY, totalWidth, rowHeight, "F")
      }

      // Alt çizgi
      this.doc.setDrawColor(230, 230, 230)
      this.doc.setLineWidth(0.5)
      this.doc.line(this.margin, this.currentY + rowHeight, this.pageWidth - this.margin, this.currentY + rowHeight)

      // Satır içeriği
      xPos = this.margin
      row.forEach((cell, colIndex) => {
        // Tutar sütunu için özel renklendirme
        if (cell.includes("TL")) {
          this.doc.setTextColor(...COLORS.primary)
          this.doc.setFont("helvetica", "bold")
        } else {
          this.doc.setTextColor(...COLORS.dark)
          this.doc.setFont("helvetica", "normal")
        }

        this.doc.setFontSize(10)
        this.doc.text(safeText(cell), xPos + 15, this.currentY + 22)
        xPos += colWidths[colIndex]
      })

      this.currentY += rowHeight
    })

    this.currentY += 20
  }

  private addCreditCard(credit: any, index: number) {
    this.checkPageBreak(180)

    // Kart konteyneri
    this.doc.setFillColor(...COLORS.white)
    this.doc.setDrawColor(220, 220, 220)
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 160, 8, 8, "FD")

    // Gradient başlık
    this.addGradientRect(
      this.margin,
      this.currentY,
      this.pageWidth - 2 * this.margin,
      35,
      COLORS.primary,
      COLORS.secondary,
    )

    // Banka logosu yerine baş harfler
    const bankName = credit.bankName || "Bilinmeyen Banka"
    this.addBankInitials(bankName, this.margin + 25, this.currentY + 18)

    // Banka adı ve kredi türü
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(safeText(`${bankName} - ${credit.creditType || "Kredi"}`), this.margin + 45, this.currentY + 22)

    // Durum rozeti
    const statusX = this.pageWidth - this.margin - 60
    if (credit.status === "active") {
      this.doc.setFillColor(236, 253, 245)
      this.doc.roundedRect(statusX, this.currentY + 10, 50, 18, 9, 9, "F")
      this.doc.setTextColor(...COLORS.success)
      this.doc.setFontSize(9)
      this.doc.text("AKTIF", statusX + 25, this.currentY + 21, { align: "center" })
    } else {
      this.doc.setFillColor(243, 244, 246)
      this.doc.roundedRect(statusX, this.currentY + 10, 50, 18, 9, 9, "F")
      this.doc.setTextColor(...COLORS.gray)
      this.doc.text("KAPALI", statusX + 25, this.currentY + 21, { align: "center" })
    }

    this.currentY += 45

    // İçerik alanı
    const contentY = this.currentY
    const leftX = this.margin + 20
    const centerX = this.margin + (this.pageWidth - 2 * this.margin) / 3
    const rightX = this.margin + (2 * (this.pageWidth - 2 * this.margin)) / 3

    // Hesaplamalar
    const paidAmount = (credit.amount || 0) - (credit.remainingDebt || 0)
    const progressPercentage = credit.amount ? (paidAmount / credit.amount) * 100 : 0

    // İlerleme çubuğu - genişlik hesaplaması düzeltildi
    const progressBarWidth = this.pageWidth - 2 * this.margin - 40
    this.doc.setFillColor(...COLORS.lightGray)
    this.doc.roundedRect(leftX, contentY, progressBarWidth, 8, 4, 4, "F")

    if (progressPercentage > 0) {
      this.doc.setFillColor(...COLORS.primary)
      const fillWidth = Math.min((progressBarWidth * progressPercentage) / 100, progressBarWidth)
      this.doc.roundedRect(leftX, contentY, fillWidth, 8, 4, 4, "F")
    }

    // İlerleme metni
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(9)
    this.doc.text(safeText(`%${progressPercentage.toFixed(1)} Odendi`), leftX, contentY - 5)

    this.currentY = contentY + 20

    // Sol sütun - tutarlar
    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(9)
    this.doc.text("KREDI TUTARI", leftX, this.currentY)
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(safeText(formatCurrency(credit.amount || 0)), leftX, this.currentY + 15)

    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("KALAN BORC", leftX, this.currentY + 35)
    this.doc.setTextColor(...COLORS.danger)
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(safeText(formatCurrency(credit.remainingDebt || 0)), leftX, this.currentY + 50)

    // Orta sütun - taksitler
    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("AYLIK ODEME", centerX, this.currentY)
    this.doc.setTextColor(...COLORS.warning)
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(safeText(formatCurrency(credit.monthlyPayment || 0)), centerX, this.currentY + 15)

    if (credit.totalInstallments) {
      this.doc.setTextColor(...COLORS.gray)
      this.doc.setFontSize(9)
      this.doc.setFont("helvetica", "normal")
      this.doc.text("TAKSIT", centerX, this.currentY + 35)
      this.doc.setTextColor(...COLORS.dark)
      this.doc.setFontSize(14)
      this.doc.setFont("helvetica", "bold")
      const paidInstallments = credit.totalInstallments - (credit.remainingInstallments || 0)
      this.doc.text(`${paidInstallments} / ${credit.totalInstallments}`, centerX, this.currentY + 50)
    }

    // Sağ sütun - faiz ve tarihler
    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("FAIZ ORANI", rightX, this.currentY)
    this.doc.setTextColor(...COLORS.info)
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(`%${(credit.interestRate || 0).toFixed(2)}`, rightX, this.currentY + 15)

    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("AYLIK FAIZ", rightX, this.currentY + 35)
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    const monthlyInterestValue = ((credit.remainingDebt || 0) * (credit.interestRate || 0)) / 1200
    this.doc.text(safeText(formatCurrency(monthlyInterestValue)), rightX, this.currentY + 50)

    this.currentY = contentY + 115
  }

  private addBankInitials(bankName: string, x: number, y: number) {
    this.doc.setFillColor(...COLORS.white)
    this.doc.circle(x, y, 12, "F")
    this.doc.setTextColor(...COLORS.primary)
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "bold")
    const initials = bankName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
    this.doc.text(initials, x, y + 4, { align: "center" })
  }

  private addSummarySection() {
    this.checkPageBreak(120)

    // Özet kutusu
    this.doc.setFillColor(248, 250, 252)
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 100, 8, 8, "F")

    // İkon ve başlık
    this.doc.setTextColor(...COLORS.primary)
    this.doc.setFontSize(20)
    this.doc.text("📊", this.margin + 20, this.currentY + 25)

    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(safeText("Ozet Bilgiler"), this.margin + 45, this.currentY + 25)

    // Özet bilgiler
    const summaryY = this.currentY + 45
    const leftCol = this.margin + 30
    const rightCol = this.pageWidth / 2

    const totalInterest =
      this.data.credits?.reduce((sum: number, credit: any) => {
        const monthlyInterest = ((credit.remainingDebt || 0) * (credit.interestRate || 0)) / 1200
        return sum + monthlyInterest * 12
      }, 0) || 0

    const avgRate =
      this.data.credits?.length > 0
        ? this.data.credits.reduce((sum: number, c: any) => sum + (c.interestRate || 0), 0) / this.data.credits.length
        : 0

    // Sol sütun
    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "normal")
    this.doc.text(safeText("• Toplam Kredi Sayisi:"), leftCol, summaryY)
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(` ${this.data.totalCredits || 0} adet`, leftCol + 80, summaryY)

    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFont("helvetica", "normal")
    this.doc.text(safeText("• Ortalama Faiz Orani:"), leftCol, summaryY + 20)
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(` %${avgRate.toFixed(2)}`, leftCol + 80, summaryY + 20)

    // Sağ sütun
    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFont("helvetica", "normal")
    this.doc.text(safeText("• Yillik Toplam Faiz:"), rightCol, summaryY)
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(safeText(` ${formatCurrency(totalInterest)}`), rightCol + 70, summaryY)

    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFont("helvetica", "normal")
    this.doc.text(safeText("• Aylik Odeme Yuku:"), rightCol, summaryY + 20)
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(safeText(` ${formatCurrency(this.data.monthlyPayment || 0)}`), rightCol + 70, summaryY + 20)

    this.currentY += 120
  }

  private addModernFooter() {
    const pageCount = this.doc.internal.getNumberOfPages()

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)

      // Footer gradient
      this.addGradientRect(0, this.pageHeight - 30, this.pageWidth, 30, COLORS.primary, COLORS.accent)

      // Sol - marka
      this.doc.setTextColor(...COLORS.white)
      this.doc.setFontSize(9)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("kreditakip.com.tr", this.margin, this.pageHeight - 12)

      // Orta - slogan
      this.doc.setFont("helvetica", "normal")
      this.doc.text(safeText("Finansal ozgurlugunuza giden yol"), this.pageWidth / 2, this.pageHeight - 12, {
        align: "center",
      })

      // Sağ - sayfa numarası
      this.doc.setFont("helvetica", "bold")
      this.doc.text(`${i} / ${pageCount}`, this.pageWidth - this.margin, this.pageHeight - 12, { align: "right" })
    }
  }

  private checkPageBreak(height: number) {
    if (this.currentY + height > this.pageHeight - 40) {
      this.addPage()
    }
  }

  private addPage() {
    this.doc.addPage()
    this.pageNumber++
    this.currentY = this.margin + 20
  }

  private calculateBankDistribution() {
    if (!this.data.credits || this.data.credits.length === 0) return []

    const bankMap = new Map()
    let totalAmount = 0

    this.data.credits.forEach((credit: any) => {
      const bankName = credit.bankName || "Bilinmeyen"
      const amount = credit.remainingDebt || 0
      totalAmount += amount

      if (bankMap.has(bankName)) {
        const existing = bankMap.get(bankName)
        existing.count += 1
        existing.amount += amount
      } else {
        bankMap.set(bankName, { name: bankName, count: 1, amount })
      }
    })

    return Array.from(bankMap.values())
      .map((bank) => ({
        ...bank,
        percentage: totalAmount > 0 ? (bank.amount / totalAmount) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
  }

  private calculateCreditTypeDistribution() {
    if (!this.data.credits || this.data.credits.length === 0) return []

    const typeMap = new Map()
    let totalAmount = 0

    this.data.credits.forEach((credit: any) => {
      const creditType = credit.creditType || "Diger"
      const amount = credit.remainingDebt || 0
      totalAmount += amount

      if (typeMap.has(creditType)) {
        const existing = typeMap.get(creditType)
        existing.count += 1
        existing.amount += amount
      } else {
        typeMap.set(creditType, { type: creditType, count: 1, amount })
      }
    })

    return Array.from(typeMap.values())
      .map((type) => ({
        ...type,
        percentage: totalAmount > 0 ? (type.amount / totalAmount) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
  }

  public async generate() {
    try {
      // Modern header
      this.addModernHeader()

      // Özet metrikleri
      const metrics = [
        {
          title: "Toplam Kredi",
          value: this.data.totalCredits?.toString() || "0",
          subtitle: `${this.data.activeCredits || 0} aktif`,
          color: "primary" as keyof typeof COLORS,
          icon: "📋",
        },
        {
          title: "Toplam Borc",
          value: safeText(formatCurrency(this.data.totalDebt || 0)),
          subtitle: "Kalan",
          color: "danger" as keyof typeof COLORS,
          icon: "💰",
        },
        {
          title: "Aylik Odeme",
          value: safeText(formatCurrency(this.data.monthlyPayment || 0)),
          subtitle: "Taksit",
          color: "warning" as keyof typeof COLORS,
          icon: "📅",
        },
        {
          title: "Toplam Kredi",
          value: safeText(formatCurrency(this.data.totalPayment || 0)),
          subtitle: "Baslangic",
          color: "success" as keyof typeof COLORS,
          icon: "✓",
        },
      ]

      this.addModernMetricCards(metrics)

      // Kredi detayları
      if (this.data.credits && this.data.credits.length > 0) {
        this.addModernSection("Kredi Detaylari", "💳", "primary")

        for (const [index, credit] of this.data.credits.entries()) {
          this.addCreditCard(credit, index)
          this.currentY += 20
        }
      }

      // Banka dağılımı
      this.addModernSection("Banka Dagilimi", "🏦", "info")
      const bankDist = this.calculateBankDistribution()
      if (bankDist.length > 0) {
        const headers = ["Banka", "Adet", "Toplam Borc", "Oran"]
        const rows = bankDist.map((b) => [
          b.name,
          b.count.toString(),
          formatCurrency(b.amount),
          `%${b.percentage.toFixed(1)}`,
        ])
        this.addModernTable(headers, rows, {
          headerColor: "info",
          columnWidths: [180, 60, 140, 80],
        })
      }

      // Kredi türü dağılımı
      this.addModernSection("Kredi Turu Dagilimi", "📊", "secondary")
      const typeDist = this.calculateCreditTypeDistribution()
      if (typeDist.length > 0) {
        const headers = ["Kredi Turu", "Adet", "Toplam Tutar", "Oran"]
        const rows = typeDist.map((t) => [
          t.type,
          t.count.toString(),
          formatCurrency(t.amount),
          `%${t.percentage.toFixed(1)}`,
        ])
        this.addModernTable(headers, rows, {
          headerColor: "secondary",
          columnWidths: [120, 100, 70, 85, 85],
        })
      }

      // Faiz analizi
      if (this.data.credits && this.data.credits.length > 0) {
        this.addModernSection("Faiz Analizi", "💸", "warning")
        const headers = ["Banka", "Kredi Turu", "Faiz Orani", "Aylik Faiz", "Yillik Faiz"]
        const rows = this.data.credits.map((credit: any) => {
          const monthlyInterest = ((credit.remainingDebt || 0) * (credit.interestRate || 0)) / 1200
          const yearlyInterest = monthlyInterest * 12
          return [
            credit.bankName || "Bilinmeyen",
            credit.creditType || "Diger",
            `%${(credit.interestRate || 0).toFixed(2)}`,
            formatCurrency(monthlyInterest),
            formatCurrency(yearlyInterest),
          ]
        })
        this.addModernTable(headers, rows, {
          headerColor: "warning",
          columnWidths: [120, 100, 70, 85, 85],
        })
      }

      // Özet bölümü
      this.addModernSection("Rapor Ozeti", "📊", "success")
      this.addSummarySection()

      // Footer ekle
      this.addModernFooter()
    } catch (error) {
      console.error("PDF olusturma hatasi:", error)
      throw error
    }
  }
}

// Ana export fonksiyonu
export async function generateModernPDF(data: any): Promise<void> {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    })

    const generator = new ModernPDFGenerator(doc, data)
    await generator.generate()

    const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm", { locale: tr })
    const filename = `kredi-raporu-${timestamp}.pdf`

    doc.save(filename)

    console.log("PDF basariyla olusturuldu:", filename)
  } catch (error) {
    console.error("PDF olusturma hatasi:", error)
    throw error
  }
}

export async function generatePDFReport(data: any): Promise<void> {
  return generateModernPDF(data)
}
