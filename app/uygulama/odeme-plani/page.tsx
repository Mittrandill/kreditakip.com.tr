"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "@/components/metric-card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  TrendingUp,
  Bell,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Check,
  Search,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useSubscription } from "@/hooks/use-subscription" // Import subscription hook
import { useRouter } from "next/navigation" // Import router for redirect
import { getAllPayments } from "@/lib/api/payments"
import { getUserCredits } from "@/lib/api/credits"
import { formatCurrency, formatDate } from "@/lib/format"
import type { Credit, PaymentPlan } from "@/lib/types"
import { updatePaymentPlan, createPaymentHistory } from "@/lib/api/payments"
import BankLogo from "@/components/bank-logo"
import { useToast } from "@/components/ui/use-toast"
import * as XLSX from "xlsx"

interface PaymentWithCredit extends PaymentPlan {
  credits: Credit & {
    banks: { name: string; logo_url: string | null }
  }
}

// Türkiye'deki bankaların marka renklerine yakın renk paleti
const BANK_BRAND_COLORS: Record<string, string> = {
  // Devlet Bankaları
  "Ziraat Bankası": "#DC2626", // Kırmızı
  "Türkiye Halk Bankası": "#E30613", // Kırmızı
  "Vakıfbank": "#D97706", // Koyu Sarı
  "Türkiye Vakıflar Bankası": "#D97706", // Koyu Sarı
  "Türkiye Vakıflar Bankası T.A.O.": "#D97706", // Koyu Sarı
  "Vakıf Katılım Bankası": "#0066B3", // Mavi

  // Özel Bankalar
  "Akbank": "#ED1C24", // Kırmızı
  "Türkiye İş Bankası": "#1C6BAB", // Mavi
  "Türkiye Garanti Bankası": "#00A551", // Yeşil
  "Yapı ve Kredi Bankası": "#004B93", // Koyu Mavi
  "QNB Finansbank": "#8B1538", // Bordo
  "Denizbank": "#00A0DF", // Açık Mavi
  "ING Bank": "#FF6200", // Turuncu
  "TEB": "#0078BE", // Mavi
  "HSBC Bank": "#DB0011", // Kırmızı
  "Şekerbank": "#E30613", // Kırmızı
  "Anadolubank": "#003D79", // Mavi
  "Fibabanka": "#00539F", // Mavi
  "Turkish Bank": "#C1272D", // Kırmızı
  "Alternatif Bank": "#FF6600", // Turuncu
  "Burgan Bank": "#006BA6", // Mavi
  "Odea Bank": "#00AAD2", // Turkuaz

  // Katılım Bankaları
  "Albaraka Türk Katılım Bankası": "#006938", // Yeşil
  "Kuveyt Türk Katılım Bankası": "#009640", // Yeşil
  "Türkiye Finans Katılım Bankası": "#0072BC", // Mavi
  "Ziraat Katılım Bankası": "#6BA539", // Açık Yeşil
  "Emlak Katılım Bankası": "#003D79", // Mavi

  // Yabancı Bankalar
  "Citibank": "#003B6F", // Koyu Mavi
  "Deutsche Bank": "#0018A8", // Koyu Mavi
  "ICBC Turkey Bank": "#C8102E", // Kırmızı
  "Bank of China Turkey": "#BA0C2F", // Kırmızı
  "JPMorgan Chase Bank": "#117ACA", // Mavi
  "Société Générale": "#E60028", // Kırmızı
  "Rabobank": "#FF6200", // Turuncu
  "MUFG Bank Turkey": "#DA291C", // Kırmızı

  // Kalkınma ve Yatırım Bankaları
  "Türkiye Kalkınma ve Yatırım Bankası": "#003B71", // Koyu Mavi
  "Türkiye Sınai Kalkınma Bankası": "#005EB8", // Mavi
  "İller Bankası": "#00529B", // Mavi
  "Türk Eximbank": "#00447C", // Koyu Mavi
  "Aktif Yatırım Bankası": "#E31837", // Kırmızı
}

// Fallback renkler - marka rengi bulunamazsa kullanılacak
const FALLBACK_COLORS = [
  "#2563eb", "#dc2626", "#059669", "#d97706", "#7c3aed",
  "#db2777", "#0891b2", "#4f46e5", "#ea580c", "#15803d",
  "#9333ea", "#be185d", "#0e7490", "#6366f1", "#c2410c",
  "#047857", "#a21caf", "#0369a1", "#4338ca", "#b45309",
]

