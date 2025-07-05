"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PaginationModern } from "@/components/ui/pagination-modern"
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
import {
  CreditCard,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  DollarSign,
  TrendingUp,
  ArrowUpDown,
  List,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  Percent,
  AlertTriangle,
  Eye,
} from "lucide-react"
import { BsFillGrid3X3GapFill } from "react-icons/bs"

import { useAuth } from "@/hooks/use-auth"
import { getCreditCards, getCreditCardSummary, getUpcomingDueDates, deleteCreditCard } from "@/lib/api/credit-cards"
import { formatCurrency, formatPercent } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import BankLogo from "@/components/bank-logo"
import { MetricCard } from "@/components/metric-card"

const getCardTypeBadgeClass = (type: string): string => {
  switch (type.toLowerCase()) {
    case "classic":
      return "bg-gradient-to-r from-gray-600 to-slate-700 text-white border-transparent hover:from-gray-700 hover:to-slate-800"
    case "gold":
      return "bg-gradient-to-r from-yellow-600 to-amber-700 text-white border-transparent hover:from-yellow-700 hover:to-amber-800"
    case "platinum":
      return "bg-gradient-to-r from-purple-600 to-violet-700 text-white border-transparent hover:from-purple-700 hover:to-violet-800"
    case "world":
      return "bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-transparent hover:from-blue-700 hover:to-indigo-800"
    default:
      return "bg-gradient-to-r from-gray-600 to-slate-700 text-white border-transparent hover:from-gray-700 hover:to-slate-800"
  }
}

const getCardTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "classic":
      return <CreditCard className="h-4 w-4" />
    case "gold":
      return <TrendingUp className="h-4 w-4" />
    case "platinum":
      return <Shield className="h-4 w-4" />
    case "world":
      return <DollarSign className="h-4 w-4" />
    default:
      return <CreditCard className="h-4 w-4" />
  }
}

const getStatusBadgeClass = (status: string): string => {
  switch (status.toLowerCase()) {
    case "aktif":
      return "bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-transparent hover:from-emerald-700 hover:to-teal-800"
    case "pasif":
      return "bg-gradient-to-r from-gray-600 to-slate-700 text-white border-transparent hover:from-gray-700 hover:to-slate-800"
    case "blokeli":
      return "bg-gradient-to-r from-red-600 to-rose-700 text-white border-transparent hover:from-red-700 hover:to-rose-800"
    case "iptal":
      return "bg-gradient-to-r from-orange-600 to-amber-700 text-white border-transparent hover:from-orange-700 hover:to-amber-800"
    default:
      return "bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-transparent hover:from-blue-700 hover:to-indigo-800"
  }
}

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "aktif":
      return <CheckCircle className="h-4 w-4" />
    case "pasif":
      return <Clock className="h-4 w-4" />
    case "blokeli":
      return <AlertCircle className="h-4 w-4" />
    case "iptal":
      return <AlertTriangle className="h-4 w-4" />
    default:
      return <Shield className="h-4 w-4" />
  }
}

