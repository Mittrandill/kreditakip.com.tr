"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MetricCard } from "@/components/metric-card"
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
  Calculator,
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  ArrowUpDown,
  List,
  AlertCircle,
  Settings,
  Loader2,
  PlayCircle,
  RefreshCw,
  History,
  DollarSign,
} from "lucide-react"
import { BsFillGrid3X3GapFill } from "react-icons/bs"
import { Progress } from "@/components/ui/progress"

import { useAuth } from "@/hooks/use-auth"
import { getFinancialProfile } from "@/lib/api/financials"
import { getCredits } from "@/lib/api/credits"
import {
  saveRefinancingAnalysis,
  getRefinancingAnalyses,
  deleteRefinancingAnalysis,
  type RefinancingAnalysis,
} from "@/lib/api/refinancing-analyses"
import type { FinancialProfile, Credit } from "@/lib/types"
import { formatCurrency, formatNumber } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow, format } from "date-fns"
import { tr } from "date-fns/locale"
import {
  Alert,
  AlertDescription as ShadcnAlertDescription,
  AlertTitle as ShadcnAlertTitle,
} from "@/components/ui/alert"

const getRefinancingBadgeText = (potential: string | null | undefined): string => {
  if (potential === "Yüksek") return "Yüksek Potansiyel"
  if (potential === "Orta") return "Orta Potansiyel"
  if (potential === "Düşük") return "Düşük Potansiyel"
  return "Bilinmiyor"
}

const getRefinancingBadgeClass = (potential: string | null | undefined): string => {
  if (potential === "Yüksek")
    return "bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-transparent hover:from-emerald-700 hover:to-teal-800"
  if (potential === "Orta")
    return "bg-gradient-to-r from-orange-600 to-amber-700 text-white border-transparent hover:from-orange-700 hover:to-amber-800"
  if (potential === "Düşük")
    return "bg-gradient-to-r from-gray-600 to-slate-700 text-white border-transparent hover:from-gray-700 hover:to-slate-800"
  return "bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-transparent hover:from-blue-700 hover:to-indigo-800"
}

const getUrgencyBadgeClass = (urgency: string | null | undefined): string => {
  if (urgency === "Acil")
    return "bg-gradient-to-r from-red-600 to-rose-700 text-white border-transparent hover:from-red-700 hover:to-rose-800"
  if (urgency === "Yüksek")
    return "bg-gradient-to-r from-orange-600 to-amber-700 text-white border-transparent hover:from-orange-700 hover:to-amber-800"
  if (urgency === "Orta")
    return "bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-transparent hover:from-blue-700 hover:to-indigo-800"
  if (urgency === "Düşük")
    return "bg-gradient-to-r from-gray-600 to-slate-700 text-white border-transparent hover:from-gray-700 hover:to-slate-800"
  return "bg-gradient-to-r from-gray-600 to-slate-700 text-white border-transparent hover:from-gray-700 hover:to-slate-800"
}

const getSavingsProgressValue = (savings: number | null | undefined): { value: number; className: string } => {
  const amount = savings || 0
  if (amount >= 100000) return { value: 95, className: "bg-emerald-500" }
  if (amount >= 50000) return { value: 75, className: "bg-green-500" }
  if (amount >= 25000) return { value: 55, className: "bg-yellow-500" }
  if (amount >= 10000) return { value: 35, className: "bg-orange-500" }
  return { value: 15, className: "bg-gray-500" }
}

