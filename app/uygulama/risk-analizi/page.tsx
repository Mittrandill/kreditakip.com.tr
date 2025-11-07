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
  ShieldCheck,
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  Calendar,
  AlertTriangle,
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
} from "lucide-react"
import { BsFillGrid3X3GapFill } from "react-icons/bs"
import { Progress } from "@/components/ui/progress"
import { UpgradePrompt } from "@/components/upgrade-prompt"
import { useAuth } from "@/hooks/use-auth"
import { getCredits } from "@/lib/api/credits"
import { saveRiskAnalysis, getRiskAnalyses, deleteRiskAnalysis } from "@/lib/api/risk-analyses"
import type { Credit, RiskAnalysis as RiskAnalysisType } from "@/lib/types"
import { formatCurrency, formatNumber } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow, format } from "date-fns"
import { tr } from "date-fns/locale"
import {
  Alert,
  AlertDescription as ShadcnAlertDescription,
  AlertTitle as ShadcnAlertTitle,
} from "@/components/ui/alert"
import { ListChecks } from "lucide-react"
import { useSubscription } from "@/hooks/use-subscription"
import { AdBanner } from "@/components/ad-banner"

const getRiskBadgeText = (color: string | null | undefined): string => {
  if (color === "emerald") return "Düşük Risk"
  if (color === "yellow") return "Orta Risk"
  if (color === "red") return "Yüksek Risk"
  return "Bilinmiyor"
}

const getRiskBadgeClass = (color: string | null | undefined): string => {
  if (color === "emerald")
    return "bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-transparent hover:from-emerald-700 hover:to-teal-800"
  if (color === "yellow")
    return "bg-gradient-to-r from-orange-600 to-amber-700 text-white border-transparent hover:from-orange-700 hover:to-amber-800"
  if (color === "red")
    return "bg-gradient-to-r from-red-600 to-rose-700 text-white border-transparent hover:from-red-700 hover:to-rose-800"
  return "bg-gradient-to-r from-gray-600 to-slate-700 text-white border-transparent hover:from-gray-700 hover:to-slate-800"
}

const getRiskProgressValue = (riskColor: string | null | undefined): { value: number; className: string } => {
  if (riskColor === "emerald") return { value: 25, className: "bg-emerald-500" }
  if (riskColor === "yellow") return { value: 60, className: "bg-yellow-500" }
  if (riskColor === "red") return { value: 90, className: "bg-red-500" }
  return { value: 0, className: "bg-gray-500" }
}