export default function KrediKartlariPage() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const userId = user?.id

  const [creditCards, setCreditCards] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [upcomingDues, setUpcomingDues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cardToDelete, setCardToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [activeTab, setActiveTab] = useState("tumKartlar")
  const [viewMode, setViewMode] = useState("cards")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPageCards = 8
  const itemsPerPageTable = 8

  useEffect(() => {
    if (userId) {
      fetchCreditCards()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [userId, authLoading])

  const fetchCreditCards = async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const [cardsData, summaryData, upcomingData] = await Promise.all([
        getCreditCards(userId),
        getCreditCardSummary(userId),
        getUpcomingDueDates(userId, 30),
      ])

      setCreditCards(cardsData || [])
      setSummary(summaryData || {})
      setUpcomingDues(upcomingData || [])
    } catch (err: any) {
      console.error("Kredi kartları yüklenirken hata:", err)
      setError("Kredi kartları yüklenirken bir sorun oluştu.")
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedCards = creditCards
    .filter((card) => {
      if (activeTab === "classicKartlar" && card.card_type !== "Classic") return false
      if (activeTab === "goldKartlar" && card.card_type !== "Gold") return false
      if (activeTab === "platinumKartlar" && card.card_type !== "Platinum") return false
      if (activeTab === "worldKartlar" && card.card_type !== "World") return false

      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase()
        if (
          !card.card_name.toLowerCase().includes(lowerSearchTerm) &&
          !card.bank_name.toLowerCase().includes(lowerSearchTerm) &&
          !card.card_type.toLowerCase().includes(lowerSearchTerm)
        ) {
          return false
        }
      }

      return true
    })
    .sort((a, b) => {
      let comparison = 0
      if (sortBy === "created_at") {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else if (sortBy === "credit_limit") {
        comparison = (a.credit_limit || 0) - (b.credit_limit || 0)
      } else if (sortBy === "current_debt") {
        comparison = (a.current_debt || 0) - (b.current_debt || 0)
      } else if (sortBy === "card_name") {
        comparison = a.card_name.localeCompare(b.card_name, "tr")
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

  const currentItemsPerPage = viewMode === "cards" ? itemsPerPageCards : itemsPerPageTable
  const totalItems = filteredAndSortedCards.length
  const totalPages = Math.ceil(totalItems / currentItemsPerPage)
  const startIndex = (currentPage - 1) * currentItemsPerPage
  const endIndex = startIndex + currentItemsPerPage
  const currentCards = filteredAndSortedCards.slice(startIndex, endIndex)

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
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(column)
      setSortOrder("desc")
    }
    resetPagination()
  }

  const openCreateDialog = () => {
    router.push("/uygulama/kredi-kartlari/ekle")
  }

  const openEditDialog = (card: any) => {
    router.push(`/uygulama/kredi-kartlari/${card.id}/duzenle`)
  }

  const handleDeleteCard = async () => {
    if (!userId || !cardToDelete) return

    setIsDeleting(true)
    try {
      await deleteCreditCard(userId, cardToDelete.id)
      setCreditCards((prev) => prev.filter((c) => c.id !== cardToDelete.id))
      toast({ title: "Başarılı", description: "Kredi kartı başarıyla silindi." })
    } catch (err: any) {
      console.error("Kredi kartı silme hatası:", err)
      toast({ title: "Hata", description: "Kredi kartı silinirken bir sorun oluştu.", variant: "destructive" })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setCardToDelete(null)
    }
  }

  const openDeleteDialog = (card: any) => {
    setCardToDelete(card)
    setDeleteDialogOpen(true)
  }

  // Metrics calculations
  const totalCreditLimit = creditCards.reduce((sum, card) => sum + (card.credit_limit || 0), 0)
  const totalCurrentDebt = creditCards.reduce((sum, card) => sum + (card.current_debt || 0), 0)
  const totalAvailableLimit = totalCreditLimit - totalCurrentDebt
  const averageUtilization = totalCreditLimit > 0 ? (totalCurrentDebt / totalCreditLimit) * 100 : 0
  const activeCardsCount = creditCards.filter((c) => c.status === "aktif").length

  const cardTypeDistribution = creditCards.reduce(
    (acc, card) => {
      const type = card.card_type.toLowerCase()
      if (type === "classic") acc.classic++
      else if (type === "gold") acc.gold++
      else if (type === "platinum") acc.platinum++
      else if (type === "world") acc.world++
      return acc
    },
    { classic: 0, gold: 0, platinum: 0, world: 0 },
  )

  if (authLoading || loading) {
    return (
      <div className="flex flex-col gap-4 md:gap-6 items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
        <p className="text-lg text-gray-600">Veriler yükleniyor...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg text-red-600">Kredi kartlarını görüntülemek için lütfen giriş yapın.</p>
        <Button
          onClick={() => router.push("/giris")}
          className="mt-4 bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white"
        >
          Giriş Yap
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-purple-600 to-pink-700 text-white border-transparent shadow-xl rounded-xl">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <CreditCard className="h-8 w-8" />
                Kredi Kartı Yönetimi
              </h2>
              <p className="opacity-90 text-lg">Kredi kartlarınızı takip edin ve yönetin.</p>
            </div>
            <Button
              variant="outline-white"
              onClick={openCreateDialog}
              size="lg"      
            >
              <Plus className="h-5 w-5 mr-2" />
              Yeni Kart Ekle
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Due Dates Alert */}
      {upcomingDues.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Yaklaşan Son Ödeme Tarihleri
            </CardTitle>
            <CardDescription className="text-orange-700">
              Önümüzdeki 30 gün içinde {upcomingDues.length} kartınızın son ödeme tarihi var.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingDues.slice(0, 3).map((card) => (
                <div key={card.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{card.card_name}</p>
                      <p className="text-sm text-gray-600">
                        Son ödeme: {new Date(card.next_due_date).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-orange-600">{formatCurrency(card.minimumPayment || 0)}</p>
                    <p className="text-sm text-gray-600">minimum ödeme</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Toplam Limit"
          value={formatCurrency(totalCreditLimit)}
          subtitle="kredi limiti"
          color="blue"
          icon={<DollarSign />}
        />
        <MetricCard
          title="Mevcut Borç"
          value={formatCurrency(totalCurrentDebt)}
          subtitle="toplam borç"
          color="red"
          icon={<CreditCard />}
        />
        <MetricCard
          title="Kullanılabilir"
          value={formatCurrency(totalAvailableLimit)}
          subtitle="kalan limit"
          color="emerald"
          icon={<CheckCircle />}
        />
        <MetricCard
          title="Kullanım Oranı"
          value={formatPercent(averageUtilization)}
          subtitle="ortalama oran"
          color="orange"
          icon={<Percent />}
        />
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="border-b border-gray-100 bg-gray-50/50">
            <TabsList className="grid grid-cols-2 sm:grid-cols-5 bg-transparent h-auto p-2 gap-2">
              <TabsTrigger
                value="tumKartlar"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <CreditCard className="h-4 w-4" />
                Tümü
              </TabsTrigger>
              <TabsTrigger
                value="classicKartlar"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <CreditCard className="h-4 w-4" />
                Classic
              </TabsTrigger>
              <TabsTrigger
                value="goldKartlar"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <TrendingUp className="h-4 w-4" />
                Gold
              </TabsTrigger>
              <TabsTrigger
                value="platinumKartlar"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <Shield className="h-4 w-4" />
                Platinum
              </TabsTrigger>
              <TabsTrigger
                value="worldKartlar"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <DollarSign className="h-4 w-4" />
                World
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-4 border-b border-gray-100 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Kart ara..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-8 w-[250px]"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                      <ArrowUpDown className="h-4 w-4" />
                      Sırala:{" "}
                      {sortBy === "created_at"
                        ? "Tarih"
                        : sortBy === "credit_limit"
                          ? "Limit"
                          : sortBy === "current_debt"
                            ? "Borç"
                            : "İsim"}{" "}
                      ({sortOrder === "asc" ? "Artan" : "Azalan"})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => handleSort("created_at")}>Tarihe Göre</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort("credit_limit")}>Limite Göre</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort("current_debt")}>Borça Göre</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort("card_name")}>İsme Göre</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === "cards" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleViewModeChange("cards")}
                  className={`rounded-r-none ${viewMode === "cards" ? "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800" : ""}`}
                >
                  <BsFillGrid3X3GapFill className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleViewModeChange("table")}
                  className={`rounded-l-none ${viewMode === "table" ? "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800" : ""}`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {currentCards.length === 0 && (
              <div className="text-center py-10">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Kredi Kartı Bulunamadı</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || activeTab !== "tumKartlar"
                    ? "Bu filtreye uygun kredi kartı bulunamadı."
                    : "Henüz kredi kartı eklenmemiş."}
                </p>
                {!searchTerm && activeTab === "tumKartlar" && (
                  <Button
                    onClick={openCreateDialog}
                    className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    İlk Kartınızı Ekleyin
                  </Button>
                )}
              </div>
            )}

            {viewMode === "cards" && currentCards.length > 0 && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {currentCards.map((card) => {
                    // Credit card gradient based on type
                    const getCardGradient = (type: string) => {
                      switch (type.toLowerCase()) {
                        case "classic":
                          return "from-slate-700 via-slate-800 to-slate-900"
                        case "gold":
                          return "from-yellow-600 via-yellow-700 to-amber-800"
                        case "platinum":
                          return "from-purple-700 via-purple-800 to-indigo-900"
                        case "world":
                          return "from-blue-700 via-blue-800 to-indigo-900"
                        default:
                          return "from-slate-700 via-slate-800 to-slate-900"
                      }
                    }

                    return (
                      <Card
                        key={card.id}
                        className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl border-gray-200 overflow-hidden"
                      >
                        <CardContent className="p-0">
                          {/* Credit Card Design */}
                          <div className="relative">
                            <div
                              className={`relative w-full h-48 rounded-t-xl overflow-hidden bg-gradient-to-br ${getCardGradient(card.card_type)}`}
                            >
                              {/* Card Background Pattern */}
                              <div className="absolute inset-0">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-12 translate-x-12"></div>
                                <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-10 -translate-x-10"></div>
                                <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-white/3 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                              </div>

                              {/* Card Content */}
                              <div className="relative z-10 p-5 h-full flex flex-col justify-between text-white">
                                {/* Top Section - Bank Logo and Card Icon */}
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-2">
                                    <BankLogo
                                      bankName={card.bank_name || "Bilinmeyen Banka"}
                                      logoUrl={card.bank_logo_url}
                                      size="sm"
                                      className="ring-1 ring-white/20 shadow-md bg-white/10 backdrop-blur-sm"
                                    />
                                    <div>
                                      <h3 className="font-semibold text-base leading-tight">{card.card_name}</h3>
                                      <p className="text-white/80 text-xs">{card.bank_name}</p>
                                    </div>
                                  </div>
                                  <CreditCard className="h-6 w-6 text-white/80" />
                                </div>

                                {/* Middle Section - Card Number */}
                                <div className="my-3">
                                  <p className="text-xs text-white/60 mb-1">Kart Numarası</p>
                                  <p className="font-mono text-base tracking-wider">
                                    {card.card_number ? `****${card.card_number.slice(-4)}` : "****3456"}
                                  </p>
                                </div>

                                {/* Bottom Section - Limit and Due Date */}
                                <div className="flex items-end justify-between">
                                  <div>
                                    <p className="text-white/60 text-xs">Limit</p>
                                    <p className="font-semibold text-sm">{formatCurrency(card.credit_limit || 0)}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-white/60 text-xs">Son Ödeme</p>
                                    <p className="font-semibold text-sm">
                                      {card.next_due_date
                                        ? new Date(card.next_due_date).toLocaleDateString("tr-TR")
                                        : "25.01.2025"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="p-4">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 bg-transparent"
                                onClick={() => router.push(`/uygulama/kredi-kartlari/${card.id}`)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Detay
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 bg-transparent"
                                onClick={() => openEditDialog(card)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 bg-transparent"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/uygulama/kredi-kartlari/${card.id}/odeme-gecmisi`)}
                                  >
                                    Ödeme Geçmişi
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>Rapor Al</DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600" onClick={() => openDeleteDialog(card)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Sil
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
                {totalPages > 1 && (
                  <PaginationModern
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={currentItemsPerPage}
                    onPageChange={setCurrentPage}
                    itemName="kart"
                  />
                )}
              </div>
            )}

            {viewMode === "table" && currentCards.length > 0 && (
              <div className="space-y-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-white dark:bg-gray-900">
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Kart Adı</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Banka</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Tür</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Limit</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Kullanım</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Durum</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Tarih</TableHead>
                        <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300">
                          İşlemler
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentCards.map((card, index) => {
                        const utilizationRate =
                          card.credit_limit > 0 ? (card.current_debt / card.credit_limit) * 100 : 0

                        return (
                          <TableRow
                            key={card.id}
                            className={`hover:bg-emerald-50 dark:hover:bg-gray-800 transition-colors duration-150 ease-in-out ${
                              index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-800/50"
                            }`}
                          >
                            <TableCell>
                              <div className="flex items-center gap-6">
                                <BankLogo
                                  bankName={card.bank_name || "Bilinmeyen Banka"}
                                  logoUrl={card.bank_logo_url}
                                  size="md"
                                  className="ring-1 ring-emerald-200 bg-white"
                                />
                                <div>
                                  <span className="font-medium text-gray-900 dark:text-white block">
                                    {card.card_name}
                                  </span>
                                  <span className="text-xs text-emerald-600 font-medium">
                                    {card.card_number ? `****${card.card_number.slice(-4)}` : "****3456"}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-300">{card.bank_name}</TableCell>
                            <TableCell>
                              <Badge className={getCardTypeBadgeClass(card.card_type)}>
                                {getCardTypeIcon(card.card_type)}
                                <span className="ml-1">{card.card_type}</span>
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(card.credit_limit || 0)}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">{formatCurrency(card.current_debt)}</span>
                                  <span
                                    className={`text-xs font-medium ${
                                      utilizationRate > 80
                                        ? "text-red-600"
                                        : utilizationRate > 50
                                          ? "text-orange-600"
                                          : "text-emerald-600"
                                    }`}
                                  >
                                    {utilizationRate.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                      utilizationRate > 80
                                        ? "bg-red-500"
                                        : utilizationRate > 50
                                          ? "bg-orange-500"
                                          : "bg-emerald-500"
                                    }`}
                                    style={{ width: `${Math.min(100, utilizationRate)}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusBadgeClass(card.status || "aktif")}>
                                {getStatusIcon(card.status || "aktif")}
                                <span className="ml-1">{card.status || "Aktif"}</span>
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-400">
                              {format(new Date(card.created_at), "dd.MM.yyyy")}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-teal-900/20"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Actions</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => router.push(`/uygulama/kredi-kartlari/${card.id}`)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Detayları Gör
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openEditDialog(card)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Düzenle
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600" onClick={() => openDeleteDialog(card)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Sil
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
                {totalPages > 1 && (
                  <PaginationModern
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={currentItemsPerPage}
                    onPageChange={setCurrentPage}
                    itemName="kart"
                  />
                )}
              </div>
            )}
          </div>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kredi Kartını Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu kredi kartını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCard}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Sil
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
