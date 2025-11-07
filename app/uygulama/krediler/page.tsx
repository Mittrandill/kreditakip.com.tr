"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { MetricCard } from "@/components/metric-card"
import BankLogo from "@/components/bank-logo"
import { PaginationModern } from "@/components/ui/pagination-modern"
import {
  CreditCard,
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpDown,
  List,
  Archive,
  AlertCircle,
  Wallet,
  Loader2,
} from "lucide-react"

import { BsFillGrid3X3GapFill } from "react-icons/bs"

import { useAuth } from "@/hooks/use-auth"
import { getCredits, deleteCredit as apiDeleteCredit, getCreditById } from "@/lib/api/credits"
import { getPaymentPlans } from "@/lib/api/payments"
import type { Credit, Bank, CreditType, PaymentPlan } from "@/lib/types"
import { formatCurrency, formatPercent, formatNumber } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"
import { updateCreditStatus } from "@/lib/api/credits"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface PopulatedCredit extends Credit {
  banks: Pick<Bank, "id" | "name" | "logo_url"> | null
  credit_types: Pick<CreditType, "id" | "name"> | null
  nextPaymentAmount?: number // En yakın ödenmemiş taksitin tutarı
}

const getStatusIcon = (durum: string, gecikmeGunu: number) => {
  if (gecikmeGunu > 0) return <AlertTriangle className="h-4 w-4 text-white" />
  switch (durum) {
    case "active":
      return <CheckCircle className="h-4 w-4 text-white" />
    case "closed":
      return <Archive className="h-4 w-4 text-white" />
    case "overdue":
      return <AlertTriangle className="h-4 w-4 text-white" />
    default:
      return <Clock className="h-4 w-4 text-white" />
  }
}

const getStatusBadgeText = (durum: string, gecikmeGunu: number): string => {
  if (gecikmeGunu > 0) return `${gecikmeGunu} gün gecikmiş`
  switch (durum) {
    case "active":
      return "Aktif"
    case "closed":
      return "Kapalı"
    case "overdue":
      return "Gecikmiş"
    default:
      return durum
  }
}

const getStatusBadgeClass = (durum: string, gecikmeGunu: number): string => {
  if (gecikmeGunu > 0)
    return "bg-gradient-to-r from-red-600 to-rose-700 text-white border-transparent hover:from-red-700 hover:to-rose-800"
  switch (durum) {
    case "active":
      return "bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-transparent hover:from-emerald-700 hover:to-teal-800"
    case "closed":
      return "bg-gradient-to-r from-gray-600 to-slate-700 text-white border-transparent hover:from-gray-700 hover:to-slate-800"
    case "overdue":
      return "bg-gradient-to-r from-red-600 to-rose-700 text-white border-transparent hover:from-red-700 hover:to-rose-800"
    default:
      return "bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-transparent hover:from-blue-700 hover:to-indigo-800"
  }
}

