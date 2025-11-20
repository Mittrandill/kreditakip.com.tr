"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/hooks/use-auth"
import { getRiskAnalysisById, deleteRiskAnalysis } from "@/lib/api/risk-analyses"
import type { RiskAnalysis, RiskAnalysisData } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
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
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  BarChart3,
  ArrowLeft,
  Info,
  Trash2,
  Calendar,
  CreditCard,
  Loader2,
  FileText,
  PieChart,
  ChevronsUpDown,
  Sparkles,
  Activity,
  Scale,
  Banknote,
  Landmark,
  PiggyBank,
  ShieldAlert,
  ShieldQuestion,
  ClipboardList,
  Zap,
} from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"
import { MetricCard } from "@/components/metric-card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const CHART_COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#F97316", "#84CC16"]

const getSeverityBadgeVariant = (
  severity: string | undefined,
): "destructive" | "outline" | "default" | "secondary" => {
  switch (severity?.toLowerCase()) {
    case "yüksek":
      return "destructive"
    case "orta":
      return "outline"
    case "düşük":
      return "default"
    default:
      return "secondary"
  }
}

const getRiskProgressData = (
  riskScoreData: RiskAnalysisData["overallRiskScore"] | undefined,
): { value: number; className: string; label: string } => {
  if (!riskScoreData) return { value: 0, className: "bg-gray-500", label: "Bilinmiyor" }

  const numericScore = riskScoreData.numericScore || 0
  const scoreMax = riskScoreData.scoreMax || 100
  const riskValue = riskScoreData.value?.toLowerCase() || ""
  const riskColor = riskScoreData.color

  // Calculate percentage from numeric score
  let percentage = scoreMax > 0 ? (numericScore / scoreMax) * 100 : 0

  // Smart fallback logic based on risk level text if percentage seems wrong
  if (riskValue.includes("düşük")) {
    // For low risk, percentage should be 15-35%
    if (percentage > 35 || percentage < 15) {
      percentage = 25 // Default to 25% for low risk
    }
    return { value: percentage, className: "bg-emerald-500", label: "Düşük Risk" }
  } else if (riskValue.includes("orta")) {
    // For medium risk, percentage should be 40-65%
    if (percentage < 40 || percentage > 65) {
      percentage = 52.5 // Default to 52.5% for medium risk
    }
    return { value: percentage, className: "bg-yellow-500", label: "Orta Risk" }
  } else if (riskValue.includes("yüksek")) {
    // For high risk, percentage should be 70-95%
    if (percentage < 70) {
      percentage = 82.5 // Default to 82.5% for high risk
    }
    return { value: percentage, className: "bg-red-500", label: "Yüksek Risk" }
  }

  // Fallback to color-based logic if text analysis fails
  switch (riskColor) {
    case "emerald":
      return { value: Math.max(percentage, 25), className: "bg-emerald-500", label: "Düşük Risk" }
    case "yellow":
      return { value: Math.max(percentage, 52.5), className: "bg-yellow-500", label: "Orta Risk" }
    case "red":
      return { value: Math.max(percentage, 82.5), className: "bg-red-500", label: "Yüksek Risk" }
    default:
      return { value: percentage || 0, className: "bg-gray-500", label: "Bilinmiyor" }
  }
}

const getHeroGradient = (color: string | null | undefined): string => {
  if (color === "emerald") return "from-emerald-600 via-teal-600 to-green-700"
  if (color === "yellow") return "from-yellow-500 via-amber-500 to-orange-600"
  if (color === "red") return "from-red-600 via-rose-600 to-pink-700"
  return "from-gray-600 via-slate-600 to-neutral-700"
}

const SectionCard: React.FC<{
  title: string
  icon: React.ReactNode
  description?: string
  children: React.ReactNode
  defaultOpen?: boolean
  iconGradient?: string
}> = ({ title, icon, description, children, defaultOpen = true, iconGradient = "from-gray-500 to-gray-600" }) => (
  <Collapsible defaultOpen={defaultOpen}>
    <Card className="border-0 shadow-lg overflow-hidden">
      <CollapsibleTrigger className="w-full">
        <CardHeader className="bg-gray-50 dark:bg-black/10 hover:bg-gray-100 dark:hover:bg-black/10 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className={`p-2 bg-gradient-to-r ${iconGradient} text-white rounded-lg mr-4 shadow-lg`}>
                {icon}
              </span>
              <div>
                <CardTitle className="text-xl font-semibold text-gray-800 dark:text-white">{title}</CardTitle>
                {description && (
                  <CardDescription className="text-sm text-gray-500 dark:text-white/60">{description}</CardDescription>
                )}
              </div>
            </div>
            <ChevronsUpDown className="h-5 w-5 text-gray-400 group-data-[state=open]:rotate-180 transition-transform" />
          </div>
        </CardHeader>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <CardContent className="p-6 space-y-4 text-gray-700 dark:text-white/70 leading-relaxed">{children}</CardContent>
      </CollapsibleContent>
    </Card>
  </Collapsible>
)