export default function RiskAnaliziPage() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const userId = user?.id
  const { canUseRiskAnalysis } = useSubscription()

  const [financialProfile, setFinancialProfile] = useState<any | null>(null)
  const [credits, setCredits] = useState<Credit[]>([])
  const [allPastAnalyses, setAllPastAnalyses] = useState<RiskAnalysisType[]>([])

  const [initialDataLoading, setInitialDataLoading] = useState(true)
  const [initialDataError, setInitialDataError] = useState<string | null>(null)

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [analysisProgress, setAnalysisProgress] = useState(0)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [analysisToDelete, setAnalysisToDelete] = useState<RiskAnalysisType | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [activeTab, setActiveTab] = useState("tumAnalizler")
  const [viewMode, setViewMode] = useState("table")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

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
          const [profileResponse, creditsData, pastAnalysesData] = await Promise.all([
            fetch(`/api/financial-profile`),
            getCredits(userId),
            getRiskAnalyses(userId),
          ])

          if (!isMounted) return

          if (!profileResponse.ok) {
            const errorText = await profileResponse.text()
            console.error("[v0] Financial profile API error:", errorText)
            throw new Error("Finansal profil yüklenemedi")
          }

          const profileData = await profileResponse.json()
          setFinancialProfile(profileData)
          setCredits(creditsData as Credit[])
          setAllPastAnalyses(pastAnalysesData || [])

          if (!profileData || profileData.monthly_income === null || profileData.monthly_income === undefined || profileData.monthly_income === 0) {
            setInitialDataError(
              "Risk analizi için finansal profilinizde en azından aylık gelir bilgisi bulunmalıdır. Lütfen Ayarlar > Finansal bölümünden bilgilerinizi güncelleyin.",
            )
          }
        } catch (err) {
          console.error("Risk Analizi - Başlangıç verileri alınırken hata:", err)
          if (isMounted) {
            setInitialDataError(
              err instanceof Error ? err.message : "Finansal bilgileriniz yüklenirken bir sorun oluştu.",
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
    if (activeTab === "dusukRisk") filtered = filtered.filter((a) => a.overall_risk_color === "emerald")
    else if (activeTab === "ortaRisk") filtered = filtered.filter((a) => a.overall_risk_color === "yellow")
    else if (activeTab === "yuksekRisk") filtered = filtered.filter((a) => a.overall_risk_color === "red")

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (a) =>
          a.overall_risk_score?.toLowerCase().includes(lowerSearchTerm) ||
          new Date(a.created_at).toLocaleDateString("tr-TR").includes(lowerSearchTerm),
      )
    }

    filtered.sort((a, b) => {
      let comparison = 0
      if (sortBy === "created_at") {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else if (sortBy === "overall_risk_score") {
        const scoreA = a.overall_risk_score || ""
        const scoreB = b.overall_risk_score || ""
        comparison = scoreA.localeCompare(scoreB)
      } else if (sortBy === "debt_to_income_ratio") {
        comparison = (parseFloat(a.debt_to_income_ratio || "0") || 0) - (parseFloat(b.debt_to_income_ratio || "0") || 0)
      } else if (sortBy === "monthly_income") {
        comparison = (a.monthly_income || 0) - (b.monthly_income || 0)
      } else if (sortBy === "total_debt_amount") {
        comparison = (a.total_debt_amount || 0) - (b.total_debt_amount || 0)
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
    if (!userId || !financialProfile) {
      setAnalysisError("Kullanıcı ID gereklidir")
      return
    }
    if (financialProfile.monthly_income === null || financialProfile.monthly_income === undefined) {
      setAnalysisError("Analiz için aylık gelir bilgisi zorunludur. Lütfen Ayarlar > Finansal bölümünden güncelleyin.")
      return
    }

    if (!canUseRiskAnalysis) {
      setShowUpgradePrompt(true)
      return
    }

    setIsAnalyzing(true)
    setAnalysisError(null)
    setAnalysisProgress(0)

    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 90) return prev
        return prev + Math.random() * 15
      })
    }, 500)

    try {
      const response = await fetch("/api/risk-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          financialProfile,
          credits,
        }),
      })
      const responseData = await response.json()

      clearInterval(progressInterval)
      setAnalysisProgress(100)

      if (response.status === 403) {
        if (responseData.limitExceeded) {
          setShowUpgradePrompt(true)
          return
        }
      }

      if (!response.ok) {
        const errorMessage = responseData.error || `Analiz API hatası: ${response.statusText}`
        const errorDetails = responseData.problematicString
          ? ` Sorunlu metin: ${responseData.problematicString.substring(0, 500)}...`
          : ""
        throw new Error(`${errorMessage}${errorDetails}`)
      }

      const saved = await saveRiskAnalysis(userId, responseData, financialProfile, credits)

      if (!saved || !saved.id) {
        throw new Error("Risk analizi kaydedildi ancak ID alınamadı")
      }

      setAllPastAnalyses((prev) => [saved, ...prev.filter((p) => p.id !== saved.id)])
      toast({ title: "Başarılı", description: "Kapsamlı risk analizi tamamlandı ve kaydedildi." })

      setTimeout(() => {
        router.push(`/uygulama/risk-analizi/${saved.id}`)
      }, 500)
    } catch (err: any) {
      clearInterval(progressInterval)
      console.error("Risk analizi hatası:", err)
      setAnalysisError(err.message || "Risk analizi oluşturulurken bir hata oluştu.")
    } finally {
      setTimeout(() => {
        setIsAnalyzing(false)
        setAnalysisProgress(0)
      }, 500)
    }
  }

  const handleDeleteAnalysis = async () => {
    if (!userId || !analysisToDelete) return
    setIsDeleting(true)
    try {
      await deleteRiskAnalysis(analysisToDelete.id, userId)
      setAllPastAnalyses((prev) => prev.filter((a) => a.id !== analysisToDelete!.id))
      toast({ title: "Başarılı", description: "Risk analizi silindi." })
    } catch (err) {
      console.error("Analiz silme hatası:", err)
      toast({ title: "Hata", description: "Analiz silinirken bir sorun oluştu.", variant: "destructive" })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setAnalysisToDelete(null)
    }
  }

  const openDeleteDialog = (analysis: RiskAnalysisType) => {
    setAnalysisToDelete(analysis)
    setDeleteDialogOpen(true)
  }

  const viewAnalysisDetails = (analysisId: string) => {
    router.push(`/uygulama/risk-analizi/${analysisId}`)
  }

  const totalAnalysesCount = allPastAnalyses.length
  const lastAnalysisDate = totalAnalysesCount > 0 ? allPastAnalyses[0].created_at : null
  const riskDistribution = useMemo(
    () =>
      allPastAnalyses.reduce(
        (acc, analysis) => {
          const color = analysis.overall_risk_color
          if (color === "emerald") acc.low++
          else if (color === "yellow") acc.medium++
          else if (color === "red") acc.high++
          return acc
        },
        { low: 0, medium: 0, high: 0, unknown: 0 },
      ),
    [allPastAnalyses],
  )

  const totalFinancialInstruments = credits.length

  if (authLoading || (userId && initialDataLoading)) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  if (initialDataError && !userId) {
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
    financialProfile.monthly_income > 0
  const heroButtonText = "Kapsamlı Analizi Başlat"

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <AdBanner position="top" className="mb-4" />

      <Card className="bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-700 dark:to-teal-800 text-white border-transparent shadow-xl rounded-xl">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <ShieldCheck className="h-8 w-8" />
                Kapsamlı Finansal Risk Değerlendirmesi
              </h2>
              <p className="opacity-90 text-lg">
                Krediler, kredi kartları ve hesaplarınızı dahil ederek tam finansal sağlık analizi.
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm opacity-80">
                <span className="flex items-center gap-1">
                  <History className="h-4 w-4" />
                  {credits.length} Kredi
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                size="lg"
                className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
                onClick={() => router.push("/uygulama/ayarlar?tab=financial")}
              >
                <Settings className="h-5 w-5 mr-2" />
                Finansal Bilgiler
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
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
        <Alert variant="destructive" className="shadow-md dark:bg-red-900/30 dark:border-red-700/50">
          <AlertTriangle className="h-4 w-4" />
          <ShadcnAlertTitle className="dark:text-white">Eksik Bilgi</ShadcnAlertTitle>
          <ShadcnAlertDescription className="dark:text-white/70">
            {initialDataError || "Risk analizi için finansal profilinizde en azından aylık gelir bilgisi bulunmalıdır."}
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
        <Card className="shadow-lg dark:bg-black/20 dark:border-white/10">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="h-16 w-16 animate-spin text-red-600" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Kapsamlı Risk Analizi Hazırlanıyor
                </h3>
                <p className="text-gray-600 dark:text-white/70">{totalFinancialInstruments} kredi analiz ediliyor...</p>
              </div>
              <div className="w-full max-w-md">
                <div className="flex justify-between text-sm text-gray-500 dark:text-white/60 mb-1">
                  <span>İlerleme</span>
                  <span>{Math.round(analysisProgress)}%</span>
                </div>
                <Progress value={analysisProgress} className="h-2" />
              </div>
              <p className="text-sm text-gray-500 dark:text-white/60">Krediler kapsamlı analiz yapılıyor</p>
            </div>
          </CardContent>
        </Card>
      )}

      {analysisError && !isAnalyzing && (
        <Alert variant="destructive" className="shadow-md dark:bg-red-900/30 dark:border-red-700/50">
          <AlertTriangle className="h-4 w-4" />
          <ShadcnAlertTitle className="dark:text-white">Analiz Hatası</ShadcnAlertTitle>
          <ShadcnAlertDescription className="dark:text-white/70">{analysisError}</ShadcnAlertDescription>
        </Alert>
      )}

      {!isAnalyzing && canAnalyze && !initialDataLoading && (
        <>
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
                  : "Henüz yok"
              }
              subtitle={lastAnalysisDate ? "tarihinde" : ""}
              color="emerald"
              icon={<Calendar />}
            />
            <MetricCard
              title="Düşük Risk"
              value={formatNumber(riskDistribution.low)}
              subtitle="analiz"
              color="purple"
              icon={<CheckCircle />}
            />
            <MetricCard
              title="Yüksek Risk"
              value={formatNumber(riskDistribution.high)}
              subtitle="analiz"
              color="orange"
              icon={<AlertTriangle />}
            />
          </div>

          <div className="bg-white dark:bg-black/20 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden mt-6">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <div className="border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-emerald-900/10">
                <TabsList className="grid grid-cols-2 sm:grid-cols-4 bg-transparent h-auto p-2 gap-2">
                  <TabsTrigger
                    value="tumAnalizler"
                    className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900/20 data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/60"
                  >
                    <ListChecks className="h-4 w-4" />
                    Tümü ({totalAnalysesCount})
                  </TabsTrigger>
                  <TabsTrigger
                    value="dusukRisk"
                    className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900/20 data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/60"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Düşük ({riskDistribution.low})
                  </TabsTrigger>
                  <TabsTrigger
                    value="ortaRisk"
                    className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900/20 data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/60"
                  >
                    <Clock className="h-4 w-4" />
                    Orta ({riskDistribution.medium})
                  </TabsTrigger>
                  <TabsTrigger
                    value="yuksekRisk"
                    className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900/20 data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/60"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Yüksek ({riskDistribution.high})
                  </TabsTrigger>
                </TabsList>
              </div>
              <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-white dark:bg-black/20">
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
                        <Button
                          variant="outline"
                          className="flex items-center gap-2 bg-transparent dark:text-white/70 dark:border-white/10"
                        >
                          <ArrowUpDown className="h-4 w-4" />
                          Sırala: {sortBy === "created_at" ? "Tarih" : "Risk Skoru"} (
                          {sortOrder === "asc" ? "Artan" : "Azalan"})
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => handleSort("created_at")}>Tarihe Göre</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSort("overall_risk_score")}>
                          Risk Skoruna Göre
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex border rounded-lg dark:border-white/10">
                    <Button
                      variant={viewMode === "cards" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleViewModeChange("cards")}
                      className={`rounded-r-none ${viewMode === "cards" ? "bg-gradient-to-r from-orange-600 to-amber-700 hover:from-orange-700 hover:to-amber-800 text-white" : "dark:text-white/70"}`}
                    >
                      <BsFillGrid3X3GapFill className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "table" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleViewModeChange("table")}
                      className={`rounded-l-none ${viewMode === "table" ? "bg-gradient-to-r from-orange-600 to-amber-700 hover:from-orange-700 hover:to-amber-800 text-white" : "dark:text-white/70"}`}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-6 dark:bg-black/20">
                {currentPastAnalyses.length === 0 && (
                  <div className="text-center py-12">
                    <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-black/10 rounded-full flex items-center justify-center mb-4">
                      <History className="h-12 w-12 text-gray-400 dark:text-white/60" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {totalAnalysesCount === 0 ? "Henüz Risk Analizi Yok" : "Bu Filtreye Uygun Analiz Bulunamadı"}
                    </h3>
                    <p className="text-gray-500 dark:text-white/60 mb-6 max-w-md mx-auto">
                      {totalAnalysesCount === 0
                        ? "İlk risk analizinizi oluşturmak için yukarıdaki 'Kapsamlı Analizi Başlat' butonuna tıklayın."
                        : "Farklı filtreler deneyebilir veya arama terimini değiştirebilirsiniz."}
                    </p>
                    {totalAnalysesCount === 0 && (
                      <Button
                        onClick={handleAnalyze}
                        disabled={!canAnalyze}
                        className="bg-gradient-to-r from-orange-600 to-amber-700 hover:from-orange-700 hover:to-amber-800"
                      >
                        <PlayCircle className="h-5 w-5 mr-2" />
                        İlk Analizimi Oluştur
                      </Button>
                    )}
                  </div>
                )}

                {viewMode === "cards" && currentPastAnalyses.length > 0 && (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {currentPastAnalyses.map((pa) => (
                        <Card
                          key={pa.id}
                          className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl border-gray-200 dark:border-white/10 dark:bg-black/10 cursor-pointer"
                          onClick={() => viewAnalysisDetails(pa.id)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg text-gray-900 dark:text-white">
                                Analiz: {format(new Date(pa.created_at), "dd.MM.yyyy HH:mm")}
                              </CardTitle>
                              <Badge className={getRiskBadgeClass(pa.overall_risk_color)}>
                                {getRiskBadgeText(pa.overall_risk_color)}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <p className="text-sm text-gray-500 dark:text-white/60">Risk Skoru</p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {pa.overall_risk_score || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 dark:text-white/60">Borç/Gelir Oranı</p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {pa.debt_to_income_ratio || "N/A"}
                              </p>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-500 dark:text-white/60">Risk Seviyesi</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {getRiskBadgeText(pa.overall_risk_color)}
                                </span>
                              </div>
                              <Progress
                                value={getRiskProgressValue(pa.overall_risk_color).value}
                                className={`h-2 [&>div]:${getRiskProgressValue(pa.overall_risk_color).className}`}
                              />
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 bg-transparent dark:text-white/70 dark:border-white/10 dark:hover:bg-white/10"
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
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 bg-transparent dark:border-white/10"
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
                          <TableRow className="bg-white dark:bg-black/20 dark:border-white/10">
                            <TableHead
                              className="dark:text-white/70 cursor-pointer hover:text-red-600 dark:hover:text-red-400"
                              onClick={() => handleSort("created_at")}
                            >
                              <div className="flex items-center gap-1">
                                Tarih
                                <ArrowUpDown className="h-3 w-3" />
                              </div>
                            </TableHead>
                            <TableHead
                              className="dark:text-white/70 cursor-pointer hover:text-red-600 dark:hover:text-red-400"
                              onClick={() => handleSort("overall_risk_score")}
                            >
                              <div className="flex items-center gap-1">
                                Risk Skoru
                                <ArrowUpDown className="h-3 w-3" />
                              </div>
                            </TableHead>
                            <TableHead className="dark:text-white/70">Risk Seviyesi</TableHead>
                            <TableHead
                              className="dark:text-white/70 cursor-pointer hover:text-red-600 dark:hover:text-red-400"
                              onClick={() => handleSort("debt_to_income_ratio")}
                            >
                              <div className="flex items-center gap-1">
                                Borç/Gelir
                                <ArrowUpDown className="h-3 w-3" />
                              </div>
                            </TableHead>
                            <TableHead
                              className="dark:text-white/70 cursor-pointer hover:text-red-600 dark:hover:text-red-400"
                              onClick={() => handleSort("monthly_income")}
                            >
                              <div className="flex items-center gap-1">
                                Aylık Gelir
                                <ArrowUpDown className="h-3 w-3" />
                              </div>
                            </TableHead>
                            <TableHead
                              className="dark:text-white/70 cursor-pointer hover:text-red-600 dark:hover:text-red-400"
                              onClick={() => handleSort("total_debt_amount")}
                            >
                              <div className="flex items-center gap-1">
                                Toplam Borç
                                <ArrowUpDown className="h-3 w-3" />
                              </div>
                            </TableHead>
                            <TableHead className="text-right dark:text-white/70">İşlemler</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentPastAnalyses.map((pa) => (
                            <TableRow
                              key={pa.id}
                              className="hover:bg-gray-50 dark:hover:bg-white/10 cursor-pointer dark:border-white/10"
                              onClick={() => viewAnalysisDetails(pa.id)}
                            >
                              <TableCell className="font-medium dark:text-white/70">
                                {format(new Date(pa.created_at), "dd.MM.yyyy HH:mm")}
                              </TableCell>
                              <TableCell className="dark:text-white/70">{pa.overall_risk_score || "N/A"}</TableCell>
                              <TableCell>
                                <Badge className={getRiskBadgeClass(pa.overall_risk_color)}>
                                  {getRiskBadgeText(pa.overall_risk_color)}
                                </Badge>
                              </TableCell>
                              <TableCell className="dark:text-white/70">{pa.debt_to_income_ratio || "N/A"}</TableCell>
                              <TableCell className="dark:text-white/70">
                                {formatCurrency(pa.monthly_income || 0)}
                              </TableCell>
                              <TableCell className="dark:text-white/70">
                                {formatCurrency(pa.total_debt_amount || 0)}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="h-8 w-8 p-0 dark:text-white/70"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
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
                                      Detayları Görüntüle
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        openDeleteDialog(pa)
                                      }}
                                      className="text-red-600"
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
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Risk Analizini Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu risk analizini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAnalysis}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              {isDeleting ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UpgradePrompt open={showUpgradePrompt} onOpenChange={setShowUpgradePrompt} feature="risk_analysis" />
    </div>
  )
}
