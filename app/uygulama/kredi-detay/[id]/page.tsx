"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BankLogo from "@/components/bank-logo"
import { PaginationModern } from "@/components/ui/pagination-modern"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Legend,
} from "recharts"
import {
  CreditCard,
  ArrowLeft,
  Download,
  Calculator,
  Calendar,
  TrendingUp,
  CheckCircle,
  Building,
  Clock,
  FileText,
  Banknote,
  Target,
  History,
  BarChart3,
  Settings,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Trash2,
  ChevronDown,
  Edit,
  MoreVertical,
  Phone,
  Mail,
  Globe,
  ExternalLink,
  Wallet,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/hooks/use-auth"
import { getCreditById } from "@/lib/api/credits"
import {
  getPaymentPlans,
  getPaymentHistory,
  updatePaymentPlan as apiUpdatePaymentPlan,
  createPaymentHistory,
  deletePaymentHistory,
} from "@/lib/api/payments"
import type { Credit, Bank, CreditType, PaymentPlan, PaymentHistory } from "@/lib/types"
import { formatCurrency, formatPercent } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LoadingSpinner } from "@/components/loading-screen"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface PopulatedCredit extends Credit {
  banks: Pick<Bank, "id" | "name" | "logo_url" | "contact_phone" | "contact_email" | "website"> | null
  credit_types: Pick<CreditType, "id" | "name" | "description"> | null
}

// Grafik verileri için varsayılanlar
const defaultBorcGrafigi = Array.from({ length: 6 }, (_, i) => ({
  ay: new Date(0, i).toLocaleString("default", { month: "short" }),
  kalanBorc: 0,
  odenenTutar: 0,
}))

const defaultFaizAnaParaDagilimi = [
  { name: "Ana Para", value: 0, fill: "hsl(174, 72%, 40%)" },
  { name: "Faiz", value: 0, fill: "hsl(174, 65%, 56%)" },
]

