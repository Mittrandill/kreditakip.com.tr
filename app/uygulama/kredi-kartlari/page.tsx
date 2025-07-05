"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
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
  Eye,
  Wifi,
  Calendar,
  Star,
  Zap,
} from "lucide-react"
import { BsFillGrid3X3GapFill } from "react-icons/bs"

import { useAuth } from "@/hooks/use-auth"
import { getCreditCards, getCreditCardSummary, getUpcomingDueDates, deleteCreditCard } from "@/lib/api/credit-cards"
import { formatCurrency, formatPercent } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import BankLogo from "@/components/bank-logo"
import { MetricCard } from "@/components/metric-card"
import { maskCardNumber, getCardBrand } from "@/lib/utils/encryption"

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
      return <Star className="h-4 w-4" />
    case "platinum":
      return <Shield className="h-4 w-4" />
    case "world":
      return <Zap className="h-4 w-4" />
    default:
      return <CreditCard className="h-4 w-4" />
  }
}

const getStatusBadgeClass = (status: boolean): string => {
  return status
    ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-transparent hover:from-emerald-700 hover:to-teal-800"
    : "bg-gradient-to-r from-gray-600 to-slate-700 text-white border-transparent hover:from-gray-700 hover:to-slate-800"
}

const getStatusIcon = (status: boolean) => {
  return status ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />
}

// Gelişmiş kart gradyanları
const getCardGradient = (type: string) => {
  switch (type.toLowerCase()) {
    case "classic":
      return "from-slate-800 via-slate-900 to-black"
    case "gold":
      return "from-yellow-500 via-yellow-600 to-amber-700"
    case "platinum":
      return "from-purple-600 via-purple-700 to-indigo-800"
    case "world":
      return "from-blue-600 via-blue-700 to-indigo-800"
    default:
      return "from-slate-800 via-slate-900 to-black"
  }
}

