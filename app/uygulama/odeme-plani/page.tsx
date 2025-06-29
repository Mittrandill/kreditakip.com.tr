"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

const getBankColor = (index: number): string => {
  const colors = ["#2563eb", "#d97706", "#dc2626", "#9333ea", "#0891b2", "#be185d", "#7c2d12"]
  return colors[index % colors.length]
}

function CalendarView({ payments }: { payments: PaymentWithCredit[] }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  const firstDay = new Date(currentYear, currentMonth, 1)
  const lastDay = new Date(currentYear, currentMonth + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1

  const uniqueBanks = Array.from(new Set(payments.map((p) => p.credits.banks.name))).map((bankName, index) => ({
    name: bankName,
    color: getBankColor(index),
  }))

  const paymentsByDay = payments.reduce(
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

  const dayNames = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"]

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
            className="flex items-center gap-2 bg-transparent"
          >
            <ChevronLeft className="h-4 w-4" />
            Önceki
          </Button>

          <h3 className="text-xl font-semibold">
            {monthNames[currentMonth]} {currentYear}
          </h3>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            className="flex items-center gap-2 bg-transparent"
          >
            Sonraki
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtrele
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {dayNames.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-50 rounded-t-lg">
            {day}
          </div>
        ))}

        {Array.from({ length: startingDayOfWeek }, (_, i) => (
          <div key={`empty-${i}`} className="p-2 h-32 bg-gray-50/30 rounded-lg"></div>
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
                  ? "bg-blue-50 border-blue-300 shadow-md ring-2 ring-blue-200"
                  : dayPayments.length > 0
                    ? "bg-white border-gray-300 hover:border-gray-400"
                    : "bg-gray-50/50 border-gray-200"
              }`}
            >
              <div
                className={`text-sm font-semibold mb-2 ${
                  isToday ? "text-blue-700" : dayPayments.length > 0 ? "text-gray-900" : "text-gray-500"
                }`}
              >
                {day}
                {isToday && <span className="ml-1 text-xs bg-gray-600 text-white px-1 rounded">Bugün</span>}
              </div>

              <div className="space-y-1 overflow-y-auto max-h-20">
                {dayPayments.map((payment, idx) => {
                  const bankColor = getBankColor(uniqueBanks.findIndex((b) => b.name === payment.credits.banks.name))
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
                  <div className="text-xs text-gray-600 bg-gray-100 p-1 rounded text-center">
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
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            Banka Renk Kodları
          </h4>
          <div className="flex flex-wrap gap-3">
            {uniqueBanks.map((bank) => (
              <div key={bank.name} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200">
                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: bank.color }}></div>
                <span className="text-sm font-medium text-gray-700">{bank.name}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200">
              <div className="w-3 h-3 rounded-full shadow-sm bg-emerald-500"></div>
              <span className="text-sm font-medium text-gray-700">Ödenen</span>
              <Check className="h-3 w-3 text-emerald-600" />
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

  // Unique banks for filter
  const uniqueBanks = Array.from(new Set(payments.map((p) => p.credits.banks.name)))
    .sort()
    .map((bankName, index) => ({
      name: bankName,
      color: getBankColor(index),
    }))

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

      console.log("🎉 Payment status updated successfully:", {
        paymentId,
        newStatus,
        installmentNumber: paymentToUpdate.installment_number,
        amount: paymentToUpdate.total_payment,
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
      {/* Header - keep existing */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Tüm Ödemeler</h3>
          <p className="text-sm text-gray-600">
            Toplam {filteredPayments.length} ödeme • Sayfa {currentPage} / {totalPages}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 w-fit bg-transparent" onClick={exportToExcel}>
          <Download className="h-4 w-4" />
          İndir
        </Button>
      </div>

      {/* Filters - keep existing */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Banka adı veya kredi kodu ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 min-w-[140px] bg-transparent">
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
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>
              <span className="flex items-center justify-between w-full">
                Tüm Durumlar
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{statusCounts.all}</span>
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
              <span className="flex items-center justify-between w-full">
                Bekleyen
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{statusCounts.pending}</span>
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("overdue")}>
              <span className="flex items-center justify-between w-full">
                Geciken
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{statusCounts.overdue}</span>
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Bank Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 min-w-[140px] bg-transparent">
              <CreditCard className="h-4 w-4" />
              {bankFilter === "all" ? "Tüm Bankalar" : bankFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setBankFilter("all")}>Tüm Bankalar</DropdownMenuItem>
            {uniqueBanks.map((bank) => (
              <DropdownMenuItem key={bank.name} onClick={() => setBankFilter(bank.name)}>
                <div className="flex items-center gap-2">
                  <BankLogo bankName={bank.name} size="sm" />
                  {bank.name}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Professional Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-white dark:bg-gray-900">
              <th className="font-semibold text-gray-700 dark:text-gray-300 p-4">Banka</th>
              <th className="font-semibold text-gray-700 dark:text-gray-300 p-4">Taksit No</th>
              <th className="font-semibold text-gray-700 dark:text-gray-300 p-4">Vade Tarihi</th>
              <th className="font-semibold text-gray-700 dark:text-gray-300 p-4">Ana Para</th>
              <th className="font-semibold text-gray-700 dark:text-gray-300 p-4">Faiz</th>
              <th className="font-semibold text-gray-700 dark:text-gray-300 p-4">Toplam</th>
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
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 ease-in-out ${
                    index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-800/50"
                  }`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <BankLogo bankName={payment.credits.banks.name} size="sm" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{payment.credits.banks.name}</div>
                        <div className="text-xs text-gray-500">{payment.credits.credit_code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-medium text-teal-700 dark:text-teal-400">#{payment.installment_number}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">{formatDate(payment.due_date)}</td>
                  <td className="p-4 font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(payment.principal_amount)}
                  </td>
                  <td className="p-4 font-medium text-orange-600">{formatCurrency(payment.interest_amount)}</td>
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

      {/* No payments message */}
      {currentPayments.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="font-medium text-gray-900 mb-2">Ödeme Bulunamadı</h3>
          <p className="text-sm">Seçilen filtrelere uygun ödeme bulunmuyor</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {startIndex + 1}-{Math.min(endIndex, filteredPayments.length)} arası, toplam {filteredPayments.length} ödeme
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
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
                    className="w-8 h-8 p-0"
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

  const thisMonthPendingPayments = payments.filter((p) => {
    const paymentDate = new Date(p.due_date)
    return (
      paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear && p.status === "pending"
    )
  })

  const totalMonthlyPayment = thisMonthPendingPayments.reduce((sum, p) => sum + p.total_payment, 0)

  const averagePayment =
    payments.length > 0 ? payments.reduce((sum, p) => sum + p.total_payment, 0) / payments.length : 0

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Ödeme Analizi</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Bu Ay Ödenecek</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalMonthlyPayment)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Ortalama Taksit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(averagePayment)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Aktif Kredi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{credits.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aylık Ödeme Trendi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="h-12 w-12 mx-auto mb-4" />
            <p>Ödeme trendi grafiği burada gösterilecek</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ReminderSettings({ payments }: { payments: PaymentWithCredit[] }) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Hatırlatıcı Ayarları</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>E-posta Hatırlatıcıları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>3 gün önceden hatırlat</span>
              <Button variant="outline" size="sm">
                Aktif
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span>1 gün önceden hatırlat</span>
              <Button variant="outline" size="sm">
                Aktif
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span>Vade günü hatırlat</span>
              <Button variant="outline" size="sm">
                Aktif
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SMS Hatırlatıcıları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>1 gün önceden SMS</span>
              <Button variant="outline" size="sm">
                Pasif
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span>Vade günü SMS</span>
              <Button variant="outline" size="sm">
                Pasif
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Yaklaşan Hatırlatıcılar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {payments
              .filter((p) => p.status === "pending")
              .slice(0, 5)
              .map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <BankLogo bankName={payment.credits.banks.name} size="sm" />
                    <div>
                      <div className="font-medium">{payment.credits.banks.name}</div>
                      <div className="text-sm text-gray-600">
                        {formatDate(payment.due_date)} - {formatCurrency(payment.total_payment)}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Bell className="h-4 w-4" />
                  </Button>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function OdemePlaniPage() {
  const { user } = useAuth()
  const [allPayments, setAllPayments] = useState<PaymentWithCredit[]>([])
  const [credits, setCredits] = useState<Credit[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState("takvim")

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      const [paymentsData, creditsData] = await Promise.all([
        getAllPayments(user!.id, 12, 12), // 12 ay geçmiş + 12 ay gelecek
        getUserCredits(user!.id),
      ])
      setAllPayments(paymentsData || [])
      setCredits(creditsData || [])
    } catch (error) {
      console.error("Error loading payment data:", error)
    } finally {
      setLoading(false)
    }
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
          <p className="text-gray-600">Ödeme planları yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-orange-600 to-red-700 text-white border-transparent shadow-xl rounded-xl">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Calendar className="h-8 w-8" />
                Ödeme Planı Yönetimi
              </h2>
              <p className="text-orange-100 text-lg">
                Tüm kredilerinizin ödeme planlarını görüntüleyin, takip edin ve hatırlatıcılar oluşturun
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" size="lg" className="bg-white text-orange-600 hover:bg-orange-50 border-white">
                <Download className="h-5 w-5" />
                PDF İndir
              </Button>
              <Button variant="outline" size="lg" className="bg-white text-orange-600 hover:bg-orange-50 border-white">
                <Bell className="h-5 w-5" />
                Hatırlatıcı Ekle
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modern Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <div className="border-b border-gray-100 bg-gray-50/50">
            <TabsList className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 bg-transparent h-auto p-2 gap-2">
              <TabsTrigger
                value="takvim"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Takvim</span>
              </TabsTrigger>
              <TabsTrigger
                value="liste"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Liste</span>
              </TabsTrigger>
              <TabsTrigger
                value="analiz"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Analiz</span>
              </TabsTrigger>
              <TabsTrigger
                value="hatirlatici"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100"
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