export default function KrediDetayPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const creditId = params.id as string

  const [krediDetay, setKrediDetay] = useState<PopulatedCredit | null>(null)
  const [odemePlani, setOdemePlani] = useState<PaymentPlan[]>([])
  const [odemeGecmisi, setOdemeGecmisi] = useState<PaymentHistory[]>([])

  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState("genel")

  // Dinamik hesaplamalar için state'ler
  const [dynamicStats, setDynamicStats] = useState({
    remainingDebt: 0,
    remainingInstallments: 0,
    paymentProgress: 0,
    paidInstallments: 0,
  })

  // Ödeme Planı Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  // Ödeme Geçmişi Pagination
  const [currentPageHistory, setCurrentPageHistory] = useState(1)
  const itemsPerPageHistory = 6

  // Grafik state'leri
  const [borcGrafigi, setBorcGrafigi] = useState(defaultBorcGrafigi)
  const [faizAnaParaDagilimi, setFaizAnaParaDagilimi] = useState(defaultFaizAnaParaDagilimi)

  // Modal state'leri
  const [hesaplaModalOpen, setHesaplaModalOpen] = useState(false)
  const [odemeModalOpen, setOdemeModalOpen] = useState(false)
  const [raporLoading, setRaporLoading] = useState(false)

  // Hesaplama form state'leri
  const [hesaplamaForm, setHesaplamaForm] = useState({
    erkenOdemeTutari: "",
    yeniVadeTarihi: "",
    hesaplamaTuru: "erken-odeme",
  })

  // Hesaplama sonuçları için state
  const [hesaplamaResult, setHesaplamaResult] = useState<{
    yeniKalanBorc: number
    faizTasarrufu: number
    yeniVadeTarihi: string
    yeniAylikOdeme: number
    eskiToplamOdeme: number
    eskiToplamFaiz: number
    yeniToplamOdeme: number
    yeniToplamFaiz: number
    toplamTasarruf: number
    kalanAnaPara: number
    odenenAnaPara: number
  } | null>(null)
  const [hesaplamaStep, setHesaplamaStep] = useState(1)

  // Ödeme form state'leri
  const [odemeForm, setOdemeForm] = useState({
    odemeTutari: 0, // Başlangıçta 0 olsun, sonra güncellenecek
    odemeKanali: "banka-havalesi",
    aciklama: "",
  })

  // Bildirim ayarları state'leri
  const [notificationSettings, setNotificationSettings] = useState({
    paymentReminder: true,
    interestRateChange: true,
    monthlyReport: false,
  })

  // Ödeme Planı Pagination Logic
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = odemePlani.slice(startIndex, endIndex)
  const totalItems = odemePlani.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  // Ödeme Geçmişi Pagination Logic
  const startIndexHistory = (currentPageHistory - 1) * itemsPerPageHistory
  const endIndexHistory = startIndexHistory + itemsPerPageHistory
  const currentHistoryItems = odemeGecmisi.slice(startIndexHistory, endIndexHistory)
  const totalHistoryItems = odemeGecmisi.length
  const totalHistoryPages = Math.ceil(totalHistoryItems / itemsPerPageHistory)

  useEffect(() => {
    let isMounted = true // Bileşenin bağlı olup olmadığını takip et

    async function fetchData() {
      if (user && creditId && isMounted) {
        // user ve isMounted kontrolü
        setLoadingData(true)
        setError(null)
        try {
          const [creditData, paymentPlansData, paymentHistoryData] = await Promise.all([
            getCreditById(creditId, user.id) as Promise<PopulatedCredit>,
            getPaymentPlans(creditId) as Promise<PaymentPlan[]>,
            getPaymentHistory(creditId) as Promise<PaymentHistory[]>,
          ])

          if (isMounted) {
            // State güncellemeden önce kontrol et
            setKrediDetay(creditData)
            setOdemePlani(paymentPlansData || [])
            setOdemeGecmisi(paymentHistoryData || [])

            if (paymentPlansData && paymentPlansData.length > 0) {
              const samplePlan = paymentPlansData.slice(0, 6).map((p, i) => ({
                ay: new Date(p.due_date).toLocaleString("tr-TR", { month: "short" }),
                kalanBorc: p.remaining_debt,
                odenenTutar: creditData.initial_amount - p.remaining_debt,
              }))
              setBorcGrafigi(samplePlan.length > 0 ? samplePlan : defaultBorcGrafigi)

              const totalPrincipal = paymentPlansData.reduce((sum, p) => sum + p.principal_amount, 0)
              const totalInterest = paymentPlansData.reduce((sum, p) => sum + p.interest_amount, 0)
              if (totalPrincipal > 0 || totalInterest > 0) {
                setFaizAnaParaDagilimi([
                  { name: "Ana Para", value: totalPrincipal, fill: "hsl(174, 72%, 40%)" },
                  { name: "Faiz", value: totalInterest, fill: "hsl(174, 65%, 56%)" },
                ])
              } else {
                setFaizAnaParaDagilimi(defaultFaizAnaParaDagilimi)
              }
            }
          }
        } catch (err) {
          console.error("Kredi detay data fetch error:", err)
          if (isMounted) {
            setError("Kredi detayları yüklenirken bir hata oluştu.")
          }
        } finally {
          if (isMounted) {
            setLoadingData(false)
          }
        }
      } else if (!authLoading && !user && isMounted) {
        setLoadingData(false)
        setError("Lütfen giriş yapınız.")
      }
    }
    fetchData()

    return () => {
      isMounted = false // Bileşen ayrıldığında flag'i false yap
    }
  }, [user, creditId, authLoading]) // user olarak değiştirildi

  // Ödeme form'unu güncelle - en yakın ödenmemiş taksit tutarını al
  useEffect(() => {
    if (odemePlani.length > 0) {
      const nextUnpaidInstallment = odemePlani
        .filter((p) => p.status === "pending")
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]

      if (nextUnpaidInstallment) {
        setOdemeForm((prev) => ({
          ...prev,
          odemeTutari: nextUnpaidInstallment.total_payment,
        }))
      }
    }
  }, [odemePlani])

  // Ödeme planı değiştiğinde hesaplamaları güncelle
  useEffect(() => {
    if (odemePlani.length > 0 && krediDetay) {
      const paidCount = odemePlani.filter((p) => p.status === "paid").length
      const remainingCount = odemePlani.length - paidCount
      const lastPaidPlan = odemePlani
        .filter((p) => p.status === "paid")
        .sort((a, b) => b.installment_number - a.installment_number)[0]

      const currentRemainingDebt = lastPaidPlan ? lastPaidPlan.remaining_debt : krediDetay.initial_amount
      const progress = (paidCount / odemePlani.length) * 100

      setDynamicStats({
        remainingDebt: currentRemainingDebt,
        remainingInstallments: remainingCount,
        paymentProgress: progress,
        paidInstallments: paidCount,
      })
    }
  }, [odemePlani, krediDetay])

  const getStatusBadgeClass = (durum: string) => {
    const variants = {
      paid: "bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-transparent hover:from-emerald-700 hover:to-teal-800",
      overdue:
        "bg-gradient-to-r from-red-600 to-rose-700 text-white border-transparent hover:from-red-700 hover:to-rose-800",
      pending:
        "bg-gradient-to-r from-orange-600 to-amber-700 text-white border-transparent hover:from-orange-700 hover:to-amber-800",
    }
    return (
      variants[durum as keyof typeof variants] ||
      "bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-transparent hover:from-blue-700 hover:to-indigo-800"
    )
  }

  const getStatusBadgeText = (durum: string) => {
    const texts = {
      paid: "Ödendi",
      overdue: "Gecikmiş",
      pending: "Bekliyor",
    }
    return texts[durum as keyof typeof texts] || "Bilinmiyor"
  }

  const handleOdemeToggle = async (planId: string, currentStatus: "paid" | "pending" | "overdue") => {
    const newStatus = currentStatus === "paid" ? "pending" : "paid"
    try {
      const updatedPlan = await apiUpdatePaymentPlan(planId, {
        status: newStatus,
        payment_date: newStatus === "paid" ? new Date().toISOString() : null,
      })

      setOdemePlani((prev) => prev.map((p) => (p.id === planId ? updatedPlan : p)))

      // ÖNEMLİ: Credits tablosunu güncelle
      const { updateCreditStatus } = await import("@/lib/api/credits")
      await updateCreditStatus(creditId)

      // Kredi detayini yeniden çek
      const updatedCreditData = (await getCreditById(creditId, user!.id)) as PopulatedCredit
      setKrediDetay(updatedCreditData)

      toast({
        title: "Başarılı",
        description: `Taksit durumu "${getStatusBadgeText(newStatus)}" olarak güncellendi.`,
      })
    } catch (error) {
      console.error("Ödeme durumu güncellenirken hata:", error)
      toast({
        title: "Hata",
        description: "Ödeme durumu güncellenirken bir sorun oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleHesapla = () => {
    setHesaplaModalOpen(true)
  }

  // Helper function to load image as base64 using fetch
  const loadImageAsBase64 = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to load image")
      const blob = await response.blob()
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      throw new Error(`Failed to load image: ${url}`)
    }
  }

  // Helper function to get bank logo path from bank name
  const getBankLogoPath = (bankName: string | undefined): string => {
    if (!bankName) return ""

    const slug = bankName
      .toLowerCase()
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")

    return `/bank-icons/${slug}.png`
  }

  // Helper to add gradient background
  const addGradientRect = (
    doc: any,
    x: number,
    y: number,
    width: number,
    height: number,
    startColor: [number, number, number],
    _endColor: [number, number, number]
  ) => {
    doc.setFillColor(...startColor)
    doc.rect(x, y, width, height, "F")
  }

  const handleHesaplamaPDFIndir = async () => {
    if (!hesaplamaResult) return

    try {
      const { generateEarlyPaymentPDF } = await import("@/lib/utils/early-payment-pdf")

      await generateEarlyPaymentPDF({
        hesaplamaForm,
        hesaplamaResult,
        dynamicStats,
        krediDetay,
        user,
      })

      toast({
        title: "Rapor Hazir",
        description: "Hesaplama raporu basariyla indirildi.",
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "Rapor olusturulurken bir sorun olustu.",
        variant: "destructive",
      })
    }
  }

  const OLD_handleHesaplamaPDFIndir_REMOVE_THIS = async () => {
    if (!hesaplamaResult) return

    try {
      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF()

      // Turkish character conversion - WILL BE REMOVED
      const safeText = (text: string | number | null | undefined): string => {
        if (text === null || text === undefined) return ""
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

      // Load logos
      let whiteLogo: string | null = null
      let bankLogo: string | null = null

      try {
        whiteLogo = await loadImageAsBase64("/logo-white.png")
      } catch (error) {
        console.log("White logo could not be loaded")
      }

      try {
        const bankLogoPath = getBankLogoPath(krediDetay?.banks?.name)
        if (bankLogoPath) {
          bankLogo = await loadImageAsBase64(bankLogoPath)
        }
      } catch (error) {
        console.log("Bank logo could not be loaded")
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

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 15

      // ============ COVER PAGE ============
      addGradientRect(doc, 0, 0, pageWidth, pageHeight, COLORS.primary, COLORS.accent)

      // Decorative circles
      doc.setFillColor(255, 255, 255)
      doc.setGState(doc.GState({ opacity: 0.03 }))
      doc.circle(pageWidth * 0.85, pageHeight * 0.15, 60, "F")
      doc.circle(pageWidth * 0.15, pageHeight * 0.85, 50, "F")
      doc.circle(pageWidth * 0.25, pageHeight * 0.4, 35, "F")
      doc.circle(pageWidth * 0.75, pageHeight * 0.6, 40, "F")
      doc.setGState(doc.GState({ opacity: 1 }))

      // Logo section - UPDATED FOR PROFESSIONAL LOOK
      const logoY = pageHeight * 0.28
      const logoWidth = 60
      const logoHeight = 60

      if (whiteLogo) {
        try {
          // Add logo image centered
          doc.addImage(
            whiteLogo,
            "PNG",
            pageWidth / 2 - logoWidth / 2,
            logoY - logoHeight / 2,
            logoWidth,
            logoHeight
          )
        } catch (error) {
          console.log("Could not add white logo to cover")
          // Fallback: Show brand text
          doc.setTextColor(...COLORS.white)
          doc.setFontSize(24)
          doc.setFont("helvetica", "bold")
          doc.text("Kredi Takip", pageWidth / 2, logoY + 5, { align: "center" })
        }
      } else {
        // Fallback: Show brand text
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
      doc.text(safeText("HESAPLAMA"), pageWidth / 2, titleY + 42, { align: "center" })

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

      // Info card
      const coverCardY = pageHeight * 0.68
      const coverCardWidth = 140
      const coverCardHeight = 60

      // Card shadow
      doc.setFillColor(0, 0, 0)
      doc.setGState(doc.GState({ opacity: 0.15 }))
      doc.roundedRect(pageWidth / 2 - coverCardWidth / 2 + 2, coverCardY + 2, coverCardWidth, coverCardHeight, 8, 8, "F")

      // Card background
      doc.setGState(doc.GState({ opacity: 0.15 }))
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(pageWidth / 2 - coverCardWidth / 2, coverCardY, coverCardWidth, coverCardHeight, 8, 8, "F")
      doc.setGState(doc.GState({ opacity: 1 }))

      // Card border
      doc.setDrawColor(255, 255, 255)
      doc.setLineWidth(0.3)
      doc.setGState(doc.GState({ opacity: 0.4 }))
      doc.roundedRect(pageWidth / 2 - coverCardWidth / 2, coverCardY, coverCardWidth, coverCardHeight, 8, 8, "D")
      doc.setGState(doc.GState({ opacity: 1 }))

      // User info in card - UPDATED TO MATCH GENERAL REPORTS
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

      // Header gradient
      addGradientRect(doc, 0, 0, pageWidth, 50, COLORS.primary, COLORS.accent)

      // Bank logo in header (if available)
      if (bankLogo) {
        try {
          doc.addImage(bankLogo, "PNG", pageWidth - margin - 30, 10, 30, 30)
        } catch (error) {
          console.log("Could not add bank logo to header")
        }
      }

      doc.setTextColor(...COLORS.white)
      doc.setFontSize(20)
      doc.setFont("helvetica", "bold")
      doc.text("ERKEN ODEME HESAPLAMA", margin, 28)

      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")
      doc.text("Tasarruf Analiz Raporu", margin, 40)

      // Date - right aligned
      doc.setFontSize(9)
      doc.text(formatDate(new Date()), pageWidth - margin - 70, 20)

      yPos = 65

      // ============ METRIC CARDS ============
      const cardWidth = (pageWidth - 2 * margin - 30) / 4
      const cardHeight = 28
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

        // Top colored bar
        doc.setFillColor(...metric.color)
        doc.rect(x, yPos, cardWidth, 2, "F")

        // Title
        doc.setFontSize(7)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(...COLORS.gray)
        doc.text(safeText(metric.title).toUpperCase(), x + 3, yPos + 9)

        // Value
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(...COLORS.dark)
        doc.text(safeText(metric.value), x + 3, yPos + 18)
      })

      yPos += cardHeight + 10

      // ============ COMPARISON SECTION ============
      doc.setFillColor(...COLORS.lightGray)
      doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 18, 2, 2, "F")
      doc.setFillColor(...COLORS.secondary)
      doc.rect(margin, yPos, 4, 18, "F")
      doc.setTextColor(...COLORS.dark)
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.text(safeText("DURUM KARSILASTIRMASI"), margin + 8, yPos + 11)

      yPos += 22

      // Modern comparison table
      const totalWidth = pageWidth - 2 * margin
      const rowHeight = 14
      const headerHeight = 18

      // Header
      doc.setFillColor(...COLORS.secondary)
      doc.rect(margin, yPos, totalWidth, headerHeight, "F")

      doc.setTextColor(...COLORS.white)
      doc.setFontSize(7)
      doc.setFont("helvetica", "bold")

      doc.text(safeText("DURUM"), margin + 5, yPos + 12)
      doc.text(safeText("ANA PARA"), margin + 60, yPos + 12)
      doc.text(safeText("TOPLAM FAiZ"), margin + 115, yPos + 12)
      doc.text(safeText("TOPLAM ODEME"), margin + 165, yPos + 12)

      yPos += headerHeight

      // Row 1 - Mevcut
      doc.setFillColor(248, 248, 248)
      doc.rect(margin, yPos, totalWidth, rowHeight, "F")

      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.2)
      doc.line(margin, yPos + rowHeight, pageWidth - margin, yPos + rowHeight)

      doc.setTextColor(...COLORS.dark)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)

      doc.text(safeText("Mevcut"), margin + 5, yPos + 10)
      doc.setTextColor(...COLORS.danger)
      doc.setFont("helvetica", "bold")
      doc.text(formatMoney(dynamicStats.remainingDebt), margin + 60, yPos + 10)
      doc.setTextColor(...COLORS.warning)
      doc.text(formatMoney(hesaplamaResult.eskiToplamFaiz), margin + 115, yPos + 10)
      doc.setTextColor(...COLORS.dark)
      doc.text(formatMoney(hesaplamaResult.eskiToplamOdeme), margin + 165, yPos + 10)

      yPos += rowHeight

      // Row 2 - Yeni
      doc.setTextColor(...COLORS.dark)
      doc.setFont("helvetica", "normal")
      doc.text(safeText("Yeni"), margin + 5, yPos + 10)
      doc.setTextColor(...COLORS.success)
      doc.setFont("helvetica", "bold")
      doc.text(formatMoney(hesaplamaResult.kalanAnaPara), margin + 60, yPos + 10)
      doc.setTextColor(...COLORS.success)
      doc.text(formatMoney(hesaplamaResult.yeniToplamFaiz), margin + 115, yPos + 10)
      doc.setTextColor(...COLORS.dark)
      doc.text(formatMoney(hesaplamaResult.yeniToplamOdeme), margin + 165, yPos + 10)

      doc.setDrawColor(220, 220, 220)
      doc.line(margin, yPos + rowHeight, pageWidth - margin, yPos + rowHeight)

      // ============ MODERN FOOTER ============
      addGradientRect(doc, 0, pageHeight - 20, pageWidth, 20, COLORS.primary, COLORS.accent)

      doc.setTextColor(...COLORS.white)
      doc.setFontSize(7)

      // Left - Website
      doc.setFont("helvetica", "bold")
      doc.text("kreditakip.com.tr", margin, pageHeight - 8)

      // Center - Tagline
      doc.setFont("helvetica", "normal")
      doc.text("Finansal ozgurluge giden yol", pageWidth / 2, pageHeight - 8, { align: "center" })

      // Right - Page number
      doc.setFont("helvetica", "bold")
      doc.text("1 / 1", pageWidth - margin, pageHeight - 8, { align: "right" })

      doc.save(`erken-odeme-hesaplama-${krediDetay?.credit_code}.pdf`)

      toast({
        title: "Rapor Hazir",
        description: "Hesaplama raporu basariyla indirildi.",
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "Rapor olusturulurken bir sorun olustu.",
        variant: "destructive",
      })
    }
  }

  const handleRaporAl = async () => {
    setRaporLoading(true)
    try {
      const { generateCreditReport } = await import("@/lib/utils/pdf-generator")
      await generateCreditReport({
        credit: krediDetay,
        paymentPlans: odemePlani,
        paymentHistory: odemeGecmisi,
        dynamicStats,
      })

      toast({
        title: "Rapor Hazır",
        description: "Elit kredi raporu başarıyla indirildi.",
      })
    } catch (error) {
      console.error("PDF oluşturma hatası:", error)
      toast({
        title: "Hata",
        description: "Rapor oluşturulurken bir sorun oluştu.",
        variant: "destructive",
      })
    } finally {
      setRaporLoading(false)
    }
  }

  const handleOdemeYap = () => {
    setOdemeModalOpen(true)
  }

  const handleDuzenle = () => {
    router.push(`/uygulama/kredi-duzenle/${creditId}`)
  }

  const handleDownloadPaymentPlan = async () => {
    try {
      const { generatePaymentPlanPDF } = await import("@/lib/utils/payment-plan-pdf")

      await generatePaymentPlanPDF({
        odemePlani,
        krediDetay,
        user,
      })

      toast({
        title: "Basarili",
        description: "Odeme plani basariyla indirildi.",
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "Odeme plani indirilirken bir sorun olustu.",
        variant: "destructive",
      })
    }
  }

  const OLD_handleDownloadPaymentPlan_REMOVE_THIS = async () => {
    try {
      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF()

      // WILL BE REMOVED
      const safeText = (text: string | number | null | undefined): string => {
        if (text === null || text === undefined) return ""
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

      // Load logos
      let whiteLogo: string | null = null
      let bankLogo: string | null = null

      try {
        whiteLogo = await loadImageAsBase64("/logo-white.png")
      } catch (error) {
        console.log("White logo could not be loaded")
      }

      try {
        const bankLogoPath = getBankLogoPath(krediDetay?.banks?.name)
        if (bankLogoPath) {
          bankLogo = await loadImageAsBase64(bankLogoPath)
        }
      } catch (error) {
        console.log("Bank logo could not be loaded")
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

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 15

      // ============ COVER PAGE ============
      addGradientRect(doc, 0, 0, pageWidth, pageHeight, COLORS.primary, COLORS.accent)

      // Decorative circles
      doc.setFillColor(255, 255, 255)
      doc.setGState(doc.GState({ opacity: 0.03 }))
      doc.circle(pageWidth * 0.85, pageHeight * 0.15, 60, "F")
      doc.circle(pageWidth * 0.15, pageHeight * 0.85, 50, "F")
      doc.circle(pageWidth * 0.25, pageHeight * 0.4, 35, "F")
      doc.circle(pageWidth * 0.75, pageHeight * 0.6, 40, "F")
      doc.setGState(doc.GState({ opacity: 1 }))

      // Logo section - UPDATED FOR PROFESSIONAL LOOK
      const logoY = pageHeight * 0.28
      const logoWidth = 60
      const logoHeight = 60

      if (whiteLogo) {
        try {
          // Add logo image centered
          doc.addImage(
            whiteLogo,
            "PNG",
            pageWidth / 2 - logoWidth / 2,
            logoY - logoHeight / 2,
            logoWidth,
            logoHeight
          )
        } catch (error) {
          console.log("Could not add white logo to cover")
          // Fallback: Show brand text
          doc.setTextColor(...COLORS.white)
          doc.setFontSize(24)
          doc.setFont("helvetica", "bold")
          doc.text("Kredi Takip", pageWidth / 2, logoY + 5, { align: "center" })
        }
      } else {
        // Fallback: Show brand text
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
      doc.text(safeText("ODEME PLANI"), pageWidth / 2, titleY, { align: "center" })
      doc.setFontSize(36)
      doc.text(safeText("RAPORU"), pageWidth / 2, titleY + 42, { align: "center" })

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
      doc.text(safeText("Taksit ve Odeme Takip Detaylari"), pageWidth / 2, titleY + 66, { align: "center" })
      doc.setGState(doc.GState({ opacity: 1 }))

      // Info card
      const coverCardY = pageHeight * 0.68
      const coverCardWidth = 140
      const coverCardHeight = 60

      // Card shadow
      doc.setFillColor(0, 0, 0)
      doc.setGState(doc.GState({ opacity: 0.15 }))
      doc.roundedRect(pageWidth / 2 - coverCardWidth / 2 + 2, coverCardY + 2, coverCardWidth, coverCardHeight, 8, 8, "F")

      // Card background
      doc.setGState(doc.GState({ opacity: 0.15 }))
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(pageWidth / 2 - coverCardWidth / 2, coverCardY, coverCardWidth, coverCardHeight, 8, 8, "F")
      doc.setGState(doc.GState({ opacity: 1 }))

      // Card border
      doc.setDrawColor(255, 255, 255)
      doc.setLineWidth(0.3)
      doc.setGState(doc.GState({ opacity: 0.4 }))
      doc.roundedRect(pageWidth / 2 - coverCardWidth / 2, coverCardY, coverCardWidth, coverCardHeight, 8, 8, "D")
      doc.setGState(doc.GState({ opacity: 1 }))

      // User info in card - UPDATED TO MATCH GENERAL REPORTS
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

      // Header gradient
      addGradientRect(doc, 0, 0, pageWidth, 50, COLORS.primary, COLORS.accent)

      // Bank logo in header (if available)
      if (bankLogo) {
        try {
          doc.addImage(bankLogo, "PNG", pageWidth - margin - 30, 10, 30, 30)
        } catch (error) {
          console.log("Could not add bank logo to header")
        }
      }

      doc.setTextColor(...COLORS.white)
      doc.setFontSize(20)
      doc.setFont("helvetica", "bold")
      doc.text("ODEME PLANI", margin, 28)

      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")
      doc.text("Taksit Detaylari", margin, 40)

      // Date - right aligned
      doc.setFontSize(9)
      doc.text(formatDate(new Date()), pageWidth - margin - 70, 20)

      yPos = 65

      // ============ METRIC CARDS ============
      const totalPrincipal = odemePlani.reduce((sum, p) => sum + p.principal_amount, 0)
      const totalInterest = odemePlani.reduce((sum, p) => sum + p.interest_amount, 0)
      const totalPayment = odemePlani.reduce((sum, p) => sum + p.total_payment, 0)
      const paidCount = odemePlani.filter(p => p.status === "paid").length

      const cardWidth = (pageWidth - 2 * margin - 30) / 4
      const cardHeight = 28
      const spacing = 10

      const metrics = [
        { title: "Toplam Taksit", value: `${odemePlani.length} Adet`, color: COLORS.primary },
        { title: "Odenen", value: `${paidCount} Adet`, color: COLORS.success },
        { title: "Toplam Ana Para", value: formatMoney(totalPrincipal), color: COLORS.warning },
        { title: "Toplam Faiz", value: formatMoney(totalInterest), color: COLORS.danger },
      ]

      metrics.forEach((metric, index) => {
        const x = margin + index * (cardWidth + spacing)

        // Card background
        doc.setFillColor(...COLORS.white)
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.5)
        doc.rect(x, yPos, cardWidth, cardHeight, "FD")

        // Top colored bar
        doc.setFillColor(...metric.color)
        doc.rect(x, yPos, cardWidth, 2, "F")

        // Title
        doc.setFontSize(7)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(...COLORS.gray)
        doc.text(safeText(metric.title).toUpperCase(), x + 3, yPos + 9)

        // Value
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(...COLORS.dark)
        doc.text(safeText(metric.value), x + 3, yPos + 18)
      })

      yPos += cardHeight + 12

      // ============ PAYMENT PLAN TABLE ============
      doc.setFillColor(...COLORS.lightGray)
      doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 22, 2, 2, "F")
      doc.setFillColor(...COLORS.secondary)
      doc.rect(margin, yPos, 4, 22, "F")
      doc.setTextColor(...COLORS.dark)
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text(safeText("TAKSIT DETAYLARI"), margin + 10, yPos + 14)

      yPos += 27

      // Table Header
      const headerHeight = 16
      doc.setFillColor(...COLORS.secondary)
      doc.rect(margin, yPos, pageWidth - 2 * margin, headerHeight, "F")

      doc.setTextColor(...COLORS.white)
      doc.setFontSize(7)
      doc.setFont("helvetica", "bold")

      const headers = [
        { text: "No", x: margin + 3 },
        { text: "Vade Tarihi", x: margin + 20 },
        { text: "Ana Para", x: margin + 60 },
        { text: "Faiz", x: margin + 90 },
        { text: "Toplam Odeme", x: margin + 115 },
        { text: "Kalan Borc", x: margin + 150 },
        { text: "Durum", x: margin + 175 },
      ]

      headers.forEach((header) => {
        doc.text(safeText(header.text), header.x, yPos + 11)
      })

      yPos += headerHeight

      // Table Rows
      const rowHeight = 13
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)

      odemePlani.forEach((plan, index) => {
        // Check page break
        if (index > 0 && index % 10 === 0 && yPos + rowHeight > pageHeight - 35) {
          doc.addPage()
          yPos = 20

          // Repeat header on new page
          doc.setFillColor(...COLORS.secondary)
          doc.rect(margin, yPos, pageWidth - 2 * margin, headerHeight, "F")
          doc.setTextColor(...COLORS.white)
          doc.setFont("helvetica", "bold")
          doc.setFontSize(7)
          headers.forEach((header) => {
            doc.text(safeText(header.text), header.x, yPos + 11)
          })
          yPos += headerHeight
          doc.setFont("helvetica", "normal")
        }

        // Alternating row colors
        if (index % 2 === 0) {
          doc.setFillColor(248, 248, 248)
          doc.rect(margin, yPos, pageWidth - 2 * margin, rowHeight, "F")
        }

        // Bottom border
        doc.setDrawColor(220, 220, 220)
        doc.setLineWidth(0.2)
        doc.line(margin, yPos + rowHeight, pageWidth - margin, yPos + rowHeight)

        // Status color
        const statusColor =
          plan.status === "paid" ? COLORS.primary :
          plan.status === "overdue" ? [239, 68, 68] as [number, number, number] :
          COLORS.gray

        // Row content
        doc.setTextColor(...COLORS.dark)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(7)
        doc.text(safeText(plan.installment_number), margin + 3, yPos + 9)
        doc.text(safeText(new Date(plan.due_date).toLocaleDateString("tr-TR")), margin + 20, yPos + 9)
        doc.text(formatMoney(plan.principal_amount), margin + 60, yPos + 9)
        doc.text(formatMoney(plan.interest_amount), margin + 90, yPos + 9)
        doc.text(formatMoney(plan.total_payment), margin + 115, yPos + 9)
        doc.text(formatMoney(plan.remaining_debt), margin + 150, yPos + 9)

        doc.setTextColor(...statusColor)
        doc.setFont("helvetica", "bold")
        doc.text(safeText(getStatusBadgeText(plan.status)), margin + 175, yPos + 9)

        yPos += rowHeight
      })

      // ============ MODERN FOOTER ON ALL PAGES ============
      const pageCount = doc.getNumberOfPages()

      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)

        addGradientRect(doc, 0, pageHeight - 20, pageWidth, 20, COLORS.primary, COLORS.accent)

        doc.setTextColor(...COLORS.white)
        doc.setFontSize(7)

        // Left - Website
        doc.setFont("helvetica", "bold")
        doc.text("kreditakip.com.tr", margin, pageHeight - 8)

        // Center - Tagline
        doc.setFont("helvetica", "normal")
        doc.text("Finansal ozgurluge giden yol", pageWidth / 2, pageHeight - 8, { align: "center" })

        // Right - Page number
        doc.setFont("helvetica", "bold")
        doc.text(`${i} / ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: "right" })
      }

      doc.save(`odeme-plani-${krediDetay?.credit_code}.pdf`)

      toast({
        title: "Basarili",
        description: "Odeme plani basariyla indirildi.",
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "Odeme plani indirilirken bir sorun olustu.",
        variant: "destructive",
      })
    }
  }

  const handleDownloadContract = () => {
    toast({
      title: "Bilgi",
      description: "Kredi sözleşmesi özelliği yakında eklenecek.",
    })
  }

  const handleNotificationToggle = (setting: string, value: boolean) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [setting]: value,
    }))

    toast({
      title: "Bildirim Ayarı Güncellendi",
      description: `${setting === "paymentReminder" ? "Ödeme hatırlatması" : setting === "interestRateChange" ? "Faiz oranı değişikliği" : "Aylık rapor"} bildirimi ${value ? "açıldı" : "kapatıldı"}.`,
    })
  }

  const handleHesaplamaYap = () => {
    const tutar = Number.parseFloat(hesaplamaForm.erkenOdemeTutari)
    if (!tutar || tutar <= 0) {
      toast({
        title: "Hata",
        description: "Gecerli bir tutar giriniz.",
        variant: "destructive",
      })
      return
    }

    // Ödeme planından gerçek verileri al
    const pendingInstallments = odemePlani.filter(p => p.status === "pending").sort((a, b) =>
      new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    )

    if (pendingInstallments.length === 0) {
      toast({
        title: "Bilgi",
        description: "Tum taksitler odenmis durumda.",
      })
      return
    }

    // Kalan taksitlerdeki toplam ana para ve faiz
    const kalanToplamAnaPara = pendingInstallments.reduce((sum, p) => sum + p.principal_amount, 0)
    const kalanToplamFaiz = pendingInstallments.reduce((sum, p) => sum + p.interest_amount, 0)
    const kalanToplamOdeme = pendingInstallments.reduce((sum, p) => sum + p.total_payment, 0)

    if (tutar > kalanToplamAnaPara) {
      toast({
        title: "Hata",
        description: `Odeme tutari kalan ana paradan (${formatCurrency(kalanToplamAnaPara)}) fazla olamaz.`,
        variant: "destructive",
      })
      return
    }

    // Erken ödeme hesaplaması - Gerçek verilerle
    // Eğer kalan ana parayı tam ödersek, tüm faizden kurtuluruz
    const odenenAnaPara = tutar
    const kalanAnaPara = kalanToplamAnaPara - tutar

    // Faiz tasarrufu hesaplama
    // Eğer tüm ana parayı ödersek, tüm faizden kurtuluruz
    let faizTasarrufu = 0
    let yeniToplamOdeme = 0
    let yeniToplamFaiz = 0
    let yeniAylikOdeme = 0

    if (kalanAnaPara === 0) {
      // Tüm borç ödendi - tüm faizden kurtulduk
      faizTasarrufu = kalanToplamFaiz
      yeniToplamOdeme = 0
      yeniToplamFaiz = 0
      yeniAylikOdeme = 0
    } else {
      // Kısmi ödeme - oransal faiz tasarrufu
      // Ödenen ana para oranı kadar faizden kurtuluruz
      const odemeOrani = odenenAnaPara / kalanToplamAnaPara
      faizTasarrufu = kalanToplamFaiz * odemeOrani

      // Kalan taksitleri yeniden hesapla
      const kalanTaksitSayisi = pendingInstallments.length
      const yillikFaizOrani = krediDetay?.interest_rate || 0
      const aylikFaizOrani = yillikFaizOrani / 100 / 12

      if (aylikFaizOrani > 0) {
        // Anuity formülü ile yeni aylık ödeme
        const anuityFaktor = (aylikFaizOrani * Math.pow(1 + aylikFaizOrani, kalanTaksitSayisi)) /
                            (Math.pow(1 + aylikFaizOrani, kalanTaksitSayisi) - 1)
        yeniAylikOdeme = kalanAnaPara * anuityFaktor
        yeniToplamOdeme = yeniAylikOdeme * kalanTaksitSayisi
        yeniToplamFaiz = yeniToplamOdeme - kalanAnaPara
      } else {
        yeniAylikOdeme = kalanAnaPara / kalanTaksitSayisi
        yeniToplamOdeme = kalanAnaPara
        yeniToplamFaiz = 0
      }
    }

    // Toplam tasarruf = eski toplam ödeme - yeni toplam ödeme - erken ödeme tutarı
    const toplamTasarruf = kalanToplamOdeme - yeniToplamOdeme - tutar

    // Yeni vade tarihi
    const bugun = new Date()
    const yeniVadeTarihi = new Date(bugun.setMonth(bugun.getMonth() + pendingInstallments.length))

    setHesaplamaResult({
      yeniKalanBorc: kalanAnaPara,
      faizTasarrufu,
      yeniVadeTarihi: yeniVadeTarihi.toLocaleDateString("tr-TR"),
      yeniAylikOdeme,
      eskiToplamOdeme: kalanToplamOdeme,
      eskiToplamFaiz: kalanToplamFaiz,
      yeniToplamOdeme,
      yeniToplamFaiz,
      toplamTasarruf,
      kalanAnaPara,
      odenenAnaPara,
    })

    setHesaplamaStep(2)
  }

  const handleOdemeYapSubmit = async () => {
    if (!odemeForm.odemeTutari || odemeForm.odemeTutari <= 0) {
      toast({
        title: "Hata",
        description: "Gecerli bir odeme tutari giriniz.",
        variant: "destructive",
      })
      return
    }

    try {
      // Ödeme tutarını taksitlerden düş
      let remainingPayment = odemeForm.odemeTutari
      const updatedPlans = [...odemePlani]

      // Ödenmemiş taksitleri tarihe göre sırala
      const unpaidInstallments = updatedPlans
        .filter((p) => p.status === "pending")
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())

      for (const installment of unpaidInstallments) {
        if (remainingPayment <= 0) break

        if (remainingPayment >= installment.total_payment) {
          // Taksiti tamamen öde
          await apiUpdatePaymentPlan(installment.id, {
            status: "paid",
            payment_date: new Date().toISOString(),
          })

          // Bu taksit için ayrı bir ödeme geçmişi kaydı oluştur
          await createPaymentHistory({
            credit_id: creditId,
            payment_plan_id: installment.id, // Taksit ile ilişkilendir
            amount: installment.total_payment,
            payment_date: new Date().toISOString(),
            payment_channel: odemeForm.odemeKanali,
            transaction_id: `PAY-${installment.installment_number}-${Date.now()}`,
            notes: odemeForm.aciklama || `Taksit #${installment.installment_number} ödemesi`,
            status: "completed" as const,
          })

          remainingPayment -= installment.total_payment

          // Local state'i güncelle
          const index = updatedPlans.findIndex((p) => p.id === installment.id)
          if (index !== -1) {
            updatedPlans[index] = { ...updatedPlans[index], status: "paid", payment_date: new Date().toISOString() }
          }
        } else {
          // Kısmi ödeme - taksit tutarını azalt
          const newAmount = installment.total_payment - remainingPayment
          await apiUpdatePaymentPlan(installment.id, {
            total_payment: newAmount,
            principal_amount: installment.principal_amount * (newAmount / installment.total_payment),
            interest_amount: installment.interest_amount * (newAmount / installment.total_payment),
          })

          // Kısmi ödeme için ödeme geçmişi kaydı
          await createPaymentHistory({
            credit_id: creditId,
            payment_plan_id: installment.id, // Taksit ile ilişkilendir
            amount: remainingPayment,
            payment_date: new Date().toISOString(),
            payment_channel: odemeForm.odemeKanali,
            transaction_id: `PAY-PARTIAL-${installment.installment_number}-${Date.now()}`,
            notes: odemeForm.aciklama || `Taksit #${installment.installment_number} kısmi ödemesi`,
            status: "completed" as const,
          })

          // Local state'i güncelle
          const index = updatedPlans.findIndex((p) => p.id === installment.id)
          if (index !== -1) {
            updatedPlans[index] = {
              ...updatedPlans[index],
              total_payment: newAmount,
              principal_amount: installment.principal_amount * (newAmount / installment.total_payment),
              interest_amount: installment.interest_amount * (newAmount / installment.total_payment),
            }
          }
          remainingPayment = 0
        }
      }

      // Genel ödeme kaydını kaldırdık çünkü artık her taksit için ayrı kayıt oluşturuyoruz

      // ÖNEMLİ: Credits tablosunu güncelle
      const { updateCreditStatus } = await import("@/lib/api/credits")
      await updateCreditStatus(creditId)

      // State'leri güncelle
      setOdemePlani(updatedPlans)

      // Ödeme geçmişini güncelle
      const newPaymentHistory = await getPaymentHistory(creditId)
      setOdemeGecmisi(newPaymentHistory)

      // Kredi detayini yeniden çek (güncellenmiş bilgiler için)
      const updatedCreditData = (await getCreditById(creditId, user!.id)) as PopulatedCredit
      setKrediDetay(updatedCreditData)

      toast({
        title: "Odeme Basarili",
        description: `${formatCurrency(odemeForm.odemeTutari)} tutarinda odeme basariyla gerceklestirildi.`,
      })

      setOdemeModalOpen(false)
    } catch (error) {
      console.error("Ödeme işlemi hatası:", error)
      toast({
        title: "Hata",
        description: "Odeme islemi sirasinda bir sorun olustu.",
        variant: "destructive",
      })
    }
  }

  if (authLoading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !krediDetay) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg text-red-600">{error || "Kredi bulunamadı."}</p>
        <Button onClick={() => router.back()} className="mt-4">
          Geri Dön
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.back()}
                className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-4">
                <BankLogo
                  bankName={krediDetay.banks?.name || "Bilinmeyen Banka"}
                  logoUrl={krediDetay.banks?.logo_url ?? undefined}
                  size="lg"
                  className="bg-white/20 border-2 border-white"
                />
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">Kredi Detayı</h1>
                  <p className="text-teal-100 text-lg">
                    {krediDetay.credit_code} - {krediDetay.banks?.name || "N/A"}
                  </p>
                  <p className="text-teal-200 text-sm">{krediDetay.credit_types?.name || "N/A"}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="lg"
                    className="bg-white text-white-800 hover:bg-gray-100 hover:text-white-900 font-semibold shadow-lg border border-white/20 backdrop-blur-sm gap-2"
                  >
                    <MoreVertical className="h-4 w-4" />
                    İşlemler
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleOdemeYap} className="gap-2">
                    <Banknote className="h-4 w-4 text-emerald-600" />
                    Ödeme Yap
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleHesapla} className="gap-2">
                    <Calculator className="h-4 w-4 text-blue-600" />
                    Hesapla
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleRaporAl} disabled={raporLoading} className="gap-2">
                    {raporLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                    ) : (
                      <Download className="h-4 w-4 text-purple-600" />
                    )}
                    {raporLoading ? "Hazırlanıyor..." : "Rapor Al"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDuzenle} className="gap-2">
                    <Edit className="h-4 w-4 text-orange-600" />
                    Düzenle
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Kredi Bilgileri Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <p className="text-teal-100 text-sm mb-1">Kalan Borç</p>
              <p className="text-2xl md:text-3xl font-bold">{formatCurrency(dynamicStats.remainingDebt)}</p>
            </div>
            <div className="text-center">
              <p className="text-teal-100 text-sm mb-1">Aylık Ödeme</p>
              <p className="text-2xl md:text-3xl font-bold">
                {formatCurrency(
                  odemePlani.length > 0
                    ? odemePlani
                        .filter((p) => p.status === "pending")
                        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]
                        ?.total_payment || krediDetay.monthly_payment
                    : krediDetay.monthly_payment,
                )}
              </p>
            </div>
            <div className="text-center">
              <p className="text-teal-100 text-sm mb-1">Faiz Oranı</p>
              <p className="text-2xl md:text-3xl font-bold">{formatPercent(krediDetay.interest_rate)}</p>
            </div>
            <div className="text-center">
              <p className="text-teal-100 text-sm mb-1">Kalan Taksit</p>
              <p className="text-2xl md:text-3xl font-bold">{dynamicStats.remainingInstallments}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Ödeme İlerlemesi</span>
              <span className="text-sm font-bold">
                {dynamicStats.paidInstallments}/{odemePlani.length} Taksit
              </span>
            </div>
            <Progress value={dynamicStats.paymentProgress} className="h-3 bg-white/20" />
            <p className="text-xs text-teal-100 mt-1">{formatPercent(dynamicStats.paymentProgress)} tamamlandı</p>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Badge className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-transparent hover:from-emerald-700 hover:to-teal-800 px-4 py-2 text-sm font-semibold shadow-lg">
              <CheckCircle className="mr-2 h-4 w-4" />
              Aktif
            </Badge>
            <div className="text-right">
              <p className="text-teal-100 text-sm">
                Başlangıç: {new Date(krediDetay.start_date).toLocaleDateString("tr-TR")}
              </p>
              <p className="text-teal-100 text-sm">
                Bitiş: {new Date(krediDetay.end_date).toLocaleDateString("tr-TR")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="bg-white dark:bg-black/10 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-gray-100 dark:border-white/10 bg-gray-100 dark:bg-black/20">
            <TabsList className="grid grid-cols-5 bg-transparent h-auto p-2 gap-2">
              <TabsTrigger
                value="genel"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900/20 data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/60"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Genel Bilgiler</span>
                <span className="sm:hidden font-medium">Genel</span>
              </TabsTrigger>
              <TabsTrigger
                value="odeme-plani"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900/20 data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/60"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Ödeme Planı</span>
                <span className="sm:hidden font-medium">Plan</span>
              </TabsTrigger>
              <TabsTrigger
                value="gecmis"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900/20 data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/60"
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Ödeme Geçmişi</span>
                <span className="sm:hidden font-medium">Geçmiş</span>
              </TabsTrigger>
              <TabsTrigger
                value="grafikler"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900/20 data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/60"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Grafikler</span>
                <span className="sm:hidden font-medium">Grafik</span>
              </TabsTrigger>
              <TabsTrigger
                value="ayarlar"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900/20 data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/60"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Ayarlar</span>
                <span className="sm:hidden font-medium">Ayar</span>
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="p-6 pb-8 min-h-[400px]">
            {/* Genel Bilgiler Tab */}
            {activeTab === "genel" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="shadow-sm border-gray-200 dark:border-white/10 dark:bg-black/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                        Kredi Bilgileri
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-white/60">Kredi Kodu</p>
                          <p className="font-medium text-gray-900 dark:text-white">{krediDetay.credit_code}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-white/60">Hesap No</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {krediDetay.account_number || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-white/60">Başlangıç Tutarı</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {formatCurrency(krediDetay.initial_amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-white/60">Kredi Notu</p>
                          <Badge className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-transparent hover:from-emerald-700 hover:to-teal-800">
                            {krediDetay.credit_score || "N/A"}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-white/60">Başlangıç Tarihi</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {new Date(krediDetay.start_date).toLocaleDateString("tr-TR")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-white/60">Bitiş Tarihi</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {new Date(krediDetay.end_date).toLocaleDateString("tr-TR")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-white/60">Teminat</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {krediDetay.collateral || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-white/60">Sigorta</p>
                          <Badge className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-transparent hover:from-blue-700 hover:to-indigo-800 capitalize">
                            {krediDetay.insurance_status || "N/A"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm border-gray-200 dark:border-white/10 dark:bg-black/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                        <Building className="h-5 w-5" />
                        Banka Bilgileri
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4 mb-4">
                        <BankLogo
                          bankName={krediDetay.banks?.name || "Bilinmeyen Banka"}
                          logoUrl={krediDetay.banks?.logo_url ?? undefined}
                          size="md"
                        />
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {krediDetay.banks?.name || "N/A"}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-white/60">{krediDetay.branch_name || "Şube Bilgisi Yok"}</p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-white/10">
                        {krediDetay.banks?.contact_phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500 dark:text-white/60">Telefon</p>
                              <a
                                href={`tel:${krediDetay.banks.contact_phone}`}
                                className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                              >
                                {krediDetay.banks.contact_phone}
                              </a>
                            </div>
                          </div>
                        )}

                        {krediDetay.banks?.contact_email && (
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500 dark:text-white/60">E-posta</p>
                              <a
                                href={`mailto:${krediDetay.banks.contact_email}`}
                                className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                              >
                                {krediDetay.banks.contact_email}
                              </a>
                            </div>
                          </div>
                        )}

                        {krediDetay.banks?.website && (
                          <div className="flex items-center gap-3">
                            <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500 dark:text-white/60">Website</p>
                              <a
                                href={krediDetay.banks.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                              >
                                {krediDetay.banks.website.replace(/^https?:\/\//, '')}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        )}

                        {!krediDetay.banks?.contact_phone && !krediDetay.banks?.contact_email && !krediDetay.banks?.website && (
                          <p className="text-sm text-gray-500 dark:text-white/60 italic">İletişim bilgisi mevcut değil</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Özet İstatistikler */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-blue-500 border-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg">
                          <Target className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm text-blue-100">Toplam Taksit</p>
                          <p className="text-xl font-bold text-white">{krediDetay.total_installments || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-emerald-500 border-emerald-500">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-sm text-emerald-100">Ödenen Taksit</p>
                          <p className="text-xl font-bold text-white">
                            {(krediDetay.total_installments || 0) - (krediDetay.remaining_installments || 0)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-orange-500 border-orange-500">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg">
                          <Clock className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-sm text-orange-100">Kalan Taksit</p>
                          <p className="text-xl font-bold text-white">{krediDetay.remaining_installments || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-500 border-purple-500">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg">
                          <TrendingUp className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <p className="text-sm text-purple-100">İlerleme</p>
                          <p className="text-xl font-bold text-white">
                            {formatPercent(krediDetay.payment_progress || 0)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Ödeme Planı Tab */}
            {activeTab === "odeme-plani" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ödeme Planı</h3>
                    <p className="text-sm text-gray-600 dark:text-white/60">
                      Toplam {odemePlani.length} taksit • Sayfa {currentPage} / {totalPages}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2 w-fit bg-transparent" onClick={handleDownloadPaymentPlan}>
                    <Download className="h-4 w-4" />
                    Planı İndir
                  </Button>
                </div>

                {odemePlani.length > 0 ? (
                  <>
                    {/* Taksit Cards */}
                    <div className="space-y-4 pb-4">
                      {currentItems.map((taksit) => {
                        const isOverdue = new Date(taksit.due_date) < new Date() && taksit.status === "pending"
                        const isUpcoming =
                          new Date(taksit.due_date).getTime() - new Date().getTime() <= 7 * 24 * 60 * 60 * 1000

                        const getStatusInfo = () => {
                          if (taksit.status === "paid") {
                            return { label: "Ödendi", color: "text-emerald-600 bg-emerald-50", icon: CheckCircle }
                          } else if (isOverdue) {
                            return { label: "Gecikmiş", color: "text-red-600 bg-red-50", icon: AlertTriangle }
                          } else if (isUpcoming && taksit.status === "pending") {
                            return { label: "Yaklaşan", color: "text-orange-600 bg-orange-50", icon: Clock }
                          } else {
                            return { label: "Bekliyor", color: "text-gray-600 bg-gray-50", icon: Calendar }
                          }
                        }

                        const statusInfo = getStatusInfo()
                        const StatusIcon = statusInfo.icon

                        return (
                          <div
                            key={taksit.id}
                            className="flex items-center justify-between p-4 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl hover:border-gray-300 dark:hover:border-white/20 hover:shadow-sm transition-all relative z-10"
                          >
                            <div className="flex items-center gap-4">
                              <div className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg shadow-lg">
                                {taksit.installment_number}
                              </div>

                              <div>
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold text-gray-900 dark:text-white">
                                    Taksit #{taksit.installment_number}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-white/60 mt-1">
                                  Vade: {new Date(taksit.due_date).toLocaleDateString("tr-TR")}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-white/60 mt-1">
                                  Ana Para: {formatCurrency(taksit.principal_amount)} • Faiz:{" "}
                                  {formatCurrency(taksit.interest_amount)}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="font-bold text-gray-900 dark:text-white text-lg">
                                  {formatCurrency(taksit.total_payment)}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-white/60">
                                  Kalan: {formatCurrency(taksit.remaining_debt)}
                                </div>
                              </div>

                              <div
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                                  taksit.status === "paid"
                                    ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-700 hover:to-teal-800"
                                    : isOverdue
                                      ? "bg-gradient-to-r from-red-600 to-rose-700 text-white hover:from-red-700 hover:to-rose-800"
                                      : isUpcoming
                                        ? "bg-gradient-to-r from-orange-600 to-amber-700 text-white hover:from-orange-700 hover:to-amber-800"
                                        : "bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800"
                                }`}
                              >
                                <StatusIcon className="h-3.5 w-3.5" />
                                {statusInfo.label}
                              </div>

                              <Switch
                                checked={taksit.status === "paid"}
                                onCheckedChange={() => handleOdemeToggle(taksit.id, taksit.status)}
                                className="data-[state=checked]:bg-emerald-500"
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="pt-4 mt-4 border-t border-gray-200 dark:border-white/10">
                        <PaginationModern
                          currentPage={currentPage}
                          totalPages={totalPages}
                          totalItems={totalItems}
                          itemsPerPage={itemsPerPage}
                          onPageChange={setCurrentPage}
                          itemName="taksit"
                        />
                      </div>
                    )}

                    {/* Summary - Genel bilgiler tabındaki tasarımla */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="bg-blue-500 border-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-lg">
                              <Target className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-sm text-blue-100">Toplam Taksit</p>
                              <p className="text-xl font-bold text-white">{odemePlani.length}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-emerald-500 border-emerald-500">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-lg">
                              <Banknote className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                              <p className="text-sm text-emerald-100">Toplam Tutar</p>
                              <p className="text-xl font-bold text-white">
                                {formatCurrency(odemePlani.reduce((sum, p) => sum + p.total_payment, 0))}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-purple-500 border-purple-500">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-lg">
                              <CreditCard className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                              <p className="text-sm text-purple-100">Ana Para</p>
                              <p className="text-xl font-bold text-white">
                                {formatCurrency(odemePlani.reduce((sum, p) => sum + p.principal_amount, 0))}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-orange-500 border-orange-500">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-lg">
                              <TrendingUp className="h-5 w-5 text-orange-500" />
                            </div>
                            <div>
                              <p className="text-sm text-orange-100">Toplam Faiz</p>
                              <p className="text-xl font-bold text-white">
                                {formatCurrency(odemePlani.reduce((sum, p) => sum + p.interest_amount, 0))}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-white/60">
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-white/40" />
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Ödeme Planı Bulunamadı</h3>
                    <p className="text-sm">Bu kredi için ödeme planı bulunmuyor</p>
                  </div>
                )}
              </div>
            )}

            {/* Ödeme Geçmişi Tab */}
            {activeTab === "gecmis" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ödeme Geçmişi</h3>
                    <p className="text-sm text-gray-600 dark:text-white/60">
                      Toplam {odemeGecmisi.length} ödeme • Sayfa {currentPageHistory} / {totalHistoryPages}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2 w-fit bg-transparent">
                    <Download className="h-4 w-4" />
                    Geçmişi İndir
                  </Button>
                </div>

                {odemeGecmisi.length > 0 ? (
                  <>
                    {/* Ödeme Cards */}
                    <div className="space-y-4 pb-4">
                      {currentHistoryItems.map((odeme, index) => (
                        <div
                          key={odeme.id}
                          className="flex items-center justify-between p-4 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl hover:border-gray-300 dark:hover:border-white/20 hover:shadow-sm transition-all relative z-10"
                        >
                          <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-full shadow-lg">
                              <CheckCircle className="h-6 w-6 text-white" />
                            </div>

                            <div>
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  Ödeme #{startIndexHistory + index + 1}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 dark:text-white/60 mt-1">
                                {new Date(odeme.payment_date).toLocaleDateString("tr-TR", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-white/60 mt-1">
                                Kanal: {odeme.payment_channel || "Bilinmiyor"} • Referans:{" "}
                                {odeme.transaction_id || "N/A"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 flex-shrink-0">
                            <div className="text-right flex-shrink-0">
                              <div className="font-bold text-emerald-600 text-xl">{formatCurrency(odeme.amount)}</div>
                              <div className="text-xs text-gray-500 dark:text-white/60">
                                {new Date(odeme.payment_date).toLocaleTimeString("tr-TR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-700 hover:to-teal-800 flex-shrink-0">
                              <CheckCircle className="h-3.5 w-3.5" />
                              Başarılı
                            </div>

                            <div className="flex gap-2 flex-shrink-0 relative z-20">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 text-xs bg-white dark:bg-black/40 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer flex-shrink-0"
                                onClick={() => router.push(`/uygulama/odeme-detay/${odeme.id}`)}
                              >
                                Detay
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-3 text-xs text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 bg-white dark:bg-black/40 cursor-pointer flex-shrink-0"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Ödeme Kaydını Sil</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Bu ödeme kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>İptal</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={async () => {
                                        try {
                                          // 1. Önce silinen ödeme ile ilişkili taksitleri bul ve durumlarını geri al
                                          if (odeme.payment_plan_id) {
                                            // Eğer belirli bir taksit ile ilişkiliyse, o taksitin durumunu geri al
                                            await apiUpdatePaymentPlan(odeme.payment_plan_id, {
                                              status: "pending",
                                              payment_date: null,
                                            })
                                          } else {
                                            // Eğer genel bir ödeme ise, ödeme tutarı kadar taksitleri geri al
                                            let remainingAmount = odeme.amount
                                            const paidInstallments = odemePlani
                                              .filter((p) => p.status === "paid")
                                              .sort((a, b) => b.installment_number - a.installment_number) // Son ödenenlerden başla

                                            for (const installment of paidInstallments) {
                                              if (remainingAmount <= 0) break

                                              if (remainingAmount >= installment.total_payment) {
                                                // Taksiti tamamen geri al
                                                await apiUpdatePaymentPlan(installment.id, {
                                                  status: "pending",
                                                  payment_date: null,
                                                })
                                                remainingAmount -= installment.total_payment

                                                // Local state'i güncelle
                                                const index = odemePlani.findIndex((p) => p.id === installment.id)
                                                if (index !== -1) {
                                                  setOdemePlani((prev) =>
                                                    prev.map((p) =>
                                                      p.id === installment.id
                                                        ? { ...p, status: "pending", payment_date: null }
                                                        : p,
                                                    ),
                                                  )
                                                }
                                              } else {
                                                // Kısmi geri alma - bu durumda taksit tutarını artır
                                                const newAmount = installment.total_payment + remainingAmount
                                                await apiUpdatePaymentPlan(installment.id, {
                                                  total_payment: newAmount,
                                                  principal_amount:
                                                    installment.principal_amount *
                                                    (newAmount / installment.total_payment),
                                                  interest_amount:
                                                    installment.interest_amount *
                                                    (newAmount / installment.total_payment),
                                                })

                                                // Local state'i güncelle
                                                const index = odemePlani.findIndex((p) => p.id === installment.id)
                                                if (index !== -1) {
                                                  setOdemePlani((prev) =>
                                                    prev.map((p) =>
                                                      p.id === installment.id
                                                        ? {
                                                            ...p,
                                                            total_payment: newAmount,
                                                            principal_amount:
                                                              installment.principal_amount *
                                                              (newAmount / installment.total_payment),
                                                            interest_amount:
                                                              installment.interest_amount *
                                                              (newAmount / installment.total_payment),
                                                          }
                                                        : p,
                                                    ),
                                                  )
                                                }
                                                remainingAmount = 0
                                              }
                                            }
                                          }

                                          // 2. Ödeme geçmişinden sil
                                          const deletedPayment = await deletePaymentHistory(odeme.id)

                                          if (deletedPayment) {
                                            // 3. Local state'i güncelle - silinen ödemeyi listeden çıkar
                                            setOdemeGecmisi((prev) => prev.filter((p) => p.id !== odeme.id))

                                            // 4. Ödeme planlarını yeniden çek (güncellenmiş durumlar için)
                                            const updatedPaymentPlans = await getPaymentPlans(creditId)
                                            setOdemePlani(updatedPaymentPlans || [])

                                            // 5. Kredi durumunu güncelle
                                            const { updateCreditStatus } = await import("@/lib/api/credits")
                                            await updateCreditStatus(creditId)

                                            // 6. Kredi detayini yeniden çek
                                            const updatedCreditData = (await getCreditById(
                                              creditId,
                                              user!.id,
                                            )) as PopulatedCredit
                                            setKrediDetay(updatedCreditData)

                                            toast({
                                              title: "Ödeme Silindi",
                                              description: "Ödeme kaydı ve ilişkili taksitler başarıyla geri alındı.",
                                            })
                                          } else {
                                            toast({
                                              title: "Uyarı",
                                              description: "Ödeme kaydı zaten silinmiş veya bulunamadı.",
                                              variant: "destructive",
                                            })
                                          }
                                        } catch (error) {
                                          console.error("Payment deletion error:", error)
                                          toast({
                                            title: "Hata",
                                            description: "Ödeme silinirken bir sorun oluştu.",
                                            variant: "destructive",
                                          })
                                        }
                                      }}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Sil
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalHistoryPages > 1 && (
                      <div className="pt-4 mt-4 border-t border-gray-200 dark:border-white/10">
                        <PaginationModern
                          currentPage={currentPageHistory}
                          totalPages={totalHistoryPages}
                          totalItems={totalHistoryItems}
                          itemsPerPage={itemsPerPageHistory}
                          onPageChange={setCurrentPageHistory}
                          itemName="ödeme"
                        />
                      </div>
                    )}

                    {/* Summary - Genel bilgiler tabındaki tasarımla */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-emerald-500 border-emerald-500">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-lg">
                              <History className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                              <p className="text-sm text-emerald-100">Toplam Ödeme</p>
                              <p className="text-xl font-bold text-white">{odemeGecmisi.length}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-teal-500 border-teal-500">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-lg">
                              <Banknote className="h-5 w-5 text-teal-500" />
                            </div>
                            <div>
                              <p className="text-sm text-teal-100">Ödenen Tutar</p>
                              <p className="text-xl font-bold text-white">
                                {formatCurrency(odemeGecmisi.reduce((sum, p) => sum + p.amount, 0))}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-blue-500 border-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-lg">
                              <Calculator className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-sm text-blue-100">Ortalama Ödeme</p>
                              <p className="text-xl font-bold text-white">
                                {odemeGecmisi.length > 0
                                  ? formatCurrency(
                                      odemeGecmisi.reduce((sum, p) => sum + p.amount, 0) / odemeGecmisi.length,
                                    )
                                  : formatCurrency(0)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-white/60">
                    <History className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-white/40" />
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Ödeme Geçmişi Bulunamadı</h3>
                    <p className="text-sm">Bu kredi için henüz ödeme yapılmamış</p>
                  </div>
                )}
              </div>
            )}

            {/* Grafikler Tab */}
            {activeTab === "grafikler" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="shadow-sm border-gray-200 dark:border-white/10 dark:bg-black/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                        Borç Azalış Grafiği
                      </CardTitle>
                      <CardDescription className="dark:text-white/60">
                        Aylık borç azalışı ve ödenen tutar analizi
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          kalanBorc: {
                            label: "Kalan Borç",
                            color: "hsl(174, 72%, 40%)",
                          },
                          odenenTutar: {
                            label: "Ödenen Tutar",
                            color: "hsl(174, 65%, 56%)",
                          },
                        }}
                        className="h-[300px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={borcGrafigi} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                            <XAxis dataKey="ay" className="text-xs" tick={{ fontSize: 12 }} />
                            <YAxis
                              tickFormatter={(value) => formatCurrency(value)}
                              className="text-xs"
                              tick={{ fontSize: 12 }}
                            />
                            <ChartTooltip
                              content={<ChartTooltipContent />}
                              formatter={(value, name) => [formatCurrency(Number(value)), name]}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="kalanBorc"
                              stroke="var(--color-kalanBorc)"
                              strokeWidth={3}
                              dot={{ fill: "var(--color-kalanBorc)", strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, stroke: "var(--color-kalanBorc)", strokeWidth: 2 }}
                              name="Kalan Borç"
                            />
                            <Line
                              type="monotone"
                              dataKey="odenenTutar"
                              stroke="var(--color-odenenTutar)"
                              strokeWidth={3}
                              dot={{ fill: "var(--color-odenenTutar)", strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, stroke: "var(--color-odenenTutar)", strokeWidth: 2 }}
                              name="Ödenen Tutar"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm border-gray-200 dark:border-white/10 dark:bg-black/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                        Faiz/Ana Para Dağılımı
                      </CardTitle>
                      <CardDescription className="dark:text-white/60">
                        Ödeme dağılımınızın detaylı analizi
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          anaPara: {
                            label: "Ana Para",
                            color: "hsl(174, 72%, 40%)",
                          },
                          faiz: {
                            label: "Faiz",
                            color: "hsl(174, 65%, 56%)",
                          },
                        }}
                        className="h-[300px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={faizAnaParaDagilimi}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={120}
                              paddingAngle={5}
                              dataKey="value"
                              stroke="#fff"
                              strokeWidth={2}
                            >
                              {faizAnaParaDagilimi.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <ChartTooltip
                              content={<ChartTooltipContent />}
                              formatter={(value, name) => [formatCurrency(Number(value)), name]}
                            />
                            <Legend verticalAlign="bottom" height={36} formatter={(value) => value} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>

                      {/* Summary Cards */}
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950 dark:to-emerald-950 rounded-lg p-4 border border-teal-200 dark:border-teal-800">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-teal-600"></div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">Ana Para</p>
                              <p className="text-lg font-bold text-teal-600">
                                {formatCurrency(
                                  faizAnaParaDagilimi.find((item) => item.name === "Ana Para")?.value || 0,
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-emerald-600"></div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">Faiz</p>
                              <p className="text-lg font-bold text-emerald-600">
                                {formatCurrency(faizAnaParaDagilimi.find((item) => item.name === "Faiz")?.value || 0)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Charts Row */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="shadow-sm border-gray-200 dark:border-white/10 dark:bg-black/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                        Aylık Ödeme Trendi
                      </CardTitle>
                      <CardDescription className="dark:text-white/60">Son 6 ayın ödeme performansı</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          odeme: {
                            label: "Aylık Ödeme",
                            color: "hsl(142, 76%, 36%)",
                          },
                        }}
                        className="h-[250px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={borcGrafigi.map((item) => ({
                              ay: item.ay,
                              odeme: krediDetay?.monthly_payment || 0,
                            }))}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                            <XAxis dataKey="ay" className="text-xs" tick={{ fontSize: 12 }} />
                            <YAxis
                              tickFormatter={(value) => formatCurrency(value)}
                              className="text-xs"
                              tick={{ fontSize: 12 }}
                            />
                            <ChartTooltip
                              content={<ChartTooltipContent />}
                              formatter={(value, name) => [formatCurrency(Number(value)), name]}
                            />
                            <Line
                              type="monotone"
                              dataKey="odeme"
                              stroke="var(--color-odeme)"
                              strokeWidth={3}
                              dot={{ fill: "var(--color-odeme)", strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, stroke: "var(--color-odeme)", strokeWidth: 2 }}
                              name="Aylık Ödeme"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm border-gray-200 dark:border-white/10 dark:bg-black/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                        Ödeme İlerlemesi
                      </CardTitle>
                      <CardDescription className="dark:text-white/60">Kredi tamamlanma durumu</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center h-[250px]">
                      <div className="relative w-32 h-32 mb-4">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-gray-200 dark:text-white/30"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={`${2 * Math.PI * 40}`}
                            strokeDashoffset={`${2 * Math.PI * 40 * (1 - (krediDetay?.payment_progress || 0) / 100)}`}
                            className="text-teal-600 transition-all duration-1000 ease-out"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold text-teal-600">
                            {Math.round(krediDetay?.payment_progress || 0)}%
                          </span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-white/60 mb-2">Tamamlanan Ödeme</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {(krediDetay?.total_installments || 0) - (krediDetay?.remaining_installments || 0)} /{" "}
                          {krediDetay?.total_installments || 0} Taksit
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Ayarlar Tab */}
            {activeTab === "ayarlar" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="shadow-sm border-gray-200 dark:border-white/10 dark:bg-black/20">
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-white">Bildirim Ayarları</CardTitle>
                      <CardDescription className="dark:text-white/60">
                        Bu kredi için bildirim tercihleriniz
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Ödeme Hatırlatması</p>
                          <p className="text-sm text-gray-500 dark:text-white/60">
                            Ödeme tarihi yaklaştığında bildirim al
                          </p>
                        </div>
                        <Switch
                          checked={notificationSettings.paymentReminder}
                          onCheckedChange={(value) => handleNotificationToggle("paymentReminder", value)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Faiz Oranı Değişikliği</p>
                          <p className="text-sm text-gray-500 dark:text-white/60">
                            Faiz oranı değiştiğinde bildirim al
                          </p>
                        </div>
                        <Switch
                          checked={notificationSettings.interestRateChange}
                          onCheckedChange={(value) => handleNotificationToggle("interestRateChange", value)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Aylık Rapor</p>
                          <p className="text-sm text-gray-500 dark:text-white/60">Aylık kredi raporu gönder</p>
                        </div>
                        <Switch
                          checked={notificationSettings.monthlyReport}
                          onCheckedChange={(value) => handleNotificationToggle("monthlyReport", value)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm border-gray-200 dark:border-white/10 dark:bg-black/20">
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-white">Hızlı İşlemler</CardTitle>
                      <CardDescription className="dark:text-white/60">
                        Bu kredi için yapabileceğiniz işlemler
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full justify-start bg-teal-500 hover:bg-teal-600" onClick={handleOdemeYap}>
                        <Banknote className="mr-2 h-4 w-4" />
                        Ödeme Yap
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleDuzenle}>
                        <Settings className="mr-2 h-4 w-4" />
                        Kredi Bilgilerini Düzenle
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleHesapla}>
                        <Calculator className="mr-2 h-4 w-4" />
                        Erken Ödeme Hesapla
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleDownloadContract}>
                        <FileText className="mr-2 h-4 w-4" />
                        Kredi Sözleşmesi
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleDownloadPaymentPlan}>
                        <Download className="mr-2 h-4 w-4" />
                        Ödeme Planını İndir
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </Tabs>
      </div>
      {/* Hesaplama Modal */}
      <Dialog
        open={hesaplaModalOpen}
        onOpenChange={(open) => {
          setHesaplaModalOpen(open)
          if (!open) {
            setHesaplamaStep(1)
            setHesaplamaResult(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-4xl max-h-[92vh] dark:bg-black/95 dark:border-white/10 border-gray-200">
          <DialogHeader className="sticky top-0 bg-white dark:bg-black/95 z-10 pb-4 border-b border-gray-100 dark:border-white/10">
            <DialogTitle className="flex items-center gap-3 dark:text-white text-gray-900 text-xl">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-bold">{hesaplamaStep === 1 ? "Erken Ödeme Hesaplama" : "Hesaplama Sonuçları"}</div>
                <div className="text-sm font-normal text-gray-500 dark:text-white/60">
                  {hesaplamaStep === 1
                    ? "Faiz tasarrufu ve yeni ödeme planı hesaplama"
                    : "Detaylı analiz ve tasarruf raporu"}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(92vh-140px)] px-1">
            {hesaplamaStep === 1 ? (
              <div className="space-y-5 py-4">
              {/* Current Credit Info Card */}
              <div className="bg-white dark:bg-black/20 p-5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Mevcut Kredi Durumu
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-white/50 mb-1">Kalan Borç</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(dynamicStats.remainingDebt)}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-white/50 mb-1">Aylık Ödeme</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(krediDetay?.monthly_payment || 0)}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-white/50 mb-1">Kalan Taksit</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white">{dynamicStats.remainingInstallments} Ay</p>
                  </div>
                </div>
              </div>

              {/* Calculation Type */}
              <div className="space-y-2">
                <Label htmlFor="hesaplama-turu" className="dark:text-white text-sm font-medium text-gray-700">Hesaplama Türü</Label>
                <select
                  id="hesaplama-turu"
                  className="w-full p-3 border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-black/20 dark:text-white focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 outline-none transition-all text-sm"
                  value={hesaplamaForm.hesaplamaTuru}
                  onChange={(e) => setHesaplamaForm((prev) => ({ ...prev, hesaplamaTuru: e.target.value }))}
                >
                  <option value="erken-odeme">Erken Ödeme Hesaplama</option>
                  <option value="faiz-hesaplama">Faiz Hesaplama</option>
                  <option value="vade-uzatma">Vade Uzatma</option>
                </select>
              </div>

              {/* Payment Amount */}
              <div className="space-y-2">
                <Label htmlFor="erken-odeme-tutari" className="dark:text-white text-sm font-medium text-gray-700">Ödeme Tutarı</Label>
                <Input
                  id="erken-odeme-tutari"
                  type="number"
                  placeholder="Ödeme tutarını giriniz"
                  className="dark:bg-black/20 dark:border-white/10 dark:text-white border-gray-200 h-11 text-sm focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                  value={hesaplamaForm.erkenOdemeTutari}
                  onChange={(e) => setHesaplamaForm((prev) => ({ ...prev, erkenOdemeTutari: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs dark:bg-black/20 dark:border-white/10 dark:text-white hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border-gray-200"
                    onClick={() => setHesaplamaForm((prev) => ({ ...prev, erkenOdemeTutari: String(krediDetay?.monthly_payment || 0) }))}
                  >
                    Aylık Ödeme
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs dark:bg-black/20 dark:border-white/10 dark:text-white hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border-gray-200"
                    onClick={() => {
                      const pendingInstallments = odemePlani.filter(p => p.status === "pending")
                      const kalanAnaPara = pendingInstallments.reduce((sum, p) => sum + p.principal_amount, 0)
                      setHesaplamaForm((prev) => ({ ...prev, erkenOdemeTutari: String(kalanAnaPara) }))
                    }}
                  >
                    Tüm Borç
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3">
                <Button onClick={handleHesaplamaYap} className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 h-11 shadow-lg shadow-emerald-500/25">
                  <Calculator className="mr-2 h-4 w-4" />
                  Hesapla
                </Button>
                <Button variant="outline" onClick={() => setHesaplaModalOpen(false)} className="dark:bg-black/20 dark:border-white/10 dark:text-white border-gray-200 h-11 px-6">
                  İptal
                </Button>
              </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
              {hesaplamaResult && (
                <>
                  {/* Summary Card */}
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-xl text-white shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                          <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">Toplam Tasarruf</h3>
                          <p className="text-white/80 text-xs">Erken ödeme ile kazancınız</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-3xl font-bold mb-1">{formatCurrency(hesaplamaResult.toplamTasarruf)}</div>
                    <p className="text-white/70 text-sm">Faiz yükünden kurtulma oranı: %{((hesaplamaResult.faizTasarrufu / hesaplamaResult.eskiToplamFaiz) * 100).toFixed(1)}</p>
                  </div>

                  {/* Ana Para Breakdown - Grid */}
                  <div className="grid md:grid-cols-2 gap-3">
                  {/* Ana Para Info */}
                  <div className="bg-white dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Ödenen Ana Para</h4>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">{formatCurrency(hesaplamaResult.odenenAnaPara)}</p>
                    <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(hesaplamaResult.odenenAnaPara / dynamicStats.remainingDebt) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-white/50 mt-2">
                      %{((hesaplamaResult.odenenAnaPara / dynamicStats.remainingDebt) * 100).toFixed(1)} ödendi
                    </p>
                  </div>

                  {/* Kalan Ana Para Info */}
                  <div className="bg-white dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Kalan Ana Para</h4>
                    </div>
                    <p className="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-2">{formatCurrency(hesaplamaResult.kalanAnaPara)}</p>
                    <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-gray-400 to-gray-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(hesaplamaResult.kalanAnaPara / dynamicStats.remainingDebt) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-white/50 mt-2">
                      {hesaplamaResult.kalanAnaPara === 0 ? 'Kredi kapandı!' : `%${((hesaplamaResult.kalanAnaPara / dynamicStats.remainingDebt) * 100).toFixed(1)} kaldı`}
                    </p>
                  </div>
                  </div>

                  {/* Before vs After Comparison */}
                  <div className="grid md:grid-cols-2 gap-3">
                    {/* Before */}
                    <div className="bg-white dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Mevcut Durum</h4>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-white/50 mb-1">Toplam Ödeme</p>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(hesaplamaResult.eskiToplamOdeme)}</p>
                        </div>
                        <div className="pt-2 border-t border-gray-100 dark:border-white/5 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500 dark:text-white/50">Ana Para</span>
                            <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(dynamicStats.remainingDebt)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500 dark:text-white/50">Toplam Faiz</span>
                            <span className="font-medium text-orange-600 dark:text-orange-400">{formatCurrency(hesaplamaResult.eskiToplamFaiz)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* After */}
                    <div className="bg-white dark:bg-black/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/30">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Yeni Durum</h4>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-white/50 mb-1">Toplam Ödeme</p>
                          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(hesaplamaResult.yeniToplamOdeme)}</p>
                        </div>
                        <div className="pt-2 border-t border-gray-100 dark:border-white/5 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500 dark:text-white/50">Ana Para</span>
                            <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(hesaplamaResult.kalanAnaPara)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500 dark:text-white/50">Toplam Faiz</span>
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(hesaplamaResult.yeniToplamFaiz)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Savings Breakdown */}
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Faiz Tasarrufu</h4>
                      </div>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">{formatCurrency(hesaplamaResult.faizTasarrufu)}</p>
                      <p className="text-xs text-gray-500 dark:text-white/50">Faiz yükünden kurtulma</p>
                    </div>
                    <div className="bg-white dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                      <div className="flex items-center gap-2 mb-3">
                        <Banknote className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Yeni Aylık Ödeme</h4>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{formatCurrency(hesaplamaResult.yeniAylikOdeme)}</p>
                      <p className="text-xs text-gray-500 dark:text-white/50">
                        {hesaplamaResult.yeniAylikOdeme > 0 ? `${formatCurrency((krediDetay?.monthly_payment || 0) - hesaplamaResult.yeniAylikOdeme)} daha az` : 'Borç kapandı'}
                      </p>
                    </div>
                  </div>

                  {/* Info Note */}
                  {hesaplamaResult.yeniKalanBorc === 0 && (
                    <div className="bg-white dark:bg-black/20 p-4 rounded-xl border-l-4 border-emerald-500">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">Tebrikler! 🎉</h5>
                          <p className="text-xs text-gray-600 dark:text-white/70">
                            Bu ödeme ile kredinizi tamamen kapatmış olacaksınız.
                            Toplam <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(hesaplamaResult.eskiToplamFaiz)}</strong> faiz yükünden kurtuluyorsunuz!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3">
                    <Button onClick={handleHesaplamaPDFIndir} className="flex-1 h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25">
                      <Download className="mr-2 h-4 w-4" />
                      PDF İndir
                    </Button>
                    <Button onClick={() => setHesaplamaStep(1)} variant="outline" className="dark:bg-black/20 dark:border-white/10 dark:text-white border-gray-200 h-11 px-5">
                      Geri
                    </Button>
                    <Button onClick={() => setHesaplaModalOpen(false)} variant="outline" className="dark:bg-black/20 dark:border-white/10 dark:text-white border-gray-200 h-11 px-5">
                      Kapat
                    </Button>
                  </div>
                </>
              )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Ödeme Modal */}
      <Dialog open={odemeModalOpen} onOpenChange={setOdemeModalOpen}>
        <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-white">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Banknote className="h-5 w-5 text-white" />
              </div>
              Odeme Yap
            </DialogTitle>
            <DialogDescription className="dark:text-white/60">Kredi odemenizi guvenli sekilde yapabilirsiniz.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="odeme-tutari" className="dark:text-white">Odeme Tutari (TL)</Label>
              <Input
                id="odeme-tutari"
                type="number"
                className="dark:bg-gray-800 dark:border-white/10 dark:text-white h-12"
                value={odemeForm.odemeTutari}
                onChange={(e) =>
                  setOdemeForm((prev) => ({ ...prev, odemeTutari: Number.parseFloat(e.target.value) || 0 }))
                }
              />
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs dark:bg-gray-800 dark:border-white/10 dark:text-white"
                  onClick={() => setOdemeForm((prev) => ({ ...prev, odemeTutari: krediDetay?.monthly_payment || 0 }))}
                >
                  Aylik Odeme
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs dark:bg-gray-800 dark:border-white/10 dark:text-white"
                  onClick={() => setOdemeForm((prev) => ({ ...prev, odemeTutari: dynamicStats.remainingDebt }))}
                >
                  Tum Borc
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="odeme-kanali" className="dark:text-white">Odeme Kanali</Label>
              <select
                id="odeme-kanali"
                className="w-full p-3 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                value={odemeForm.odemeKanali}
                onChange={(e) => setOdemeForm((prev) => ({ ...prev, odemeKanali: e.target.value }))}
              >
                <option value="banka-havalesi">Banka Havalesi</option>
                <option value="kredi-karti">Kredi Karti</option>
                <option value="internet-bankaciligi">Internet Bankaciligi</option>
                <option value="mobil-odeme">Mobil Odeme</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aciklama">Açıklama (Opsiyonel)</Label>
              <Textarea
                id="aciklama"
                placeholder="Ödeme ile ilgili notunuz..."
                value={odemeForm.aciklama}
                onChange={(e) => setOdemeForm((prev) => ({ ...prev, aciklama: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
              <h4 className="font-medium text-emerald-800 mb-2">Ödeme Özeti</h4>
              <div className="text-sm text-emerald-700 space-y-1">
                <p>Ödeme Tutarı: {formatCurrency(odemeForm.odemeTutari)}</p>
                <p>Ödeme Kanalı: {odemeForm.odemeKanali.replace("-", " ").toUpperCase()}</p>
                <p>İşlem Ücreti: Ücretsiz</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleOdemeYapSubmit} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                <Banknote className="mr-2 h-4 w-4" />
                Ödemeyi Onayla
              </Button>
              <Button variant="outline" onClick={() => setOdemeModalOpen(false)}>
                İptal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