// Kart türüne göre özel efektler
const getCardEffects = (type: string) => {
  switch (type.toLowerCase()) {
    case "gold":
      return "shadow-yellow-500/20"
    case "platinum":
      return "shadow-purple-500/20"
    case "world":
      return "shadow-blue-500/20"
    default:
      return "shadow-gray-500/20"
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

  const itemsPerPageCards = 9
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

      console.log("🔄 Kredi kartları yüklendi:", cardsData)
      console.log("📊 Özet veriler:", summaryData)
      console.log("⏰ Yaklaşan ödemeler:", upcomingData)

      setCreditCards(cardsData || [])
      setSummary(summaryData || {})
      setUpcomingDues(upcomingData || [])
    } catch (err: any) {
      console.error("❌ Kredi kartları yüklenirken hata:", err)
      setError("Kredi kartları yüklenirken bir sorun oluştu.")
      toast({
        title: "Hata",
        description: "Kredi kartları yüklenirken bir sorun oluştu.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedCards = creditCards
    .filter((card) => {
      // Filter by active/inactive status
      if (activeTab === "aktifKartlar" && !card.is_active) return false
      if (activeTab === "pasifKartlar" && card.is_active) return false

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
    if (!cardToDelete) return

    setIsDeleting(true)
    try {
      await deleteCreditCard(cardToDelete.id)
      setCreditCards((prev) => prev.filter((c) => c.id !== cardToDelete.id))
      toast({ title: "Başarılı", description: "Kredi kartı başarıyla silindi." })

      // Refresh data after deletion
      await fetchCreditCards()
    } catch (err: any) {
      console.error("❌ Kredi kartı silme hatası:", err)
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
  const activeCardsCount = creditCards.filter((c) => c.is_active).length

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
              variant="outline"
              onClick={openCreateDialog}
              size="lg"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 text-white"
            >
              <Plus className="h-5 w-5 mr-2" />
              Yeni Kart Ekle
            </Button>
          </div>
        </CardContent>
      </Card>

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
            <TabsList className="grid grid-cols-3 bg-transparent h-auto p-2 gap-2">
              <TabsTrigger
                value="tumKartlar"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <CreditCard className="h-4 w-4" />
                Tüm Kartlar ({creditCards.length})
              </TabsTrigger>
              <TabsTrigger
                value="aktifKartlar"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <CheckCircle className="h-4 w-4" />
                Aktif Kartlar ({activeCardsCount})
              </TabsTrigger>
              <TabsTrigger
                value="pasifKartlar"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <Clock className="h-4 w-4" />
                Pasif Kartlar ({creditCards.length - activeCardsCount})
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
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {currentCards.map((card) => {
                    return (
                      <Card
                        key={card.id}
                        className="group relative overflow-hidden rounded-2xl border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] bg-white"
                      >
                        <CardContent className="p-0">
                          {/* Premium Credit Card Design */}
                          <div
                            className={`relative w-full h-56 bg-gradient-to-br ${getCardGradient(card.card_type)} ${getCardEffects(card.card_type)}`}
                            style={{
                              background:
                                card.card_type.toLowerCase() === "gold"
                                  ? "linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)"
                                  : card.card_type.toLowerCase() === "platinum"
                                    ? "linear-gradient(135deg, #E6E6FA 0%, #9370DB 50%, #4B0082 100%)"
                                    : card.card_type.toLowerCase() === "world"
                                      ? "linear-gradient(135deg, #1E90FF 0%, #0000CD 50%, #000080 100%)"
                                      : "linear-gradient(135deg, #2F2F2F 0%, #1C1C1C 50%, #000000 100%)",
                            }}
                          >
                            {/* Card Background Patterns */}
                            <div className="absolute inset-0 opacity-20">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
                              <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                            </div>

                            {/* Card Content */}
                            <div className="relative z-10 p-4 h-full flex flex-col justify-between text-white">
                              {/* Top Section - Bank Logo and Status */}
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <BankLogo
                                    bankName={card.bank_name || "Bilinmeyen Banka"}
                                    logoUrl={card.banks?.logo_url}
                                    size="sm"
                                    className="ring-1 ring-white/30 shadow-lg bg-white/20 backdrop-blur-md rounded-md"
                                  />
                                  <div>
                                    <h3 className="font-bold text-sm leading-tight">{card.card_name}</h3>
                                    <p className="text-white/80 text-xs">{card.bank_name}</p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <Wifi className="h-5 w-5 rotate-90 text-white/80" />
                                  <div
                                    className={`w-2 h-2 rounded-full ${card.is_active ? "bg-green-400" : "bg-red-400"} shadow-lg`}
                                  >
                                    <div
                                      className={`w-2 h-2 rounded-full ${card.is_active ? "bg-green-400" : "bg-red-400"} animate-ping`}
                                    ></div>
                                  </div>
                                </div>
                              </div>

                              {/* Middle Section - Card Number */}
                              <div className="my-3">
                                <p className="text-xs text-white/60 mb-1">Kart Numarası</p>
                                <p className="font-mono text-lg tracking-wider font-bold">
                                  {card.card_number || "**** **** **** ****"}
                                </p>
                                {card.card_number && (
                                  <p className="text-xs text-white/70 mt-1">{getCardBrand(card.card_number)}</p>
                                )}
                              </div>

                              {/* Bottom Section - Expiry and Card Type */}
                              <div className="flex items-end justify-between">
                                <div>
                                  <p className="text-white/60 text-xs">Son Kullanma</p>
                                  <p className="font-semibold text-sm">
                                    {card.expiry_month && card.expiry_year
                                      ? `${card.expiry_month.toString().padStart(2, "0")}/${card.expiry_year.toString().slice(-2)}`
                                      : "12/28"}
                                  </p>
                                </div>
                                <Badge
                                  className={`${getCardTypeBadgeClass(card.card_type)} text-xs px-2 py-1`}
                                  variant="secondary"
                                >
                                  {getCardTypeIcon(card.card_type)}
                                  <span className="ml-1 uppercase">{card.card_type}</span>
                                </Badge>
                              </div>
                            </div>

                            {/* Premium card shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform rotate-12 translate-x-full group-hover:-translate-x-full transition-transform duration-1000"></div>
                          </div>

                          {/* Action Buttons Section - Inside Card but Separate */}
                          <div className="bg-white border-t border-gray-100 p-4">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                className="flex-1 bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-colors"
                                onClick={() => router.push(`/uygulama/kredi-kartlari/${card.id}`)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Detay
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-colors"
                                onClick={() => openEditDialog(card)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-colors"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm">
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/uygulama/kredi-kartlari/${card.id}/odeme-gecmisi`)}
                                  >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Ödeme Geçmişi
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <TrendingUp className="mr-2 h-4 w-4" />
                                    Rapor Al
                                  </DropdownMenuItem>
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
                              <div className="flex items-center gap-4">
                                <BankLogo
                                  bankName={card.bank_name || "Bilinmeyen Banka"}
                                  logoUrl={card.banks?.logo_url}
                                  size="md"
                                  className="ring-1 ring-emerald-200 bg-white shadow-sm"
                                />
                                <div>
                                  <span className="font-medium text-gray-900 dark:text-white block">
                                    {card.card_name}
                                  </span>
                                  <span className="text-xs text-emerald-600 font-medium">
                                    {card.card_number ? maskCardNumber(card.card_number) : "****"}
                                  </span>
                                  {card.card_number && (
                                    <span className="text-xs text-gray-500 ml-2">{getCardBrand(card.card_number)}</span>
                                  )}
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
                              <Badge className={getStatusBadgeClass(card.is_active)}>
                                {getStatusIcon(card.is_active)}
                                <span className="ml-1">{card.is_active ? "Aktif" : "Pasif"}</span>
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