export default function RiskAnalysisDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  const userId = user?.id

  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null)
  const [analysisData, setAnalysisData] = useState<RiskAnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState("summary")

  const riskProgressData = useMemo(
    () => getRiskProgressData(analysisData?.overallRiskScore),
    [analysisData?.overallRiskScore],
  )
  const [animatedProgress, setAnimatedProgress] = useState(0)

  useEffect(() => {
    if (riskProgressData.value > 0) {
      const timer = setTimeout(() => {
        setAnimatedProgress(riskProgressData.value)
      }, 300) // Shorter delay for faster animation start
      return () => clearTimeout(timer)
    } else {
      setAnimatedProgress(0) // Reset if value is 0
    }
  }, [riskProgressData.value])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  useEffect(() => {
    if (!authLoading && userId && params.id) {
      fetchAnalysis()
    } else if (!authLoading && !userId) {
      setError("Risk analizi detaylarını görüntülemek için lütfen giriş yapın.")
      setLoading(false)
    }
  }, [authLoading, userId, params.id])

  const fetchAnalysis = async () => {
    if (!userId || !params.id) return

    setLoading(true)
    setError(null)
    try {
      const data = await getRiskAnalysisById(params.id as string, userId)
      if (!data) {
        setError("Risk analizi bulunamadı.")
        setAnalysis(null)
        setAnalysisData(null)
        return
      }
      setAnalysis(data)
      // Type assertion might be needed if analysis_data is 'any' in RiskAnalysis
      const parsedAnalysisData = data.analysis_data as RiskAnalysisData
      setAnalysisData(parsedAnalysisData)
    } catch (err: any) {
      console.error("Risk analizi getirilirken hata:", err)
      setError("Risk analizi yüklenirken bir sorun oluştu.")
      setAnalysis(null)
      setAnalysisData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAnalysis = async () => {
    if (!user || !analysis) return

    setIsDeleting(true)
    try {
      await deleteRiskAnalysis(analysis.id, user.id)
      toast({
        title: "Başarılı",
        description: "Risk analizi başarıyla silindi.",
      })
      router.push("/uygulama/finansal-saglik")
    } catch (err: any) {
      console.error("Risk analizi silinirken hata:", err)
      toast({
        title: "Hata",
        description: "Risk analizi silinirken bir sorun oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] gap-6 p-4 text-center">
        <div className="relative">
          <FileText className="h-24 w-24 text-emerald-500 opacity-20" />
          <Loader2 className="absolute inset-0 m-auto h-12 w-12 animate-spin text-emerald-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-white/70">
          Detaylı AI Finansal Sağlık Özetiniz Hazırlanıyor...
        </h2>
        <p className="text-gray-500 dark:text-white/60 max-w-md">
          Finansal verileriniz ve kredi bilgileriniz Gemini AI kullanılarak kapsamlı bir şekilde değerlendiriliyor. Bu
          işlem birkaç saniye sürebilir.
        </p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-6">
        <Alert variant="destructive" className="max-w-md shadow-lg">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">Erişim Reddedildi</AlertTitle>
          <AlertDescription>Risk analizi detaylarını görüntülemek için lütfen giriş yapın.</AlertDescription>
          <Button onClick={() => router.push("/giris")} className="mt-4 w-full">
            Giriş Yap
          </Button>
        </Alert>
      </div>
    )
  }

  if (error || !analysis || !analysisData) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <Alert variant="destructive" className="shadow-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription>{error || "Risk analizi verileri yüklenemedi veya bulunamadı."}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.push("/uygulama/finansal-saglik")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          AI Finansal Sağlık Özeti Listesine Dön
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 p-4 md:p-6">
      {/* Finansal Danışmanlık Uyarısı */}
      <Alert className="bg-yellow-500/10 border-yellow-500/30">
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
        <AlertTitle className="text-yellow-600 dark:text-yellow-500 font-bold">Finansal Danışmanlık Değildir</AlertTitle>
        <AlertDescription className="text-yellow-700 dark:text-yellow-400">
          Bu analiz otomatik AI tarafından üretilmiştir ve finansal tavsiye niteliği taşımaz. Önemli kararlar almadan
          önce lisanslı bir finansal danışmana danışın.
        </AlertDescription>
      </Alert>

      {/* Hero Section */}
      <Card className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 dark:from-emerald-700 dark:via-teal-700 dark:to-emerald-800 text-white border-0 shadow-2xl">
        <CardContent className="p-6 md:p-8">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => router.push("/uygulama/finansal-saglik")}
                  className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white backdrop-blur-sm h-10 w-10 shrink-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="min-w-0">
                  <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
                    {analysisData.overallRiskScore?.color === "emerald" && <ShieldCheck className="h-8 w-8" />}
                    {analysisData.overallRiskScore?.color === "yellow" && <ShieldAlert className="h-8 w-8" />}
                    {analysisData.overallRiskScore?.color === "red" && <ShieldAlert className="h-8 w-8" />}
                    {!analysisData.overallRiskScore?.color && <ShieldQuestion className="h-8 w-8" />}
                    AI Finansal Sağlık Özeti Detayı
                  </h1>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(true)}
                className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white shrink-0"
                size="lg"
              >
                <Trash2 className="mr-2 h-5 w-5" />
                Analizi Sil
              </Button>
            </div>
              <p className="text-white/80 text-base md:text-lg mb-4">
                {new Date(analysis.created_at).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}{" "}
                tarihinde Gemini AI ile oluşturulmuştur. Genel risk skorunuz: {analysisData.overallRiskScore?.value || "Bilinmiyor"}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <p className="text-white/70 text-xs sm:text-sm mb-1">Borç/Gelir Oranı</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {analysisData.debtToIncomeRatio?.value || "N/A"}
                  </p>
                  <p className="text-white/70 text-xs">
                    {analysisData.debtToIncomeRatio?.assessment || ""}
                  </p>
                </div>
                <div>
                  <p className="text-white/70 text-xs sm:text-sm mb-1">Aylık Gelir</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {analysis.monthly_income ? `₺${analysis.monthly_income.toLocaleString("tr-TR")}` : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-white/70 text-xs sm:text-sm mb-1">Risk Seviyesi</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {analysisData.overallRiskScore?.numericScore || 0}/{analysisData.overallRiskScore?.scoreMax || 100}
                  </p>
                  <p className="text-white/70 text-xs">{riskProgressData.label}</p>
                </div>
                <div>
                  <p className="text-white/70 text-xs sm:text-sm mb-1">Analiz Tarihi</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true, locale: tr })}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-white/80">Risk Göstergesi</span>
                  <span className="font-medium text-white">{animatedProgress.toFixed(0)}%</span>
                </div>
                <div className="relative h-3 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ease-out rounded-full ${
                      analysisData.overallRiskScore?.color === "emerald"
                        ? "bg-gradient-to-r from-emerald-500 to-green-600"
                        : analysisData.overallRiskScore?.color === "yellow"
                          ? "bg-gradient-to-r from-yellow-500 to-orange-600"
                          : analysisData.overallRiskScore?.color === "red"
                            ? "bg-gradient-to-r from-red-500 to-rose-600"
                            : "bg-gray-500"
                    }`}
                    style={{ width: `${animatedProgress}%` }}
                    aria-label={`Risk Seviyesi: ${animatedProgress.toFixed(0)}%`}
                  />
                </div>
              </div>

            {analysisData.overallRiskScore?.detailedExplanation && (
              <p className="mt-4 text-sm text-white/90">
                {analysisData.overallRiskScore.detailedExplanation}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modern Tabs */}
      <div className="bg-white dark:bg-black/20 rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-emerald-900/10">
            <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1 p-1 h-auto">
              {["summary", "factors", "recommendations", "details", "outlook"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-2 sm:px-3 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900/20 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 text-xs sm:text-sm"
                >
                  {tab === "summary" && (
                    <>
                      <Info className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="hidden sm:inline">Genel Bakış</span>
                      <span className="sm:hidden">Genel</span>
                    </>
                  )}
                  {tab === "factors" && (
                    <>
                      <Activity className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">Faktörler</span>
                    </>
                  )}
                  {tab === "recommendations" && (
                    <>
                      <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">Öneriler</span>
                    </>
                  )}
                  {tab === "details" && (
                    <>
                      <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">Detaylar</span>
                    </>
                  )}
                  {tab === "outlook" && (
                    <>
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">Gelecek</span>
                    </>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="summary" className="p-4 md:p-6 space-y-6">
            <SectionCard
              title="Genel Risk Özeti"
              icon={<FileText className="h-5 w-5" />}
              iconGradient="from-blue-500 to-indigo-600"
              description="Finansal durumunuzun genel bir değerlendirmesi."
            >
              <p className="text-base">{analysisData.overallRiskSummary || "Genel özet bulunmamaktadır."}</p>
            </SectionCard>

            {analysisData.debtToIncomeRatio && (
              <SectionCard
                title="Borç/Gelir Oranı (DTI)"
                icon={<Scale className="h-5 w-5" />}
                iconGradient="from-indigo-500 to-purple-600"
                description="Gelirinize oranla borçlarınızın durumu."
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Oran:</span>
                    <Badge
                      variant={
                        analysisData.debtToIncomeRatio.assessment === "İyi"
                          ? "default"
                          : analysisData.debtToIncomeRatio.assessment === "Orta"
                            ? "outline"
                            : analysisData.debtToIncomeRatio.assessment === "Yüksek" ||
                                analysisData.debtToIncomeRatio.assessment === "İyileştirilmeli"
                              ? "destructive"
                              : "secondary"
                      }
                    >
                      {analysisData.debtToIncomeRatio.value} ({analysisData.debtToIncomeRatio.assessment})
                    </Badge>
                  </div>
                  <p>
                    <strong className="font-medium">Açıklama:</strong> {analysisData.debtToIncomeRatio.explanation}
                  </p>
                  {analysisData.debtToIncomeRatio.benchmark && (
                    <div className="p-3 bg-gray-100 dark:bg-black/10 rounded-md text-sm space-y-1">
                      <p>
                        <strong>İdeal Aralık:</strong> {analysisData.debtToIncomeRatio.benchmark.idealRange}
                      </p>
                      <p>
                        <strong>Uyarı Aralığı:</strong> {analysisData.debtToIncomeRatio.benchmark.warningRange}
                      </p>
                      <p>
                        <strong>Kritik Aralık:</strong> {analysisData.debtToIncomeRatio.benchmark.criticalRange}
                      </p>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {analysisData.cashFlowAnalysis && (
              <SectionCard
                title="Nakit Akış Analizi"
                icon={<Banknote className="h-5 w-5" />}
                iconGradient="from-emerald-500 to-teal-600"
                description="Aylık gelir ve giderlerinizin dengesi."
              >
                <div className="space-y-3">
                  <p>
                    <strong>Aylık Gelir:</strong> ₺
                    {analysisData.cashFlowAnalysis.monthlyIncome?.toLocaleString("tr-TR") || "N/A"}
                  </p>
                  <p>
                    <strong>Aylık Giderler:</strong> ₺
                    {analysisData.cashFlowAnalysis.monthlyExpenses?.toLocaleString("tr-TR") || "N/A"}
                  </p>
                  <p>
                    <strong>Kullanılabilir Gelir:</strong> ₺
                    {analysisData.cashFlowAnalysis.disposableIncome?.toLocaleString("tr-TR") || "N/A"}
                  </p>
                  <div className="flex items-center">
                    <strong className="mr-2">Değerlendirme:</strong>
                    <Badge
                      variant={
                        analysisData.cashFlowAnalysis.assessment === "Pozitif"
                          ? "default"
                          : analysisData.cashFlowAnalysis.assessment === "Negatif"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {analysisData.cashFlowAnalysis.assessment}
                    </Badge>
                  </div>
                  <p>
                    <strong className="font-medium">Açıklama:</strong> {analysisData.cashFlowAnalysis.explanation}
                  </p>
                  {analysisData.cashFlowAnalysis.suggestions &&
                    analysisData.cashFlowAnalysis.suggestions.length > 0 && (
                      <div>
                        <strong className="font-medium">Öneriler:</strong>
                        <ul className="list-disc list-inside ml-4 space-y-1 mt-1">
                          {analysisData.cashFlowAnalysis.suggestions.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              </SectionCard>
            )}
          </TabsContent>

          <TabsContent value="factors" className="p-4 md:p-6 space-y-6">
            <SectionCard
              title="Temel Risk Faktörleri"
              icon={<TrendingDown className="h-5 w-5" />}
              iconGradient="from-red-500 to-rose-600"
              description="Finansal sağlığınızı olumsuz etkileyebilecek önemli noktalar."
            >
              {analysisData.keyRiskFactors && analysisData.keyRiskFactors.length > 0 ? (
                <div className="space-y-4">
                  {analysisData.keyRiskFactors.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 border border-red-200 dark:border-red-700 rounded-xl bg-red-50 dark:bg-red-900/30"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-red-800 dark:text-red-300">{item.factor}</h4>
                        <Badge variant={getSeverityBadgeVariant(item.severity)}>{item.severity}</Badge>
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-400 mb-1">
                        <strong>Etki:</strong> {item.impact}
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-400">{item.detailedExplanation}</p>
                      {item.mitigationTips && item.mitigationTips.length > 0 && (
                        <div className="mt-2">
                          <strong className="text-xs text-red-600 dark:text-red-300">Azaltma İpuçları:</strong>
                          <ul className="list-disc list-inside ml-4 text-xs text-red-700 dark:text-red-400 space-y-0.5">
                            {item.mitigationTips.map((tip, tipIdx) => (
                              <li key={tipIdx}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>
                  Belirlenen önemli bir risk faktörü bulunmamaktadır.{" "}
                  <Sparkles className="inline h-4 w-4 text-green-500" />
                </p>
              )}
            </SectionCard>

            <SectionCard
              title="Pozitif Faktörler"
              icon={<TrendingUp className="h-5 w-5" />}
              iconGradient="from-emerald-500 to-green-600"
              description="Finansal durumunuzu olumlu etkileyen güçlü yanlarınız."
            >
              {analysisData.positiveFactors && analysisData.positiveFactors.length > 0 ? (
                <div className="space-y-3">
                  {analysisData.positiveFactors.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 border border-emerald-200 dark:border-emerald-700 rounded-xl bg-emerald-50 dark:bg-emerald-900/30"
                    >
                      <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-1">{item.factor}</h4>
                      <p className="text-sm text-emerald-700 dark:text-emerald-400 mb-1">
                        <strong>Fayda:</strong> {item.benefit}
                      </p>
                      <p className="text-sm text-emerald-700 dark:text-emerald-400">{item.detailedExplanation}</p>
                      {item.enhancementTips && item.enhancementTips.length > 0 && (
                        <div className="mt-2">
                          <strong className="text-xs text-emerald-600 dark:text-emerald-300">
                            Güçlendirme İpuçları:
                          </strong>
                          <ul className="list-disc list-inside ml-4 text-xs text-emerald-700 dark:text-emerald-400 space-y-0.5">
                            {item.enhancementTips.map((tip, tipIdx) => (
                              <li key={tipIdx}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>Belirlenen önemli bir pozitif faktör bulunmamaktadır.</p>
              )}
            </SectionCard>
          </TabsContent>

          <TabsContent value="recommendations" className="p-4 md:p-6">
            <SectionCard
              title="Öneriler"
              icon={<Lightbulb className="h-5 w-5" />}
              iconGradient="from-yellow-500 to-amber-600"
              description="Finansal sağlığınızı iyileştirmek için eyleme geçirilebilir adımlar."
            >
              {analysisData.recommendations && analysisData.recommendations.length > 0 ? (
                <div className="space-y-4">
                  {analysisData.recommendations.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 border border-yellow-300 dark:border-yellow-700 rounded-xl bg-yellow-50 dark:bg-yellow-900/30"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">{item.recommendation}</h4>
                        <Badge variant={getSeverityBadgeVariant(item.priority)}>{item.priority} Öncelik</Badge>
                      </div>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-2">{item.details}</p>
                      {item.actionSteps && item.actionSteps.length > 0 && (
                        <div className="mb-2">
                          <strong className="text-xs text-yellow-600 dark:text-yellow-300">Adımlar:</strong>
                          <ol className="list-decimal list-inside ml-4 text-xs text-yellow-700 dark:text-yellow-400 space-y-0.5">
                            {item.actionSteps.map((step, stepIdx) => (
                              <li key={stepIdx}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                      <p className="text-xs text-yellow-600 dark:text-yellow-500">
                        <strong>Potansiyel Etki:</strong> {item.potentialImpact}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Şu anda özel bir öneri bulunmamaktadır.</p>
              )}
            </SectionCard>
          </TabsContent>

          <TabsContent value="details" className="p-4 md:p-6 space-y-6">
            {/* 1. Tasarruf Analizi - En Üstte */}
            {analysisData.savingsAnalysis && (
              <SectionCard
                title="Tasarruf Analizi"
                icon={<PiggyBank className="h-5 w-5" />}
                iconGradient="from-pink-500 to-rose-600"
                description="Acil durum fonu ve tasarruf alışkanlıklarınız."
              >
                <div className="space-y-3">
                  <div className="flex items-center">
                    <strong className="mr-2">Değerlendirme:</strong>
                    <Badge variant={analysisData.savingsAnalysis.assessment === "Yeterli" ? "default" : "outline"}>
                      {analysisData.savingsAnalysis.assessment}
                    </Badge>
                  </div>
                  <p>
                    <strong>Acil Durum Fonu Durumu:</strong> {analysisData.savingsAnalysis.emergencyFundStatus}
                  </p>
                  {analysisData.savingsAnalysis.emergencyFundTarget && (
                    <p>
                      <strong>Acil Durum Fonu Hedefi:</strong> {analysisData.savingsAnalysis.emergencyFundTarget}
                    </p>
                  )}
                  <p>
                    <strong className="font-medium">Öneriler:</strong> {analysisData.savingsAnalysis.suggestions}
                  </p>
                </div>
              </SectionCard>
            )}

            {/* 2. Kredi Sağlığı Özeti */}
            {analysisData.creditHealthSummary && (
              <SectionCard
                title="Kredi Sağlığı Özeti"
                icon={<CreditCard className="h-5 w-5" />}
                iconGradient="from-orange-500 to-red-600"
                description="Kredi kullanımınızın genel bir değerlendirmesi."
              >
                <p>{analysisData.creditHealthSummary}</p>
                {analysisData.creditUtilization && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10 space-y-2">
                    <div className="flex items-center">
                      <strong className="mr-2">Değerlendirme:</strong>
                      <Badge variant={analysisData.creditUtilization.assessment === "İyi" ? "default" : "outline"}>
                        {analysisData.creditUtilization.assessment}
                      </Badge>
                    </div>
                    <p>
                      <strong>Genel Kredi Kullanım Oranı:</strong>{" "}
                      {analysisData.creditUtilization.overallUtilizationRate || "N/A"}
                    </p>
                    <p>
                      <strong className="font-medium">Açıklama:</strong> {analysisData.creditUtilization.explanation}
                    </p>
                  </div>
                )}
              </SectionCard>
            )}

            {/* 3. Grafik Verileri - TÜM GRAFİKLER */}
            {(analysisData.chartsData || analysisData.cashFlowAnalysis || (analysisData.keyRiskFactors && analysisData.keyRiskFactors.length > 0)) && (
              <SectionCard
                title="Grafik Verileri"
                icon={<BarChart3 className="h-5 w-5" />}
                iconGradient="from-teal-500 to-cyan-600"
                description="Finansal durumunuzun görsel analizi."
              >
                <div className="space-y-8">
                  {/* YENİ GRAFİKLER */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 1. Nakit Akışı Analizi */}
                    {analysisData.cashFlowAnalysis && (
                      <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0 overflow-hidden">
                        <CardHeader className="border-b border-gray-100 dark:border-white/5 pb-4">
                          <CardTitle className="text-xl text-gray-900 dark:text-white">Nakit Akışı Analizi</CardTitle>
                          <CardDescription className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                            Aylık gelir ve gider dağılımı
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Aylık Gelir</span>
                                </div>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                  ₺{analysisData.cashFlowAnalysis.monthlyIncome?.toLocaleString("tr-TR") || "0"}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full" style={{ width: "100%" }} />
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-red-500" />
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Aylık Giderler</span>
                                </div>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                  ₺{analysisData.cashFlowAnalysis.monthlyExpenses?.toLocaleString("tr-TR") || "0"}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full"
                                  style={{ width: `${analysisData.cashFlowAnalysis.monthlyIncome ? ((analysisData.cashFlowAnalysis.monthlyExpenses || 0) / analysisData.cashFlowAnalysis.monthlyIncome) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Borç Ödemeleri</span>
                                </div>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                  ₺{analysisData.debtToIncomeRatio?.debtPaymentsForDTI?.toLocaleString("tr-TR") || "0"}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full"
                                  style={{ width: `${analysisData.cashFlowAnalysis.monthlyIncome ? ((analysisData.debtToIncomeRatio?.debtPaymentsForDTI || 0) / analysisData.cashFlowAnalysis.monthlyIncome) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Kullanılabilir Gelir</span>
                                </div>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                  ₺{analysisData.cashFlowAnalysis.disposableIncome?.toLocaleString("tr-TR") || "0"}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full"
                                  style={{ width: `${analysisData.cashFlowAnalysis.monthlyIncome ? ((analysisData.cashFlowAnalysis.disposableIncome || 0) / analysisData.cashFlowAnalysis.monthlyIncome) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* 2. Risk Faktörleri Dağılımı */}
                    {analysisData.keyRiskFactors && analysisData.keyRiskFactors.length > 0 && (
                      <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0 overflow-hidden">
                        <CardHeader className="border-b border-gray-100 dark:border-white/5 pb-4">
                          <CardTitle className="text-xl text-gray-900 dark:text-white">Risk Faktörleri Dağılımı</CardTitle>
                          <CardDescription className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                            Tespit edilen risk seviyelerine göre
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            {analysisData.keyRiskFactors.slice(0, 5).map((risk, index) => (
                              <div key={index}>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className={`w-3 h-3 rounded-full ${risk.severity === "Yüksek" ? "bg-red-500" : risk.severity === "Orta" ? "bg-yellow-500" : "bg-emerald-500"}`} />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{risk.factor}</span>
                                  </div>
                                  <Badge variant={risk.severity === "Yüksek" ? "destructive" : risk.severity === "Orta" ? "outline" : "default"} className="ml-2 shrink-0">
                                    {risk.severity}
                                  </Badge>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                                  <div
                                    className={`h-3 rounded-full ${risk.severity === "Yüksek" ? "bg-gradient-to-r from-red-500 to-red-600" : risk.severity === "Orta" ? "bg-gradient-to-r from-yellow-500 to-yellow-600" : "bg-gradient-to-r from-emerald-500 to-emerald-600"}`}
                                    style={{ width: `${risk.severity === "Yüksek" ? 90 : risk.severity === "Orta" ? 60 : 30}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* 3. Finansal Sağlık Kategorileri - Radial Charts */}
                  <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0 overflow-hidden">
                    <CardHeader className="border-b border-gray-100 dark:border-white/5 pb-4">
                      <CardTitle className="text-xl text-gray-900 dark:text-white">Finansal Sağlık Kategorileri</CardTitle>
                      <CardDescription className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                        Farklı kategorilerdeki performansınız
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="flex flex-col items-center">
                          <div className="relative w-24 h-24 mb-3">
                            <svg viewBox="0 0 100 100" className="transform -rotate-90">
                              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-gray-800" />
                              <circle cx="50" cy="50" r="40" fill="none" stroke="#10B981" strokeWidth="8" strokeDasharray={`${((100 - (analysisData.overallRiskScore?.numericScore || 50)) / 100) * 251.2} 251.2`} strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xl font-bold text-gray-900 dark:text-white">{100 - (analysisData.overallRiskScore?.numericScore || 50)}</span>
                            </div>
                          </div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">Borç Yönetimi</p>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="relative w-24 h-24 mb-3">
                            <svg viewBox="0 0 100 100" className="transform -rotate-90">
                              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-gray-800" />
                              <circle cx="50" cy="50" r="40" fill="none" stroke="#3B82F6" strokeWidth="8" strokeDasharray={`${analysisData.cashFlowAnalysis?.monthlyIncome ? Math.min(((analysisData.cashFlowAnalysis.disposableIncome || 0) / analysisData.cashFlowAnalysis.monthlyIncome) * 100 * 251.2 / 100, 251.2) : 0} 251.2`} strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xl font-bold text-gray-900 dark:text-white">{analysisData.cashFlowAnalysis?.monthlyIncome ? Math.round(((analysisData.cashFlowAnalysis.disposableIncome || 0) / analysisData.cashFlowAnalysis.monthlyIncome) * 100) : 0}</span>
                            </div>
                          </div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">Nakit Akışı</p>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="relative w-24 h-24 mb-3">
                            <svg viewBox="0 0 100 100" className="transform -rotate-90">
                              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-gray-800" />
                              <circle cx="50" cy="50" r="40" fill="none" stroke={parseFloat(analysisData.debtToIncomeRatio?.value?.replace("%", "") || "0") > 40 ? "#EF4444" : parseFloat(analysisData.debtToIncomeRatio?.value?.replace("%", "") || "0") > 30 ? "#F59E0B" : "#10B981"} strokeWidth="8" strokeDasharray={`${Math.min((parseFloat(analysisData.debtToIncomeRatio?.value?.replace("%", "") || "0") * 251.2) / 100, 251.2)} 251.2`} strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xl font-bold text-gray-900 dark:text-white">{analysisData.debtToIncomeRatio?.value || "0"}</span>
                            </div>
                          </div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">DTI Oranı</p>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="relative w-24 h-24 mb-3">
                            <svg viewBox="0 0 100 100" className="transform -rotate-90">
                              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-gray-800" />
                              <circle cx="50" cy="50" r="40" fill="none" stroke="#8B5CF6" strokeWidth="8" strokeDasharray={`${((100 - (analysisData.overallRiskScore?.numericScore || 0)) / 100) * 251.2} 251.2`} strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xl font-bold text-gray-900 dark:text-white">{100 - (analysisData.overallRiskScore?.numericScore || 0)}</span>
                            </div>
                          </div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">Genel Skor</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 4-5. Borç ve Varlık Dağılımı Donut Charts */}
                  {analysisData.chartsData && (analysisData.chartsData.debtBreakdown || analysisData.chartsData.assetAllocation) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Borç Dağılımı Donut */}
                      {analysisData.chartsData.debtBreakdown && analysisData.chartsData.debtBreakdown.length > 0 && (
                        <div>
                          <h5 className="font-semibold mb-4 text-lg text-gray-900 dark:text-white">Borç Dağılımı</h5>
                          <div className="bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-6">
                            <div className="flex items-center gap-6">
                              <div className="w-40 h-40 relative flex-shrink-0">
                                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="12" className="text-gray-200 dark:text-gray-800" />
                                  {(() => {
                                    let offset = 0
                                    const total = analysisData.chartsData.debtBreakdown!.reduce((sum, item) => sum + item.amount, 0)
                                    return analysisData.chartsData.debtBreakdown!.slice(0, 5).map((item, index) => {
                                      const percentage = (item.amount / total) * 100
                                      const dashLength = (percentage / 100) * 251.2
                                      const segment = (
                                        <circle key={item.name} cx="50" cy="50" r="40" fill="none" stroke={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth="12" strokeDasharray={`${dashLength} 251.2`} strokeDashoffset={-offset} strokeLinecap="round" />
                                      )
                                      offset += dashLength
                                      return segment
                                    })
                                  })()}
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="text-center">
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{analysisData.chartsData.debtBreakdown.length}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Kaynak</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex-1 space-y-3">
                                {analysisData.chartsData.debtBreakdown.slice(0, 5).map((item, index) => (
                                  <div key={item.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">₺{item.amount.toLocaleString("tr-TR")}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Varlık Dağılımı Donut */}
                      {analysisData.chartsData.assetAllocation && analysisData.chartsData.assetAllocation.length > 0 && (
                        <div>
                          <h5 className="font-semibold mb-4 text-lg text-gray-900 dark:text-white">Varlık Dağılımı</h5>
                          <div className="bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-6">
                            <div className="flex items-center gap-6">
                              <div className="w-40 h-40 relative flex-shrink-0">
                                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="12" className="text-gray-200 dark:text-gray-800" />
                                  {(() => {
                                    let offset = 0
                                    const total = analysisData.chartsData.assetAllocation!.reduce((sum, item) => sum + item.value, 0)
                                    return analysisData.chartsData.assetAllocation!.slice(0, 5).map((item, index) => {
                                      const percentage = (item.value / total) * 100
                                      const dashLength = (percentage / 100) * 251.2
                                      const segment = (
                                        <circle key={item.name} cx="50" cy="50" r="40" fill="none" stroke={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth="12" strokeDasharray={`${dashLength} 251.2`} strokeDashoffset={-offset} strokeLinecap="round" />
                                      )
                                      offset += dashLength
                                      return segment
                                    })
                                  })()}
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="text-center">
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{analysisData.chartsData.assetAllocation.length}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Varlık</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex-1 space-y-3">
                                {analysisData.chartsData.assetAllocation.slice(0, 5).map((item, index) => (
                                  <div key={item.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">₺{item.value.toLocaleString("tr-TR")}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {/* 4. Varlık ve Yükümlülük Analizi - En Sonda */}
            {analysisData.assetLiabilityAnalysis && (
              <SectionCard
                title="Varlık ve Yükümlülük Analizi"
                icon={<PieChart className="h-5 w-5" />}
                iconGradient="from-cyan-500 to-blue-600"
                description="Mali durumunuzun anlık görüntüsü."
              >
                <div className="space-y-3">
                  <p>
                    <strong>Toplam Varlıklar:</strong> ₺{analysisData.assetLiabilityAnalysis.totalAssets?.toLocaleString("tr-TR") || "N/A"}
                  </p>
                  <p>
                    <strong>Toplam Yükümlülükler:</strong> ₺{analysisData.assetLiabilityAnalysis.totalLiabilities?.toLocaleString("tr-TR") || "N/A"}
                  </p>
                  <p>
                    <strong>Net Varlık:</strong> ₺{analysisData.assetLiabilityAnalysis.netWorth?.toLocaleString("tr-TR") || "N/A"}
                  </p>
                  <div className="flex items-center">
                    <strong className="mr-2">Değerlendirme:</strong>
                    <Badge variant={analysisData.assetLiabilityAnalysis.assessment === "Sağlıklı" ? "default" : "outline"}>
                      {analysisData.assetLiabilityAnalysis.assessment}
                    </Badge>
                  </div>
                  <p>
                    <strong className="font-medium">Açıklama:</strong> {analysisData.assetLiabilityAnalysis.explanation}
                  </p>
                  {analysisData.assetLiabilityAnalysis.assetBreakdown && analysisData.assetLiabilityAnalysis.assetBreakdown.length > 0 && (
                    <div>
                      <strong className="font-medium">Varlık Dağılımı:</strong>
                      <ul className="list-disc list-inside ml-4 text-sm">
                        {analysisData.assetLiabilityAnalysis.assetBreakdown.map((a) => `${a.category}: ₺${a.value.toLocaleString("tr-TR")} (%${a.percentage || "N/A"})`).map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysisData.assetLiabilityAnalysis.liabilityBreakdown && analysisData.assetLiabilityAnalysis.liabilityBreakdown.length > 0 && (
                    <div>
                      <strong className="font-medium">Yükümlülük Dağılımı:</strong>
                      <ul className="list-disc list-inside ml-4 text-sm">
                        {analysisData.assetLiabilityAnalysis.liabilityBreakdown.map((l) => `${l.category}: ₺${l.value.toLocaleString("tr-TR")} (%${l.percentage || "N/A"})`).map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}
          </TabsContent>

          <TabsContent value="outlook" className="p-4 md:p-6">
            {analysisData.futureOutlook && (
              <SectionCard
                title="Gelecek Perspektifi"
                icon={<Zap className="h-5 w-5" />}
                iconGradient="from-fuchsia-500 to-purple-600"
                description="Finansal geleceğinize dair öngörüler ve fırsatlar."
              >
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Kısa Vadeli Görünüm (6-12 Ay)</h4>
                    <p>{analysisData.futureOutlook.shortTerm}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Uzun Vadeli Görünüm (1-5 Yıl)</h4>
                    <p>{analysisData.futureOutlook.longTerm}</p>
                  </div>
                  {analysisData.futureOutlook.potentialChallenges &&
                    analysisData.futureOutlook.potentialChallenges.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-lg mb-1">Potansiyel Zorluklar</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {analysisData.futureOutlook.potentialChallenges.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  {analysisData.futureOutlook.opportunities && analysisData.futureOutlook.opportunities.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-lg mb-1">Fırsatlar</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {analysisData.futureOutlook.opportunities.map((o, i) => (
                          <li key={i}>{o}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>AI Finansal Sağlık Özetini Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu AI Finansal Sağlık Özetini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              <div className="mt-3 p-3 bg-gray-100 dark:bg-black/10 rounded-lg text-sm">
                <strong>Tarih:</strong> {new Date(analysis.created_at).toLocaleDateString("tr-TR")}
                <br />
                <strong>Risk Skoru:</strong> {analysis.overall_risk_score || "Bilinmiyor"}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAnalysis}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                "Sil"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