const getBankColor = (bankName: string | undefined): string => {
  // Eğer banka adı yoksa varsayılan renk döndür
  if (!bankName) {
    return FALLBACK_COLORS[0]
  }

  // Önce marka rengini kontrol et
  if (BANK_BRAND_COLORS[bankName]) {
    return BANK_BRAND_COLORS[bankName]
  }

  // Kısmi eşleşme dene (örn: "Türkiye Garanti Bankası A.Ş." için)
  for (const [key, color] of Object.entries(BANK_BRAND_COLORS)) {
    if (bankName.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(bankName.toLowerCase())) {
      return color
    }
  }

  // Marka rengi bulunamazsa hash ile fallback renklerinden seç
  let hash = 0
  for (let i = 0; i < bankName.length; i++) {
    const char = bankName.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  const index = Math.abs(hash) % FALLBACK_COLORS.length
  return FALLBACK_COLORS[index]
}

function CalendarView({ payments }: { payments: PaymentWithCredit[] }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  const firstDay = new Date(currentYear, currentMonth, 1)
  const lastDay = new Date(currentYear, currentMonth + 1, 0)
  const daysInMonth = lastDay.getDate()
  // Pazartesi'den başlatmak için: Pazar = 6, Pazartesi = 0, Salı = 1, ...
  const startingDayOfWeek = (firstDay.getDay() + 6) % 7

  // Filtreleme uygula
  const filteredPayments = payments.filter((payment) => {
    if (filterStatus === "all") return true
    if (filterStatus === "paid") return payment.status === "paid"
    if (filterStatus === "pending") return payment.status === "pending"
    if (filterStatus === "overdue") {
      return payment.status === "pending" && new Date(payment.due_date) < new Date()
    }
    return true
  })

  // Her banka için benzersiz renk - banka marka rengine göre
  const uniqueBanks = Array.from(
    new Map(filteredPayments.map((p) => [p.credits.bank_id, {
      id: p.credits.bank_id,
      name: p.credits.banks.name,
      color: getBankColor(p.credits.banks.name),
    }])).values()
  )

  const paymentsByDay = filteredPayments.reduce(
    (acc, payment) => {
      const paymentDate = new Date(payment.due_date)
      if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
        const day = paymentDate.getDate()
        if (!acc[day]) acc[day] = []
        acc[day].push(payment)
      }
      return acc
    },
    {} as Record<number, PaymentWithCredit[]>,
  )

  const monthNames = [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ]

  const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }

  const today = new Date()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevMonth}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <ChevronLeft className="h-4 w-4" />
            Önceki
          </Button>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {monthNames[currentMonth]} {currentYear}
          </h3>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Sonraki
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtrele: {filterStatus === "all" ? "Tümü" : filterStatus === "paid" ? "Ödendi" : filterStatus === "pending" ? "Bekliyor" : "Gecikmiş"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="dark:bg-gray-800 dark:border-gray-700">
              <DropdownMenuItem
                onClick={() => setFilterStatus("all")}
                className="dark:text-white dark:hover:bg-gray-700"
              >
                Tümü
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setFilterStatus("paid")}
                className="dark:text-white dark:hover:bg-gray-700"
              >
                Ödendi
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setFilterStatus("pending")}
                className="dark:text-white dark:hover:bg-gray-700"
              >
                Bekliyor
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setFilterStatus("overdue")}
                className="dark:text-white dark:hover:bg-gray-700"
              >
                Gecikmiş
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-t-lg"
          >
            {day}
          </div>
        ))}

        {Array.from({ length: startingDayOfWeek }, (_, i) => (
          <div key={`empty-${i}`} className="p-2 h-32 bg-gray-50/30 dark:bg-gray-800/30 rounded-lg"></div>
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const isToday =
            day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()
          const dayPayments = paymentsByDay[day] || []

          return (
            <div
              key={day}
              className={`p-2 h-32 border rounded-lg transition-all hover:shadow-md ${
                isToday
                  ? "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 shadow-md ring-2 ring-blue-200 dark:ring-blue-800"
                  : dayPayments.length > 0
                    ? "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
                    : "bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
              }`}
            >
              <div
                className={`text-sm font-semibold mb-2 ${
                  isToday
                    ? "text-blue-700 dark:text-blue-400"
                    : dayPayments.length > 0
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {day}
                {isToday && (
                  <span className="ml-1 text-xs bg-gray-600 dark:bg-gray-700 text-white px-1 rounded">Bugün</span>
                )}
              </div>

              <div className="space-y-1 overflow-y-auto max-h-20">
                {dayPayments.map((payment, idx) => {
                  const bankColor = getBankColor(payment.credits.banks.name)
                  const isOverdue = new Date(payment.due_date) < new Date() && payment.status === "pending"
                  const isPaid = payment.status === "paid"

                  return (
                    <div
                      key={idx}
                      className={`text-xs p-1.5 rounded-md text-white shadow-sm border-l-2 relative ${
                        isPaid ? "bg-emerald-500 border-emerald-600" : isOverdue ? "bg-red-500 border-red-600" : ""
                      }`}
                      style={{
                        backgroundColor: isPaid ? undefined : isOverdue ? undefined : bankColor,
                        borderLeftColor: isPaid ? undefined : isOverdue ? undefined : darkenColor(bankColor),
                      }}
                      title={`${payment.credits.banks.name} - ${formatCurrency(payment.total_payment)} - Taksit ${payment.installment_number}${isPaid ? " (Ödendi)" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{payment.credits.banks.name}</div>
                          <div className="text-xs opacity-90">{formatCurrency(payment.total_payment)}</div>
                        </div>
                        {isPaid && (
                          <div className="flex-shrink-0 ml-1">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {dayPayments.length > 3 && (
                  <div className="text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 p-1 rounded text-center">
                    +{dayPayments.length - 3} daha
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {uniqueBanks.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
            Banka Renk Kodları
          </h4>
          <div className="flex flex-wrap gap-3">
            {uniqueBanks.map((bank) => (
              <div
                key={bank.name}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: bank.color }}></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{bank.name}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
              <div className="w-3 h-3 rounded-full shadow-sm bg-emerald-500"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ödenen</span>
              <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function darkenColor(color: string): string {
  const hex = color.replace("#", "")
  const r = Number.parseInt(hex.substr(0, 2), 16)
  const g = Number.parseInt(hex.substr(2, 2), 16)
  const b = Number.parseInt(hex.substr(4, 2), 16)

  const darkenFactor = 0.8
  const newR = Math.floor(r * darkenFactor)
  const newG = Math.floor(g * darkenFactor)
  const newB = Math.floor(b * darkenFactor)

  return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`
}

function PaymentsList({
  payments,
  setAllPayments,
}: {
  payments: PaymentWithCredit[]
  setAllPayments?: (payments: PaymentWithCredit[]) => void
}) {
  const [filteredPayments, setFilteredPayments] = useState<PaymentWithCredit[]>([])
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid" | "overdue">("all")
  const [bankFilter, setBankFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [updatingPayments, setUpdatingPayments] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const itemsPerPage = 10

  // Unique banks for filter - banka marka rengine göre
  const uniqueBanks = Array.from(
    new Map(payments.map((p) => [p.credits.bank_id, {
      id: p.credits.bank_id,
      name: p.credits.banks.name,
      color: getBankColor(p.credits.banks.name),
    }])).values()
  ).sort((a, b) => a.name.localeCompare(b.name, 'tr'))

  useEffect(() => {
    let filtered = [...payments]

    // Filter out paid installments
    filtered = filtered.filter((payment) => payment.status !== "paid")

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "overdue") {
        filtered = filtered.filter((payment) => {
          const isOverdue = new Date(payment.due_date) < new Date() && payment.status === "pending"
          return isOverdue
        })
      } else {
        filtered = filtered.filter((payment) => payment.status === statusFilter)
      }
    }

    // Bank filter
    if (bankFilter !== "all") {
      filtered = filtered.filter((payment) => payment.credits.banks.name === bankFilter)
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (payment) =>
          payment.credits.banks.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.credits.credit_code.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Sort by date (oldest first)
    filtered.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())

    setFilteredPayments(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [payments, statusFilter, bankFilter, searchTerm])

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPayments = filteredPayments.slice(startIndex, endIndex)

  const handlePaymentStatusChange = async (paymentId: string, newStatus: "paid" | "pending") => {
    // Optimistic update - önce UI'ı güncelle
    const originalPayments = [...payments]

    // Find the payment being updated
    const paymentToUpdate = payments.find((p) => p.id === paymentId)
    if (!paymentToUpdate) return

    // Local state'i hemen güncelle
    const updatedPayments = payments.map((payment) =>
      payment.id === paymentId
        ? {
            ...payment,
            status: newStatus,
            payment_date: newStatus === "paid" ? new Date().toISOString().split("T")[0] : null,
          }
        : payment,
    )

    // UI'ı hemen güncelle (parent component'e bildir)
    setAllPayments?.(updatedPayments)

    // Loading state'i göster
    setUpdatingPayments((prev) => new Set(prev).add(paymentId))

    try {
      // 1. Payment plan'ı güncelle
      await updatePaymentPlan(paymentId, {
        status: newStatus,
        payment_date: newStatus === "paid" ? new Date().toISOString().split("T")[0] : null,
      })

      // 2. Eğer "paid" yapılıyorsa, payment history'ye kayıt ekle
      if (newStatus === "paid") {
        await createPaymentHistory({
          credit_id: paymentToUpdate.credit_id,
          payment_plan_id: paymentId,
          amount: paymentToUpdate.total_payment,
          payment_date: new Date().toISOString().split("T")[0],
          payment_channel: "Manuel İşaretleme",
          transaction_id: `TKS-${paymentToUpdate.installment_number}-${Date.now()}`,
          status: "completed",
          notes: null,
        })
      }

      // 3. ÖNEMLİ: Credits tablosunu güncelle
      const { updateCreditStatus } = await import("@/lib/api/credits")
      await updateCreditStatus(paymentToUpdate.credit_id)

      // Başarı toast'ı
      toast({
        title: newStatus === "paid" ? "Ödeme tamamlandı! ✅" : "Ödeme geri alındı! ↩️",
        description:
          newStatus === "paid"
            ? "Taksit ödendi olarak işaretlendi ve ödeme geçmişine eklendi."
            : "Taksit bekliyor olarak işaretlendi.",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error updating payment status:", error)

      // Hata durumunda rollback yap
      setAllPayments?.(originalPayments)

      // Hata toast'ı
      toast({
        title: "Hata! ❌",
        description: "Ödeme durumu güncellenemedi. Lütfen tekrar deneyin.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      // Loading state'i kaldır
      setUpdatingPayments((prev) => {
        const newSet = new Set(prev)
        newSet.delete(paymentId)
        return newSet
      })
    }
  }

  const getStatusInfo = (payment: PaymentWithCredit) => {
    const isOverdue = new Date(payment.due_date) < new Date() && payment.status === "pending"
    const isUpcoming = new Date(payment.due_date).getTime() - new Date().getTime() <= 7 * 24 * 60 * 60 * 1000

    if (payment.status === "paid") {
      return { label: "Ödendi", color: "text-emerald-600 bg-emerald-50", icon: CheckCircle }
    } else if (isOverdue) {
      return { label: "Gecikmiş", color: "text-red-600 bg-red-50", icon: AlertTriangle }
    } else if (isUpcoming && payment.status === "pending") {
      return { label: "Yaklaşan", color: "text-orange-600 bg-orange-50", icon: Clock }
    } else {
      return { label: "Bekliyor", color: "text-gray-600 bg-gray-50", icon: Calendar }
    }
  }

  const statusCounts = {
    all: payments.length,
    pending: payments.filter((p) => p.status === "pending").length,
    paid: payments.filter((p) => p.status === "paid").length,
    overdue: payments.filter((p) => {
      const isOverdue = new Date(p.due_date) < new Date() && p.status === "pending"
      return isOverdue
    }).length,
  }

  const exportToExcel = () => {
    const data = filteredPayments.map((payment) => ({
      Banka: payment.credits.banks.name,
      "Taksit No": payment.installment_number,
      "Vade Tarihi": formatDate(payment.due_date),
      "Ana Para": formatCurrency(payment.principal_amount),
      Faiz: formatCurrency(payment.interest_amount),
      Toplam: formatCurrency(payment.total_payment),
      Durum: payment.status === "paid" ? "Ödendi" : "Bekliyor",
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Ödemeler")
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "odemeler.xlsx"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Excel dosyası indirildi!",
      description: "Ödeme listeniz başarıyla indirildi.",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tüm Ödemeler</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Toplam {filteredPayments.length} ödeme • Sayfa {currentPage} / {totalPages}
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 min-w-[140px] bg-transparent dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          onClick={exportToExcel}
        >
          <Download className="h-4 w-4" />
          İndir
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <Input
            type="text"
            placeholder="Banka adı veya kredi kodu ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10"
          />
        </div>

        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 min-w-[140px] bg-transparent dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <Filter className="h-4 w-4" />
              {statusFilter === "all"
                ? "Tüm Durumlar"
                : statusFilter === "pending"
                  ? "Bekleyen"
                  : statusFilter === "paid"
                    ? "Ödenen"
                    : "Geciken"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 dark:bg-gray-900 dark:border-gray-700">
            <DropdownMenuItem
              onClick={() => setStatusFilter("all")}
              className="dark:hover:bg-gray-800 dark:text-gray-300"
            >
              <span className="flex items-center justify-between w-full">
                Tüm Durumlar
                <span className="text-xs bg-gray-100 dark:bg-gray-800 dark:text-gray-300 px-2 py-0.5 rounded">
                  {statusCounts.all}
                </span>
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setStatusFilter("pending")}
              className="dark:hover:bg-gray-800 dark:text-gray-300"
            >
              <span className="flex items-center justify-between w-full">
                Bekleyen
                <span className="text-xs bg-gray-100 dark:bg-gray-800 dark:text-gray-300 px-2 py-0.5 rounded">
                  {statusCounts.pending}
                </span>
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setStatusFilter("overdue")}
              className="dark:hover:bg-gray-800 dark:text-gray-300"
            >
              <span className="flex items-center justify-between w-full">
                Geciken
                <span className="text-xs bg-gray-100 dark:bg-gray-800 dark:text-gray-300 px-2 py-0.5 rounded">
                  {statusCounts.overdue}
                </span>
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Bank Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 min-w-[140px] bg-transparent dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <CreditCard className="h-4 w-4" />
              {bankFilter === "all" ? "Tüm Bankalar" : bankFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 dark:bg-gray-900 dark:border-gray-700">
            <DropdownMenuItem
              onClick={() => setBankFilter("all")}
              className="dark:hover:bg-gray-800 dark:text-gray-300"
            >
              Tüm Bankalar
            </DropdownMenuItem>
            {uniqueBanks.map((bank) => (
              <DropdownMenuItem
                key={bank.name}
                onClick={() => setBankFilter(bank.name)}
                className="dark:hover:bg-gray-800 dark:text-gray-300"
              >
                <div className="flex items-center gap-2">
                  <BankLogo bankName={bank.name} size="sm" />
                  {bank.name}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <th className="font-semibold text-gray-700 dark:text-gray-300 p-4 text-left">Banka</th>
              <th className="font-semibold text-gray-700 dark:text-gray-300 p-4 text-left">Taksit No</th>
              <th className="font-semibold text-gray-700 dark:text-gray-300 p-4 text-left">Vade Tarihi</th>
              <th className="font-semibold text-gray-700 dark:text-gray-300 p-4 text-left">Ana Para</th>
              <th className="font-semibold text-gray-700 dark:text-gray-300 p-4 text-left">Faiz</th>
              <th className="font-semibold text-gray-700 dark:text-gray-300 p-4 text-left">Toplam</th>
              <th className="w-[100px] text-right font-semibold text-gray-700 dark:text-gray-300 p-4">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {currentPayments.map((payment, index) => {
              const statusInfo = getStatusInfo(payment)
              const StatusIcon = statusInfo.icon
              const isUpdating = updatingPayments.has(payment.id)

              return (
                <tr
                  key={payment.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 ease-in-out border-b border-gray-100 dark:border-gray-800 ${
                    index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-800/50"
                  }`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <BankLogo
                        bankName={payment.credits.banks.name}
                        logoUrl={payment.credits.banks.logo_url ?? undefined}
                        size="sm"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{payment.credits.banks.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{payment.credits.credit_code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-medium text-teal-700 dark:text-teal-400">#{payment.installment_number}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">{formatDate(payment.due_date)}</td>
                  <td className="p-4 font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(payment.principal_amount)}
                  </td>
                  <td className="p-4 font-medium text-orange-600 dark:text-orange-400">
                    {formatCurrency(payment.interest_amount)}
                  </td>
                  <td className="p-4 font-bold text-lg text-gray-900 dark:text-white">
                    {formatCurrency(payment.total_payment)}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {payment.status === "pending" ? (
                        <Button
                          onClick={() => handlePaymentStatusChange(payment.id, "paid")}
                          disabled={isUpdating}
                          size="sm"
                          className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700"
                        >
                          {isUpdating ? (
                            <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                          ) : (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Ödendi
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handlePaymentStatusChange(payment.id, "pending")}
                          disabled={isUpdating}
                          size="sm"
                          className="h-8 px-3 text-xs bg-gradient-to-r from-orange-600 to-amber-700 text-white border-transparent hover:from-orange-700 hover:to-amber-800 shadow-lg"
                        >
                          {isUpdating ? (
                            <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                          ) : (
                            <>
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Geri Al
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {currentPayments.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">Ödeme Bulunamadı</h3>
          <p className="text-sm">Seçilen filtrelere uygun ödeme bulunmuyor</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {startIndex + 1}-{Math.min(endIndex, filteredPayments.length)} arası, toplam {filteredPayments.length} ödeme
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="h-4 w-4" />
              Önceki
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8 p-0 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Sonraki
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function PaymentAnalysis({ payments, credits }: { payments: PaymentWithCredit[]; credits: Credit[] }) {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const currentDate = new Date()

  // Bu ay ödenecek ödemeler
  const thisMonthPayments = payments.filter((p) => {
    const paymentDate = new Date(p.due_date)
    return (
      paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear && p.status === "pending"
    )
  })

  // Gecikmiş ödemeler
  const overduePayments = payments.filter((p) => {
    const paymentDate = new Date(p.due_date)
    return paymentDate < currentDate && p.status === "pending"
  })

  // Bu yıl ödenen taksitler
  const paidThisYear = payments.filter((p) => {
    const paymentDate = new Date(p.due_date)
    return paymentDate.getFullYear() === currentYear && p.status === "paid"
  })

  // Yaklaşan ödemeler (7 gün içinde)
  const upcomingPayments = payments.filter((p) => {
    const paymentDate = new Date(p.due_date)
    const daysDiff = Math.ceil((paymentDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff >= 0 && daysDiff <= 7 && p.status === "pending"
  })

  // Hesaplamalar
  const totalMonthlyPayment = thisMonthPayments.reduce((sum, p) => sum + p.total_payment, 0)
  const totalOverdueAmount = overduePayments.reduce((sum, p) => sum + p.total_payment, 0)
  const totalUpcomingAmount = upcomingPayments.reduce((sum, p) => sum + p.total_payment, 0)
  const averagePayment =
    payments.length > 0 ? payments.reduce((sum, p) => sum + p.total_payment, 0) / payments.length : 0
  const totalPaidThisYear = paidThisYear.reduce((sum, p) => sum + p.total_payment, 0)

  // Banka bazında dağılım
  const bankDistribution = payments.reduce(
    (acc, payment) => {
      const bankName = payment.credits.banks.name
      if (!acc[bankName]) {
        acc[bankName] = { total: 0, count: 0, pending: 0, paid: 0 }
      }
      acc[bankName].total += payment.total_payment
      acc[bankName].count += 1
      if (payment.status === "pending") {
        acc[bankName].pending += payment.total_payment
      } else if (payment.status === "paid") {
        acc[bankName].paid += payment.total_payment
      }
      return acc
    },
    {} as Record<string, { total: number; count: number; pending: number; paid: number }>,
  )

  // Aylık trend verisi (son 6 ay)
  const monthlyTrend = []
  for (let i = 5; i >= 0; i--) {
    const targetDate = new Date(currentYear, currentMonth - i, 1)
    const monthPayments = payments.filter((p) => {
      const paymentDate = new Date(p.due_date)
      return paymentDate.getMonth() === targetDate.getMonth() && paymentDate.getFullYear() === targetDate.getFullYear()
    })

    const monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]
    monthlyTrend.push({
      month: monthNames[targetDate.getMonth()],
      total: monthPayments.reduce((sum, p) => sum + p.total_payment, 0),
      paid: monthPayments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.total_payment, 0),
      pending: monthPayments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.total_payment, 0),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold dark:text-white">Ödeme Analizi</h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Son güncelleme: {new Date().toLocaleDateString("tr-TR")}
        </div>
      </div>

      {/* Ana Metrikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Bu Ay Ödenecek"
          value={formatCurrency(totalMonthlyPayment)}
          subtitle={`${thisMonthPayments.length} taksit`}
          color="blue"
          icon={<Calendar />}
        />
        <MetricCard
          title="Ortalama Taksit"
          value={formatCurrency(averagePayment)}
          subtitle="Tüm krediler ortalaması"
          color="emerald"
          icon={<TrendingUp />}
        />
        <MetricCard
          title="Aktif Kredi"
          value={credits.length}
          subtitle="Toplam kredi sayısı"
          color="purple"
          icon={<CreditCard />}
        />
        <MetricCard
          title="Gecikmiş Ödeme"
          value={formatCurrency(totalOverdueAmount)}
          subtitle={`${overduePayments.length} gecikmiş taksit`}
          color="orange"
          icon={<AlertTriangle />}
        />
      </div>

      {/* Yaklaşan Ödemeler */}
      {upcomingPayments.length > 0 && (
        <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-transparent shadow-lg">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Yaklaşan Ödemeler (7 Gün İçinde)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="text-2xl font-bold text-white">{formatCurrency(totalUpcomingAmount)}</div>
              <div className="text-sm text-purple-200">{upcomingPayments.length} taksit</div>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {upcomingPayments.slice(0, 5).map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between text-sm bg-purple-500/20 p-2 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <BankLogo
                      bankName={payment.credits.banks.name}
                      logoUrl={payment.credits.banks.logo_url ?? undefined}
                      size="sm"
                    />
                    <span className="font-medium text-white">{payment.credits.banks.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-white">{formatCurrency(payment.total_payment)}</div>
                    <div className="text-xs text-purple-200">{formatDate(payment.due_date)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <CreditCard className="h-5 w-5" />
              Banka Bazında Dağılım
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(bankDistribution)
                .sort(([, a], [, b]) => b.total - a.total)
                .slice(0, 5)
                .map(([bankName, data]) => {
                  // Find a payment associated with this bank to get the logo URL
                  const bankPayments = payments.filter((payment) => payment.credits.banks.name === bankName)

                  return (
                    <div key={bankName} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BankLogo bankName={bankName} logoUrl={bankPayments[0]?.credits.banks.logo_url ?? undefined} size="sm" />
                          <span className="font-medium text-sm dark:text-white">{bankName}</span>
                        </div>
                        <span className="text-sm font-semibold dark:text-white">{formatCurrency(data.total)}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.max(5, (data.total / Math.max(...Object.values(bankDistribution).map((d) => d.total))) * 100)}%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>{data.count} taksit</span>
                        <span>Bekleyen: {formatCurrency(data.pending)}</span>
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <TrendingUp className="h-5 w-5" />
              Aylık Ödeme Trendi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyTrend.map((month, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm dark:text-white">
                      {month.month} {currentYear}
                    </span>
                    <span className="text-sm font-semibold dark:text-white">{formatCurrency(month.total)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="flex h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 transition-all duration-300"
                        style={{
                          width: `${month.total > 0 ? Math.max(5, (month.paid / month.total) * 100) : 0}%`,
                        }}
                      ></div>
                      <div
                        className="bg-orange-400 transition-all duration-300"
                        style={{
                          width: `${month.total > 0 ? Math.max(5, (month.pending / month.total) * 100) : 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      Ödenen: {formatCurrency(month.paid)}
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      Bekleyen: {formatCurrency(month.pending)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <CheckCircle className="h-5 w-5" />
            {currentYear} Yılı Özeti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{paidThisYear.length}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ödenen Taksit</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalPaidThisYear)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Ödenen</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {payments.filter((p) => p.status === "pending").length}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Kalan Taksit</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ReminderSettings({ payments }: { payments: PaymentWithCredit[] }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [preferences, setPreferences] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  // Load preferences only if user is available, and this call is outside the return statement.
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (user) {
        try {
          setLoading(true)
          const { getNotificationPreferences } = await import("@/lib/api/notification-preferences")
          const prefs = await getNotificationPreferences(user!.id)
          setPreferences(prefs)
        } catch (error) {
          console.error("Error loading preferences:", error)
          toast({
            title: "Hata",
            description: "Bildirim tercihleri yüklenemedi",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      }
    }
    loadUserPreferences()
  }, [user, toast])

  const togglePreference = async (field: string, currentValue: boolean) => {
    if (!preferences) return

    setUpdating(field)
    try {
      const { toggleNotificationPreference } = await import("@/lib/api/notification-preferences")
      const updated = await toggleNotificationPreference(user!.id, field as any, !currentValue)
      setPreferences(updated)

      toast({
        title: "Başarılı",
        description: "Bildirim tercihi güncellendi",
      })
    } catch (error) {
      console.error("Error updating preference:", error)
      toast({
        title: "Hata",
        description: "Bildirim tercihi güncellenemedi",
        variant: "destructive",
      })
    } finally {
      setUpdating(null)
    }
  }

  // sendTestReminder fonksiyonu tamamen kaldırıldı

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (!preferences) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">Bildirim tercihleri yüklenemedi</p>
      </div>
    )
  }

  const upcomingPayments = payments.filter((p) => {
    const dueDate = new Date(p.due_date)
    const today = new Date()
    const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    return dueDate >= today && dueDate <= next7Days && p.status === "pending"
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold dark:text-white">Hatırlatıcı Ayarları</h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Son güncelleme: {new Date(preferences.updated_at).toLocaleDateString("tr-TR")}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <Bell className="h-5 w-5" />
              E-posta Hatırlatıcıları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium dark:text-white">3 gün önceden hatırlat</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">Vade tarihinden 3 gün önce e-posta gönder</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={preferences.email_3_days_before ? "default" : "outline"}
                  size="sm"
                  onClick={() => togglePreference("email_3_days_before", preferences.email_3_days_before)}
                  disabled={updating === "email_3_days_before"}
                  className={
                    !preferences.email_3_days_before
                      ? "dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      : ""
                  }
                >
                  {updating === "email_3_days_before" ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : preferences.email_3_days_before ? (
                    "Aktif"
                  ) : (
                    "Pasif"
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium dark:text-white">1 gün önceden hatırlat</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">Vade tarihinden 1 gün önce e-posta gönder</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={preferences.email_1_day_before ? "default" : "outline"}
                  size="sm"
                  onClick={() => togglePreference("email_1_day_before", preferences.email_1_day_before)}
                  disabled={updating === "email_1_day_before"}
                  className={
                    !preferences.email_1_day_before
                      ? "dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      : ""
                  }
                >
                  {updating === "email_1_day_before" ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : preferences.email_1_day_before ? (
                    "Aktif"
                  ) : (
                    "Pasif"
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium dark:text-white">Vade günü hatırlat</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">Vade gününde e-posta gönder</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={preferences.email_on_due_date ? "default" : "outline"}
                  size="sm"
                  onClick={() => togglePreference("email_on_due_date", preferences.email_on_due_date)}
                  disabled={updating === "email_on_due_date"}
                  className={
                    !preferences.email_on_due_date
                      ? "dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      : ""
                  }
                >
                  {updating === "email_on_due_date" ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : preferences.email_on_due_date ? (
                    "Aktif"
                  ) : (
                    "Pasif"
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium dark:text-white">Gecikme bildirimi</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">Vade geçtiğinde e-posta gönder</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={preferences.email_overdue ? "default" : "outline"}
                  size="sm"
                  onClick={() => togglePreference("email_overdue", preferences.email_overdue)}
                  disabled={updating === "email_overdue"}
                  className={
                    !preferences.email_overdue ? "dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800" : ""
                  }
                >
                  {updating === "email_overdue" ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : preferences.email_overdue ? (
                    "Aktif"
                  ) : (
                    "Pasif"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <Clock className="h-5 w-5" />
              Genel Ayarlar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium dark:text-white">E-posta bildirimleri</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tüm e-posta bildirimlerini aç/kapat</p>
              </div>
              <Button
                variant={preferences.email_enabled ? "default" : "outline"}
                size="sm"
                onClick={() => togglePreference("email_enabled", preferences.email_enabled)}
                disabled={updating === "email_enabled"}
                className={
                  !preferences.email_enabled ? "dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800" : ""
                }
              >
                {updating === "email_enabled" ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : preferences.email_enabled ? (
                  "Aktif"
                ) : (
                  "Pasif"
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium dark:text-white">Bildirim saati</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">Bildirimlerin gönderileceği saat</p>
              </div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {preferences.notification_time}
              </div>
            </div>

            <div className="pt-4 border-t dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">SMS Bildirimleri (Yakında)</div>
              <div className="flex items-center justify-between opacity-50">
                <span className="text-sm dark:text-gray-400">SMS bildirimleri</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="dark:border-gray-700 dark:text-gray-400 bg-transparent"
                >
                  Yakında
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Yaklaşan Hatırlatııcılar kartına koyu tema desteği eklendi */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Calendar className="h-5 w-5" />
            Yaklaşan Hatırlatıcılar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingPayments.length > 0 ? (
            <div className="space-y-3">
              {upcomingPayments.slice(0, 5).map((payment) => {
                const dueDate = new Date(payment.due_date)
                const today = new Date()
                const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

                return (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <BankLogo
                        bankName={payment.credits.banks.name}
                        logoUrl={payment.credits.banks.logo_url ?? undefined}
                        size="sm"
                      />
                      <div>
                        <div className="font-medium dark:text-white">{payment.credits.banks.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(payment.due_date)} - {formatCurrency(payment.total_payment)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-sm font-medium ${
                          daysUntilDue <= 1
                            ? "text-red-600 dark:text-red-400"
                            : daysUntilDue <= 3
                              ? "text-orange-600 dark:text-orange-400"
                              : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {daysUntilDue === 0 ? "Bugün" : daysUntilDue === 1 ? "Yarın" : `${daysUntilDue} gün kaldı`}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        #{payment.installment_number}. taksit
                      </div>
                    </div>
                  </div>
                )
              })}
              {upcomingPayments.length > 5 && (
                <div className="text-center text-sm text-gray-600 dark:text-gray-400 pt-2">
                  +{upcomingPayments.length - 5} ödeme daha
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Bell className="h-12 w-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
              <p className="font-medium dark:text-gray-300">Yaklaşan ödeme yok</p>
              <p className="text-sm">Önümüzdeki 7 gün içinde vadesi gelen ödeme bulunmuyor</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function OdemePlaniPage() {
  const { user } = useAuth()
  const { isPremium, loading: subscriptionLoading } = useSubscription() // Check premium status
  const router = useRouter() // Router for redirect
  const [allPayments, setAllPayments] = useState<PaymentWithCredit[]>([])
  const [credits, setCredits] = useState<Credit[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState("takvim")
  const { toast } = useToast()

  useEffect(() => {
    if (!subscriptionLoading && !isPremium) {
      router.push("/uygulama/premium")
    }
  }, [isPremium, subscriptionLoading, router])

  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          setLoading(true)
          const [paymentsData, creditsData] = await Promise.all([
            getAllPayments(user.id, 12, 12), // 12 ay geçmiş + 12 ay gelecek
            getUserCredits(user.id),
          ])
          setAllPayments(paymentsData || [])
          setCredits(creditsData || [])
        } catch (error) {
          console.error("Error loading payment data:", error)
          // Optionally show a toast for data loading error
          toast({
            title: "Veri Yükleme Hatası",
            description: "Ödeme planı ve kredi bilgileri yüklenemedi.",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      }
    }
    loadUserData()
  }, [user, toast])

  if (subscriptionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!isPremium) {
    return null
  }

  const thisMonthPayments = allPayments.filter((payment) => {
    const paymentDate = new Date(payment.due_date)
    const now = new Date()
    return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear()
  })

  const next7DaysPayments = allPayments.filter((payment) => {
    const paymentDate = new Date(payment.due_date)
    const now = new Date()
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return paymentDate >= now && paymentDate <= next7Days && payment.status === "pending"
  })

  const overduePayments = allPayments.filter((payment) => {
    const paymentDate = new Date(payment.due_date)
    const now = new Date()
    return paymentDate < now && payment.status === "pending"
  })

  const completedThisYear = allPayments.filter((payment) => {
    const paymentDate = new Date(payment.due_date)
    const now = new Date()
    return paymentDate.getFullYear() === now.getFullYear() && payment.status === "paid"
  }).length

  const thisMonthTotal = thisMonthPayments
    .filter((p) => p.status === "pending")
    .reduce((sum, payment) => sum + payment.total_payment, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Ödeme planları yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-purple-600 to-violet-700 text-white border-transparent shadow-xl rounded-xl">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Calendar className="h-8 w-8" />
                Ödeme Planı Yönetimi
              </h2>
              <p className="text-white-100 text-lg">
                Tüm kredilerinizin ödeme planlarını görüntüleyin, takip edin ve hatırlatıcılar oluşturun
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                size="lg"
                className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
                onClick={() => {
                  // PDF export functionality
                  const data = allPayments.map((payment) => ({
                    Banka: payment.credits.banks.name,
                    "Taksit No": payment.installment_number,
                    "Vade Tarihi": formatDate(payment.due_date),
                    "Ana Para": formatCurrency(payment.principal_amount),
                    Faiz: formatCurrency(payment.interest_amount),
                    Toplam: formatCurrency(payment.total_payment),
                    Durum: payment.status === "paid" ? "Ödendi" : "Bekliyor",
                  }))

                  const ws = XLSX.utils.json_to_sheet(data)
                  const wb = XLSX.utils.book_new()
                  XLSX.utils.book_append_sheet(wb, ws, "Ödeme Planı")
                  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })

                  const blob = new Blob([excelBuffer], {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
                  })

                  const url = URL.createObjectURL(blob)
                  const link = document.createElement("a")
                  link.href = url
                  link.download = "odeme-plani.xlsx"
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                  URL.revokeObjectURL(url)

                  toast({
                    title: "PDF dosyası indirildi!",
                    description: "Ödeme planınız başarıyla indirildi.",
                  })
                }}
              >
                <Download className="h-5 w-5" />
                PDF İndir
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
                onClick={() => {
                  setSelectedTab("hatirlatici")
                  toast({
                    title: "Hatırlatıcı sayfasına yönlendirildiniz",
                    description: "Hatırlatıcı ayarlarınızı buradan yapabilirsiniz.",
                  })
                }}
              >
                <Bell className="h-5 w-5" />
                Hatırlatıcı Ekle
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <div className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
            <TabsList className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 bg-transparent h-auto p-2 gap-2">
              <TabsTrigger
                value="takvim"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Takvim</span>
              </TabsTrigger>
              <TabsTrigger
                value="liste"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400"
              >
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Liste</span>
              </TabsTrigger>
              <TabsTrigger
                value="analiz"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Analiz</span>
              </TabsTrigger>
              <TabsTrigger
                value="hatirlatici"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400"
              >
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Hatırlatıcı</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="takvim">
              <CalendarView payments={allPayments} />
            </TabsContent>
            <TabsContent value="liste">
              <PaymentsList payments={allPayments} setAllPayments={setAllPayments} />
            </TabsContent>
            <TabsContent value="analiz">
              <PaymentAnalysis payments={allPayments} credits={credits} />
            </TabsContent>
            <TabsContent value="hatirlatici">
              <ReminderSettings payments={allPayments} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