export default function RefinansmanPage() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const userId = user?.id

  const [financialProfile, setFinancialProfile] = useState<FinancialProfile | null>(null)
  const [credits, setCredits] = useState<Credit[]>([])
  const [allPastAnalyses, setAllPastAnalyses] = useState<RefinancingAnalysis[]>([])

  const [initialDataLoading, setInitialDataLoading] = useState(true)
  const [initialDataError, setInitialDataError] = useState<string | null>(null)

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [analysisProgress, setAnalysisProgress] = useState(0)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [analysisToDelete, setAnalysisToDelete] = useState<RefinancingAnalysis | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [activeTab, setActiveTab] = useState("tumAnalizler")
  const [viewMode, setViewMode] = useState("cards")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPageCards = 6
  const itemsPerPageTable = 8

  useEffect(() => {
    let isMounted = true

    async function fetchData() {
      if (userId) {
        if (isMounted) {
          setInitialDataLoading(true)
          setInitialDataError(null)
        }
        try {
          const [profileData, creditsData, pastAnalysesData] = await Promise.all([
            getFinancialProfile(userId),
            getCredits(userId),
            getRefinancingAnalyses(userId),
          ])

          if (!isMounted) return

          setFinancialProfile(profileData)
          setCredits(creditsData as Credit[])
          setAllPastAnalyses(pastAnalysesData || [])

          if (!profileData || profileData.monthly_income === null || profileData.monthly_income === undefined) {
            setInitialDataError(
              "Refinansman analizi için finansal profilinizde en azından aylık gelir bilgisi bulunmalıdır. Lütfen Ayarlar > Finansal bölümünden bilgilerinizi güncelleyin.",
            )
          }

          if (!creditsData || creditsData.length === 0) {
            setInitialDataError(
              "Refinansman analizi için en az bir aktif krediniz bulunmalıdır. Lütfen önce kredi ekleyiniz.",
            )
          }
        } catch (err) {
          console.error("Refinansman Analizi - Başlangıç verileri alınırken hata:", err)
          if (isMounted) {
            setInitialDataError(
              "Finansal bilgileriniz, kredi verileriniz veya geçmiş analizleriniz yüklenirken bir sorun oluştu.",
            )
          }
        } finally {
          if (isMounted) {
            setInitialDataLoading(false)
          }
        }
      } else if (!authLoading) {
        if (!isMounted) return
        if (isMounted) {
          setInitialDataLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [userId, authLoading])

  const filteredAndSortedAnalyses = useMemo(() => {
    let filtered = [...allPastAnalyses]
    if (activeTab === "yuksekPotansiyel") filtered = filtered.filter((a) => a.refinancing_potential === "Yüksek")
    else if (activeTab === "ortaPotansiyel") filtered = filtered.filter((a) => a.refinancing_potential === "Orta")
    else if (activeTab === "dusukPotansiyel") filtered = filtered.filter((a) => a.refinancing_potential === "Düşük")

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (a) =>
          a.recommended_strategy?.toLowerCase().includes(lowerSearchTerm) ||
          new Date(a.created_at).toLocaleDateString("tr-TR").includes(lowerSearchTerm),
      )
    }

    filtered.sort((a, b) => {
      let comparison = 0
      if (sortBy === "created_at") {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else if (sortBy === "total_potential_savings") {
        const savingsA = a.total_potential_savings || 0
        const savingsB = b.total_potential_savings || 0
        comparison = savingsA - savingsB
      }
      return sortOrder === "asc" ? comparison : -comparison
    })
    return filtered
  }, [allPastAnalyses, activeTab, searchTerm, sortBy, sortOrder])

  const currentItemsPerPage = viewMode === "cards" ? itemsPerPageCards : itemsPerPageTable
  const totalItems = filteredAndSortedAnalyses.length
  const totalPages = Math.ceil(totalItems / currentItemsPerPage)
  const startIndex = (currentPage - 1) * currentItemsPerPage
  const endIndex = startIndex + currentItemsPerPage
  const currentPastAnalyses = filteredAndSortedAnalyses.slice(startIndex, endIndex)

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

  const handleAnalyze = async () => {
    if (!user || !financialProfile || !credits || credits.length === 0) return
    if (financialProfile.monthly_income === null || financialProfile.monthly_income === undefined) {
      setAnalysisError("Analiz için aylık gelir bilgisi zorunludur. Lütfen Ayarlar > Finansal bölümünden güncelleyin.")
      return
    }

    setIsAnalyzing(true)
    setAnalysisError(null)
    setAnalysisProgress(0)

    // Progress simulation for better UX
    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 90) return prev
        return prev + Math.random() * 15
      })
    }, 500)

    try {
      const response = await fetch("/api/refinancing-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          financialProfile,
          credits: credits.filter((c) => c.status === "active"),
          marketRates: {
            personalLoan: 2.8,
            mortgageLoan: 1.9,
            vehicleLoan: 2.2,
            businessLoan: 3.1,
          },
        }),
      })
      const responseData = await response.json()

      clearInterval(progressInterval)
      setAnalysisProgress(100)

      if (!response.ok) {
        const errorMessage = responseData.error || `Analiz API hatası: ${response.statusText}`
        const errorDetails = responseData.problematicString
          ? ` Sorunlu metin: ${responseData.problematicString.substring(0, 500)}...`
          : ""
        throw new Error(`${errorMessage}${errorDetails}`)
      }

      const saved = await saveRefinancingAnalysis(user.id, responseData, financialProfile, credits)
      setAllPastAnalyses((prev) => [saved, ...prev.filter((p) => p.id !== saved.id)])
      toast({ title: "Başarılı", description: "Refinansman analizi tamamlandı ve kaydedildi." })

      // Small delay to show 100% progress
      setTimeout(() => {
        router.push(`/uygulama/refinansman/${saved.id}`)
      }, 500)
    } catch (err: any) {
      clearInterval(progressInterval)
      console.error("Refinansman analizi hatası:", err)
      setAnalysisError(err.message || "Refinansman analizi oluşturulurken bir hata oluştu.")
    } finally {
      setTimeout(() => {
        setIsAnalyzing(false)
        setAnalysisProgress(0)
      }, 500)
    }
  }

  const handleDeleteAnalysis = async () => {
    if (!user || !analysisToDelete) return
    setIsDeleting(true)
    try {
      await deleteRefinancingAnalysis(user.id, analysisToDelete.id)
      setAllPastAnalyses((prev) => prev.filter((a) => a.id !== analysisToDelete!.id))
      toast({ title: "Başarılı", description: "Refinansman analizi silindi." })
    } catch (err) {
      console.error("Analiz silme hatası:", err)
      toast({ title: "Hata", description: "Analiz silinirken bir sorun oluştu.", variant: "destructive" })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setAnalysisToDelete(null)
    }
  }

  const openDeleteDialog = (analysis: RefinancingAnalysis) => {
    setAnalysisToDelete(analysis)
    setDeleteDialogOpen(true)
  }

  const viewAnalysisDetails = (analysisId: string) => {
    router.push(`/uygulama/refinansman/${analysisId}`)
  }

  const totalAnalysesCount = allPastAnalyses.length
  const lastAnalysisDate = totalAnalysesCount > 0 ? allPastAnalyses[0].created_at : null
  const potentialDistribution = useMemo(
    () =>
      allPastAnalyses.reduce(
        (acc, analysis) => {
          const potential = analysis.refinancing_potential
          if (potential === "Yüksek") acc.high++
          else if (potential === "Orta") acc.medium++
          else if (potential === "Düşük") acc.low++
          return acc
        },
        { low: 0, medium: 0, high: 0 },
      ),
    [allPastAnalyses],
  )

  if (authLoading || (userId && initialDataLoading)) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (initialDataError && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg text-red-600">{initialDataError}</p>
        <Button onClick={() => router.push("/giris")} className="mt-4">
          Giriş Yap
        </Button>
      </div>
    )
  }

  const canAnalyze =
    financialProfile &&
    financialProfile.monthly_income !== null &&
    financialProfile.monthly_income !== undefined &&
    credits.length > 0
  const heroButtonText = "Analizi Başlat"

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-transparent shadow-xl rounded-xl">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Calculator className="h-8 w-8" />
                Refinansman Analizi
              </h2>
              <p className="opacity-90 text-lg">
                Mevcut kredilerinizi yeniden yapılandırarak tasarruf fırsatlarını keşfedin.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                size="lg"
                className="bg-white/20 hover:bg-white/30 border-white/50 text-white"
                onClick={() => router.push("/uygulama/ayarlar?tab=financial")}
              >
                <Settings className="h-5 w-5 mr-2" />
                Finansal Bilgiler
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-white text-blue-700 hover:bg-gray-100 border-white"
                onClick={handleAnalyze}
                disabled={isAnalyzing || initialDataLoading || !canAnalyze}
              >
                {isAnalyzing ? (
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <PlayCircle className="h-5 w-5 mr-2" />
                )}
                {isAnalyzing ? "Analiz Ediliyor..." : heroButtonText}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {!initialDataLoading && !canAnalyze && (
        <Alert variant="destructive" className="shadow-md">
          <AlertCircle className="h-4 w-4" />
          <ShadcnAlertTitle>Eksik Bilgi</ShadcnAlertTitle>
          <ShadcnAlertDescription>
            {initialDataError ||
              "Refinansman analizi için finansal profilinizde aylık gelir bilgisi ve en az bir aktif kredi bulunmalıdır."}
            <Button
              variant="link"
              className="p-0 h-auto ml-1 text-red-700 dark:text-red-400 underline"
              onClick={() => router.push("/uygulama/ayarlar?tab=financial")}
            >
              Finansal bilgilerinizi güncellemek için tıklayın.
            </Button>
          </ShadcnAlertDescription>
        </Alert>
      )}

      {isAnalyzing && (
        <Card className="shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="h-16 w-16 animate-spin text-blue-600" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">Refinansman Analizi Hazırlanıyor</h3>
                <p className="text-gray-600">Kredi verileriniz ve piyasa koşulları analiz ediliyor...</p>
              </div>
              <div className="w-full max-w-md">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>İlerleme</span>
                  <span>{Math.round(analysisProgress)}%</span>
                </div>
                <Progress value={analysisProgress} className="h-2" />
              </div>
              <p className="text-sm text-gray-500">Bu işlem genellikle 10-15 saniye sürer</p>
            </div>
          </CardContent>
        </Card>
      )}

      {analysisError && !isAnalyzing && (
        <Alert variant="destructive" className="shadow-md">
          <AlertCircle className="h-4 w-4" />
          <ShadcnAlertTitle>Analiz Hatası</ShadcnAlertTitle>
          <ShadcnAlertDescription>{analysisError}</ShadcnAlertDescription>
        </Alert>
      )}

      {!isAnalyzing && canAnalyze && !initialDataLoading && (
        <>
          {allPastAnalyses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
              <MetricCard
                title="Toplam Analiz"
                value={formatNumber(totalAnalysesCount)}
                subtitle="adet"
                color="blue"
                icon={<History />}
              />
              <MetricCard
                title="Son Analiz"
                value={
                  lastAnalysisDate
                    ? formatDistanceToNow(new Date(lastAnalysisDate), { addSuffix: true, locale: tr })
                    : "Yok"
                }
                subtitle="tarihinde"
                color="emerald"
                icon={<Calendar />}
              />
              <MetricCard
                title="Yüksek Potansiyel"
                value={formatNumber(potentialDistribution.high)}
                subtitle="analiz"
                color="purple"
                icon={<TrendingUp />}
              />
              <MetricCard
                title="Ortalama Tasarruf"
                value={formatCurrency(
                  allPastAnalyses.reduce((sum, a) => sum + (a.total_potential_savings || 0), 0) /
                    Math.max(allPastAnalyses.length, 1),
                )}
                subtitle="potansiyel"
                color="green"
                icon={<DollarSign />}
              />
            </div>
          )}

          {allPastAnalyses.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <div className="border-b border-gray-100 bg-gray-50/50">
                  <TabsList className="grid grid-cols-2 sm:grid-cols-4 bg-transparent h-auto p-2 gap-2">
                    <TabsTrigger
                      value="tumAnalizler"
                      className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-blue-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
                    >
                      <History className="h-4 w-4" />
                      Tümü
                    </TabsTrigger>
                    <TabsTrigger
                      value="yuksekPotansiyel"
                      className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-blue-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
                    >
                      <TrendingUp className="h-4 w-4" />
                      Yüksek
                    </TabsTrigger>
                    <TabsTrigger
                      value="ortaPotansiyel"
                      className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-blue-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
                    >
                      <Clock className="h-4 w-4" />
                      Orta
                    </TabsTrigger>
                    <TabsTrigger
                      value="dusukPotansiyel"
                      className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-blue-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Düşük
                    </TabsTrigger>
                  </TabsList>
                </div>
                <div className="p-4 border-b border-gray-100 bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Analiz ara..."
                          value={searchTerm}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          className="pl-8 w-[250px] custom-input"
                        />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                            <ArrowUpDown className="h-4 w-4" />
                            Sırala: {sortBy === "created_at" ? "Tarih" : "Tasarruf"} (
                            {sortOrder === "asc" ? "Artan" : "Azalan"})
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => handleSort("created_at")}>Tarihe Göre</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSort("total_potential_savings")}>
                            Tasarrufa Göre
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex border rounded-lg">
                      <Button
                        variant={viewMode === "cards" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handleViewModeChange("cards")}
                        className={`rounded-r-none ${viewMode === "cards" ? "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white" : ""}`}
                      >
                        <BsFillGrid3X3GapFill className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "table" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handleViewModeChange("table")}
                        className={`rounded-l-none ${viewMode === "table" ? "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white" : ""}`}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {currentPastAnalyses.length === 0 && (
                    <div className="text-center py-10">
                      <History className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Analiz Bulunamadı</h3>
                      <p className="mt-1 text-sm text-gray-500">Bu filtreye uygun geçmiş analiz bulunamadı.</p>
                    </div>
                  )}
                  {viewMode === "cards" && currentPastAnalyses.length > 0 && (
                    <div className="space-y-6">
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {currentPastAnalyses.map((pa) => (
                          <Card
                            key={pa.id}
                            className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl border-gray-200 cursor-pointer"
                            onClick={() => viewAnalysisDetails(pa.id)}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg text-gray-900 dark:text-white">
                                  Analiz: {format(new Date(pa.created_at), "dd.MM.yyyy HH:mm")}
                                </CardTitle>
                                <Badge className={getRefinancingBadgeClass(pa.refinancing_potential)}>
                                  {getRefinancingBadgeText(pa.refinancing_potential)}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div>
                                <p className="text-sm text-gray-500">Potansiyel Tasarruf</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {formatCurrency(pa.total_potential_savings || 0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Önerilen Strateji</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                                  {pa.recommended_strategy || "Belirtilmemiş"}
                                </p>
                              </div>
                              <div>
                                <div className="flex justify-between text-sm mb-2">
                                  <span className="text-gray-500 dark:text-gray-400">Tasarruf Seviyesi</span>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {getRefinancingBadgeText(pa.refinancing_potential)}
                                  </span>
                                </div>
                                <Progress
                                  value={getSavingsProgressValue(pa.total_potential_savings).value}
                                  className={`h-2 [&>div]:${getSavingsProgressValue(pa.total_potential_savings).className}`}
                                />
                              </div>
                              <div className="flex gap-2 pt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 bg-transparent"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    viewAnalysisDetails(pa.id)
                                  }}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Detay
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openDeleteDialog(pa)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      {totalPages > 1 && (
                        <PaginationModern
                          currentPage={currentPage}
                          totalPages={totalPages}
                          totalItems={totalItems}
                          itemsPerPage={currentItemsPerPage}
                          onPageChange={setCurrentPage}
                          itemName="analiz"
                        />
                      )}
                    </div>
                  )}
                  {viewMode === "table" && currentPastAnalyses.length > 0 && (
                    <div className="space-y-6">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-white dark:bg-gray-900">
                              <TableHead>Tarih</TableHead>
                              <TableHead>Potansiyel</TableHead>
                              <TableHead>Aciliyet</TableHead>
                              <TableHead>Tasarruf</TableHead>
                              <TableHead>Strateji</TableHead>
                              <TableHead className="text-right">İşlemler</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentPastAnalyses.map((pa, index) => (
                              <TableRow
                                key={pa.id}
                                className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 ease-in-out cursor-pointer ${
                                  index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-800/50"
                                }`}
                                onClick={() => viewAnalysisDetails(pa.id)}
                              >
                                <TableCell className="font-medium text-blue-700 dark:text-blue-400">
                                  {format(new Date(pa.created_at), "dd.MM.yyyy HH:mm")}
                                </TableCell>
                                <TableCell>
                                  <Badge className={getRefinancingBadgeClass(pa.refinancing_potential)}>
                                    {getRefinancingBadgeText(pa.refinancing_potential)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getUrgencyBadgeClass(pa.urgency_level)}>
                                    {pa.urgency_level || "Orta"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-semibold text-gray-900 dark:text-white">
                                  {formatCurrency(pa.total_potential_savings || 0)}
                                </TableCell>
                                <TableCell className="max-w-xs truncate text-gray-700 dark:text-gray-300">
                                  {pa.recommended_strategy || "Belirtilmemiş"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Actions</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          viewAnalysisDetails(pa.id)
                                        }}
                                      >
                                        <Eye className="mr-2 h-4 w-4" />
                                        Detayları Gör
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          openDeleteDialog(pa)
                                        }}
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
                      {totalPages > 1 && (
                        <PaginationModern
                          currentPage={currentPage}
                          totalPages={totalPages}
                          totalItems={totalItems}
                          itemsPerPage={currentItemsPerPage}
                          onPageChange={setCurrentPage}
                          itemName="analiz"
                        />
                      )}
                    </div>
                  )}
                </div>
              </Tabs>
            </div>
          )}

          {!isAnalyzing && allPastAnalyses.length === 0 && canAnalyze && !initialDataLoading && (
            <Card className="shadow-lg mt-6">
              <CardContent className="p-8 text-center">
                <Calculator className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500 mb-6" />
                <h3 className="text-2xl font-semibold mb-3 text-gray-700 dark:text-gray-300">
                  Refinansman Analizine Hazır Mısınız?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Mevcut kredilerinizi analiz ederek daha uygun koşullarda yeniden yapılandırma fırsatlarını keşfetmek
                  için yukarıdaki "Analizi Başlat" düğmesine tıklayın.
                </p>
                <Button
                  size="lg"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || initialDataLoading || !canAnalyze}
                  className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white"
                >
                  <PlayCircle className="h-5 w-5 mr-2" />
                  Analizi Başlat
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refinansman Analizini Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu refinansman analizini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {analysisToDelete && (
            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
              <strong>Tarih:</strong> {format(new Date(analysisToDelete.created_at), "dd.MM.yyyy HH:mm")}
              <br />
              <strong>Potansiyel:</strong> {getRefinancingBadgeText(analysisToDelete.refinancing_potential)}
              <br />
              <strong>Tasarruf:</strong> {formatCurrency(analysisToDelete.total_potential_savings || 0)}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAnalysis}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