export default function KredilerPage() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [allCredits, setAllCredits] = useState<PopulatedCredit[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState("tumKrediler")
  const [viewMode, setViewMode] = useState("table") // Changed from "cards" to "table"
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("sonOdemeTarihi")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [creditToDelete, setCreditToDelete] = useState<string | null>(null)

  const itemsPerPageCards = 8
  const itemsPerPageTable = 8

  useEffect(() => {
    let isMounted = true

    async function fetchData() {
      if (user?.id && isMounted) {
        setLoadingData(true)
        setError(null)
        try {
          const creditsData = (await getCredits(user.id)) as PopulatedCredit[]

          if (isMounted && creditsData) {
            // Her kredi için ödeme planlarını çek ve dinamik hesaplama yap
            const updatedCredits = await Promise.all(
              creditsData.map(async (credit) => {
                try {
                  // Kredi durumunu güncelle
                  await updateCreditStatus(credit.id)

                  // Güncellenmiş kredi bilgilerini çek
                  const updatedCredit = await getCreditById(credit.id, user.id)

                  // Ödeme planını çek ve en yakın ödenmemiş taksitin tutarını hesapla
                  const paymentPlans = (await getPaymentPlans(credit.id)) as PaymentPlan[]
                  let nextPaymentAmount = updatedCredit.monthly_payment

                  if (paymentPlans && paymentPlans.length > 0) {
                    const nextUnpaidInstallment = paymentPlans
                      .filter((p) => p.status === "pending")
                      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]

                    if (nextUnpaidInstallment) {
                      nextPaymentAmount = nextUnpaidInstallment.total_payment
                    }
                  }

                  return {
                    ...updatedCredit,
                    nextPaymentAmount,
                  } as PopulatedCredit
                } catch (error) {
                  console.error(`Error updating credit ${credit.id}:`, error)
                  return {
                    ...credit,
                    nextPaymentAmount: credit.monthly_payment,
                  } as PopulatedCredit // Hata durumunda orijinal krediyi döndür
                }
              }),
            )

            setAllCredits(updatedCredits || [])
          }
        } catch (err) {
          console.error("Krediler data fetch error:", err)
          if (isMounted) {
            setError("Krediler yüklenirken bir hata oluştu.")
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
      isMounted = false
    }
  }, [user, authLoading])

  const filteredAndSortedCredits = useMemo(() => {
    const filtered = allCredits.filter((kredi) => {
      const matchesSearch =
        kredi.banks?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kredi.credit_types?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kredi.credit_code?.toLowerCase().includes(searchTerm.toLowerCase())

      switch (activeTab) {
        case "aktifKrediler":
          return matchesSearch && kredi.status === "active"
        case "gecikmisKrediler":
          return matchesSearch && (kredi.status === "overdue" || (kredi.overdue_days || 0) > 0)
        case "kapaliKrediler":
          return matchesSearch && kredi.status === "closed"
        default:
          return matchesSearch
      }
    })

    if (sortBy === "bankaAdi") {
      filtered.sort((a, b) => {
        const comparison = (a.banks?.name || "").localeCompare(b.banks?.name || "")
        return sortOrder === "asc" ? comparison : -comparison
      })
    } else if (sortBy === "tur") {
      filtered.sort((a, b) => {
        const comparison = (a.credit_types?.name || "").localeCompare(b.credit_types?.name || "")
        return sortOrder === "asc" ? comparison : -comparison
      })
    } else if (sortBy === "kalanBorc") {
      filtered.sort((a, b) => {
        const comparison = a.remaining_debt - b.remaining_debt
        return sortOrder === "asc" ? comparison : -comparison
      })
    } else if (sortBy === "sonOdemeTarihi" && filtered.every((k) => k.last_payment_date)) {
      filtered.sort((a, b) => {
        const dateA = new Date(a.last_payment_date!).getTime()
        const dateB = new Date(b.last_payment_date!).getTime()
        const comparison = dateA - dateB
        return sortOrder === "asc" ? comparison : -comparison
      })
    } else if (sortBy === "faizOrani") {
      filtered.sort((a, b) => {
        const comparison = (a.interest_rate || 0) - (b.interest_rate || 0)
        return sortOrder === "asc" ? comparison : -comparison
      })
    }

    return filtered
  }, [allCredits, searchTerm, activeTab, sortBy, sortOrder])

  const currentItemsPerPage = viewMode === "cards" ? itemsPerPageCards : itemsPerPageTable
  const totalItems = filteredAndSortedCredits.length
  const totalPages = Math.ceil(totalItems / currentItemsPerPage)
  const startIndex = (currentPage - 1) * currentItemsPerPage
  const endIndex = startIndex + currentItemsPerPage
  const currentItems = filteredAndSortedCredits.slice(startIndex, endIndex)

  const resetPagination = () => setCurrentPage(1)

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    resetPagination()
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    resetPagination()
  }

  const handleViewModeChange = (mode: string) => {
    setViewMode(mode)
    resetPagination()
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  const handleDeleteCredit = async (creditId: string) => {
    setCreditToDelete(creditId)
    setShowDeleteDialog(true)
  }

  const confirmDeleteCredit = async () => {
    if (!creditToDelete) return

    try {
      await apiDeleteCredit(creditToDelete)
      setAllCredits((prev) => prev.filter((c) => c.id !== creditToDelete))
      toast({ title: "Başarılı", description: "Kredi başarıyla silindi." })
    } catch (error) {
      console.error("Kredi silinirken hata:", error)
      toast({ title: "Hata", description: "Kredi silinirken bir sorun oluştu.", variant: "destructive" })
    } finally {
      setShowDeleteDialog(false)
      setCreditToDelete(null)
    }
  }

  // Metric calculations - nextPaymentAmount kullanarak toplam sonraki ödeme hesapla
  const activeCreditsList = allCredits.filter((c) => c.status === "active")
  const totalActiveCredits = activeCreditsList.length
  const totalRemainingDebt = activeCreditsList.reduce((sum, c) => sum + c.remaining_debt, 0)
  const totalNextPayments = activeCreditsList.reduce((sum, c) => sum + (c.nextPaymentAmount || c.monthly_payment), 0)
  const overdueCreditsCount = allCredits.filter((c) => c.status === "overdue" || (c.overdue_days || 0) > 0).length

  if (authLoading || loadingData) {
    return (
      <div className="flex flex-col gap-4 md:gap-6 items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
        <p className="text-lg text-gray-600">Veriler yükleniyor...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg text-red-600">{error}</p>
        {!user && (
          <Button onClick={() => router.push("/giris")} className="mt-4">
            Giriş Yap
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-transparent shadow-xl rounded-xl">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Wallet className="h-8 w-8" />
                Kredi Portföy Yönetimi
              </h2>
              <p className="text-blue-100 text-lg">
                Tüm kredi hesaplarınızı tek yerden yönetin, takip edin ve optimize edin
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                size="lg"
                className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
                onClick={() => router.push("/uygulama/krediler/pdf-odeme-plani")}
              >
                <Plus className="h-5 w-5 mr-2" />
                PDF Ödeme Planı Ekle
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Aktif Kredi"
          value={formatNumber(totalActiveCredits)}
          subtitle="adet"
          color="blue"
          icon={<CreditCard />}
        />
        <MetricCard
          title="Toplam Borç"
          value={formatCurrency(totalRemainingDebt)}
          subtitle="Kalan ana para"
          color="emerald"
          icon={<DollarSign />}
        />
        <MetricCard
          title="Toplam Sonraki Ödeme"
          value={formatCurrency(totalNextPayments)}
          subtitle="Yaklaşan ödemeler"
          color="purple"
          icon={<Calendar />}
        />
        <MetricCard
          title="Gecikmiş Kredi"
          value={formatNumber(overdueCreditsCount)}
          subtitle="adet"
          color="orange"
          icon={<AlertTriangle />}
        />
      </div>

      {/* Modern Tabs */}
      <div className="bg-white dark:bg-black/20 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-emerald-900/10">
            <TabsList className="grid grid-cols-4 bg-transparent h-auto p-2 gap-2">
              <TabsTrigger
                value="tumKrediler"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-100 dark:data-[state=active]:bg-emerald-900/20 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Tüm Krediler</span>
                <span className="sm:hidden font-medium">Tümü</span>
              </TabsTrigger>
              <TabsTrigger
                value="aktifKrediler"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-100 dark:data-[state=active]:bg-emerald-900/20 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <CheckCircle className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Aktif</span>
                <span className="sm:hidden font-medium">Aktif</span>
              </TabsTrigger>
              <TabsTrigger
                value="gecikmisKrediler"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-100 dark:data-[state=active]:bg-emerald-900/20 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <AlertCircle className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Gecikmiş</span>
                <span className="sm:hidden font-medium">Gecikmiş</span>
              </TabsTrigger>
              <TabsTrigger
                value="kapaliKrediler"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-100 dark:data-[state=active]:bg-emerald-900/20 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <Archive className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Kapalı</span>
                <span className="sm:hidden font-medium">Kapalı</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Search, Sort and View Toggle */}
          <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-white dark:bg-black/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Kredi ara..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-8 w-[250px]"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 bg-transparent dark:bg-black/10 dark:border-white/10 dark:text-white"
                    >
                      <ArrowUpDown className="h-4 w-4" />
                      Sırala: {sortBy === "kalanBorc" ? "Kalan Borç" : "Son Ödeme Tarihi"} (
                      {sortOrder === "asc" ? "Artan" : "Azalan"})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="dark:bg-black/10 dark:border-white/10">
                    <DropdownMenuItem
                      onClick={() => handleSort("kalanBorc")}
                      className="dark:text-white dark:hover:bg-white/10"
                    >
                      Kalan Borca Göre
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleSort("sonOdemeTarihi")}
                      className="dark:text-white dark:hover:bg-white/10"
                    >
                      Son Ödeme Tarihine Göre
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* View Mode Toggle */}
              <div className="flex border rounded-lg dark:border-white/10">
                <Button
                  variant={viewMode === "cards" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleViewModeChange("cards")}
                  className={`rounded-r-none ${viewMode === "cards" ? "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800" : "dark:text-white dark:hover:bg-white/10"}`}
                >
                  <BsFillGrid3X3GapFill className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleViewModeChange("table")}
                  className={`rounded-l-none ${viewMode === "table" ? "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800" : "dark:text-white dark:hover:bg-white/10"}`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 dark:bg-black/20">
            {currentItems.length === 0 && !loadingData && (
              <div className="text-center py-10">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400 dark:text-white/40" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Kredi Bulunamadı</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
                  {activeTab === "tumKrediler" ? "Hiç kredi eklenmemiş." : "Bu filtreye uygun kredi bulunamadı."}
                </p>
                <div className="mt-6">
                  <Button
                    onClick={() => router.push("/uygulama/krediler/kredi-ekle")}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                  >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    Yeni Kredi Ekle
                  </Button>
                </div>
              </div>
            )}
            {viewMode === "cards" && currentItems.length > 0 ? (
              /* Cards View */
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {currentItems.map((kredi) => (
                    <Card
                      key={kredi.id}
                      className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl border-gray-200 dark:border-white/10 overflow-hidden dark:bg-black/10"
                    >
                      <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-emerald-900/20 dark:to-emerald-900/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <BankLogo
                                bankName={kredi.banks?.name || "Bilinmeyen Banka"}
                                logoUrl={kredi.banks?.logo_url ?? undefined}
                                size="md"
                                className="ring-2 ring-white dark:ring-white/20 shadow-lg"
                              />
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-2.5 w-2.5 text-white" />
                              </div>
                            </div>
                            <div>
                              <CardTitle className="text-lg text-gray-900 dark:text-white">
                                {kredi.banks?.name || "N/A"}
                              </CardTitle>
                              <CardDescription className="text-emerald-600 dark:text-emerald-400 font-medium">
                                {kredi.credit_types?.name || "N/A"}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge className={getStatusBadgeClass(kredi.status, kredi.overdue_days || 0)}>
                            {getStatusIcon(kredi.status, kredi.overdue_days || 0)}
                            {getStatusBadgeText(kredi.status, kredi.overdue_days || 0)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-5 pt-4 dark:bg-black/10">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-white/60">Kalan Borç</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(kredi.remaining_debt)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-white/60">Sonraki Ödeme</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(kredi.nextPaymentAmount || kredi.monthly_payment)}
                            </p>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500 dark:text-white/60">Ödeme İlerlemesi</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {formatPercent(kredi.payment_progress || 0)}
                            </span>
                          </div>
                          <Progress value={kredi.payment_progress || 0} className="h-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 dark:text-white/60">Faiz Oranı</p>
                            <p className="font-medium text-orange-600 dark:text-orange-400">
                              {formatPercent(kredi.interest_rate)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-white/60">Kalan Taksit</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {kredi.remaining_installments || 0}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-gray-300 dark:border-white/10 text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-400 bg-transparent"
                            onClick={() => router.push(`/uygulama/kredi-detay/${kredi.id}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Detay
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300 dark:border-white/10 text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-400 bg-transparent"
                            onClick={() => router.push(`/uygulama/kredi-duzenle/${kredi.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-gray-300 dark:border-white/10 text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-400 bg-transparent"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="dark:bg-black/10 dark:border-white/10">
                              <DropdownMenuItem
                                onClick={() => router.push(`/uygulama/kredi-detay/${kredi.id}/odeme-plani`)}
                                className="dark:text-white dark:hover:bg-white/10"
                              >
                                Ödeme Planı
                              </DropdownMenuItem>
                              <DropdownMenuItem className="dark:text-white dark:hover:bg-white/10">
                                Rapor Al
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 dark:text-red-400"
                                onClick={() => handleDeleteCredit(kredi.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Sil
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {totalItems > 0 && (
                  <PaginationModern
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={currentItemsPerPage}
                    onPageChange={setCurrentPage}
                    itemName="kredi"
                  />
                )}
              </div>
            ) : viewMode === "table" && currentItems.length > 0 ? (
              /* Table View */
              <div className="space-y-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-white dark:bg-black/20 border-b dark:border-white/10">
                        <TableHead
                          className="font-semibold text-gray-700 dark:text-white/70 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400"
                          onClick={() => handleSort("bankaAdi")}
                        >
                          <div className="flex items-center gap-1">
                            Banka
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </TableHead>
                        <TableHead
                          className="font-semibold text-gray-700 dark:text-white/70 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400"
                          onClick={() => handleSort("tur")}
                        >
                          <div className="flex items-center gap-1">
                            Tür
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </TableHead>
                        <TableHead
                          className="font-semibold text-gray-700 dark:text-white/70 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400"
                          onClick={() => handleSort("kalanBorc")}
                        >
                          <div className="flex items-center gap-1">
                            Kalan Borç
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </TableHead>
                        <TableHead
                          className="font-semibold text-gray-700 dark:text-white/70 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400"
                          onClick={() => handleSort("sonOdemeTarihi")}
                        >
                          <div className="flex items-center gap-1">
                            Sonraki Ödeme
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </TableHead>
                        <TableHead
                          className="font-semibold text-gray-700 dark:text-white/70 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400"
                          onClick={() => handleSort("faizOrani")}
                        >
                          <div className="flex items-center gap-1">
                            Faiz Oranı
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-white/70">İlerleme</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-white/70">Durum</TableHead>
                        <TableHead className="w-[50px] text-right font-semibold text-gray-700 dark:text-white/70">
                          İşlemler
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentItems.map((kredi, index) => (
                        <TableRow
                          key={kredi.id}
                          onClick={() => router.push(`/uygulama/kredi-detay/${kredi.id}`)}
                          className={`cursor-pointer hover:bg-emerald-50 dark:hover:bg-white/10 transition-colors duration-150 ease-in-out ${
                            index % 2 === 0 ? "bg-white dark:bg-black/20" : "bg-gray-50/50 dark:bg-black/10"
                          }`}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <BankLogo
                                bankName={kredi.banks?.name || "Bilinmeyen Banka"}
                                logoUrl={kredi.banks?.logo_url ?? undefined}
                                size="md"
                                className="ring-1 ring-emerald-200 dark:ring-emerald-900/30 bg-white dark:bg-black/10"
                              />
                              <div>
                                <span className="font-medium text-gray-900 dark:text-white block">
                                  {kredi.banks?.name || "N/A"}
                                </span>
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                  {kredi.credit_code}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-white/70">
                            {kredi.credit_types?.name || "N/A"}
                          </TableCell>
                          <TableCell className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(kredi.remaining_debt)}
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-white/70">
                            {formatCurrency(kredi.nextPaymentAmount || kredi.monthly_payment)}
                          </TableCell>
                          <TableCell className="font-medium text-orange-600 dark:text-orange-400">
                            {formatPercent(kredi.interest_rate)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={kredi.payment_progress || 0} className="h-2 w-16" />
                              <span className="text-sm font-medium text-gray-600 dark:text-white/70">
                                {formatPercent(kredi.payment_progress || 0)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${getStatusBadgeClass(kredi.status, kredi.overdue_days || 0)} flex items-center gap-1`}
                            >
                              {getStatusIcon(kredi.status, kredi.overdue_days || 0)}
                              {getStatusBadgeText(kredi.status, kredi.overdue_days || 0)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-teal-900/20 dark:text-white/70"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="dark:bg-black/10 dark:border-white/10">
                                <DropdownMenuItem
                                  onClick={() => router.push(`/uygulama/kredi-detay/${kredi.id}`)}
                                  className="dark:text-white dark:hover:bg-white/10"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Detayları Gör
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => router.push(`/uygulama/kredi-duzenle/${kredi.id}`)}
                                  className="dark:text-white dark:hover:bg-white/10"
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Düzenle
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600 dark:text-red-400 dark:hover:bg-white/10"
                                  onClick={() => handleDeleteCredit(kredi.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Sil
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {totalItems > 0 && (
                  <PaginationModern
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={currentItemsPerPage}
                    onPageChange={setCurrentPage}
                    itemName="kredi"
                  />
                )}
              </div>
            ) : null}
          </div>
        </Tabs>
      </div>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="dark:bg-black/10 dark:border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">Krediyi Sil</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-white/70">
              Bu hesabı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteDialog(false)
                setCreditToDelete(null)
              }}
              className="border-gray-300 dark:border-white/10 text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/10"
            >
              İptal
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCredit} className="bg-red-600 hover:bg-red-700 text-white">
              <Trash2 className="h-4 w-4 mr-2" />
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
