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

const getSeverityBadgeVariant = (
  severity: string | undefined,
): "destructive" | "warning" | "success" | "secondary" | "info" | "outline" | "default" => {
  switch (severity?.toLowerCase()) {
    case "yüksek":
      return "destructive"
    case "orta":
      return "warning"
    case "düşük":
      return "success"
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
}> = ({ title, icon, description, children, defaultOpen = true }) => (
  <Collapsible defaultOpen={defaultOpen}>
    <Card className="border-0 shadow-lg overflow-hidden">
      <CollapsibleTrigger className="w-full">
        <CardHeader className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="p-2 bg-primary/10 text-primary rounded-lg mr-4">{icon}</span>
              <div>
                <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</CardTitle>
                {description && (
                  <CardDescription className="text-sm text-gray-500 dark:text-gray-400">{description}</CardDescription>
                )}
              </div>
            </div>
            <ChevronsUpDown className="h-5 w-5 text-gray-400 group-data-[state=open]:rotate-180 transition-transform" />
          </div>
        </CardHeader>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <CardContent className="p-6 space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed">{children}</CardContent>
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
      const data = await getRiskAnalysisById(userId, params.id as string)
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
      await deleteRiskAnalysis(user.id, analysis.id)
      toast({
        title: "Başarılı",
        description: "Risk analizi başarıyla silindi.",
        variant: "success",
      })
      router.push("/uygulama/risk-analizi")
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
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
          Detaylı Risk Analiziniz Hazırlanıyor...
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
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
        <Button variant="outline" onClick={() => router.push("/uygulama/risk-analizi")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Risk Analizi Listesine Dön
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 p-4 md:p-6">
      {/* Hero Section */}
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${getHeroGradient(analysisData.overallRiskScore?.color)} p-6 md:p-8 text-white shadow-2xl`}
      >
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push("/uygulama/risk-analizi")}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 h-10 w-10 shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Risk Analizi Detayı</h1>
                <p className="text-white/80 text-sm md:text-base">
                  {new Date(analysis.created_at).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  tarihinde Gemini AI ile oluşturuldu.
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              className="bg-red-500/80 hover:bg-red-600/90 border-red-400/50 text-white shrink-0"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Analizi Sil
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center mb-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-white/25`}>
                {analysisData.overallRiskScore?.color === "emerald" && <ShieldCheck className="h-8 w-8 text-white" />}
                {analysisData.overallRiskScore?.color === "yellow" && <ShieldAlert className="h-8 w-8 text-white" />}
                {analysisData.overallRiskScore?.color === "red" && <ShieldAlert className="h-8 w-8 text-white" />}
                {!analysisData.overallRiskScore?.color && <ShieldQuestion className="h-8 w-8 text-white" />}
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  {analysisData.overallRiskScore?.value || "Bilinmiyor"}
                </h3>
                <p className="text-white/80 text-sm sm:text-base">Genel Risk Skoru</p>
              </div>
            </div>
            <Badge
              variant="secondary"
              className={`px-4 py-2 text-sm font-medium bg-white/20 text-white border-white/30 justify-self-start md:justify-self-end`}
            >
              {riskProgressData.label}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-white/80">
                Risk Seviyesi ({analysisData.overallRiskScore?.numericScore || 0} /{" "}
                {analysisData.overallRiskScore?.scoreMax || 100})
              </span>
              <span className="font-medium text-white">{animatedProgress.toFixed(0)}%</span>
            </div>
            <Progress
              value={animatedProgress}
              className={`h-3 bg-white/20 [&>div]:${riskProgressData.className} [&>div]:transition-all [&>div]:duration-1000 [&>div]:ease-out`}
              aria-label={`Risk Seviyesi: ${animatedProgress.toFixed(0)}%`}
            />
          </div>
          {analysisData.overallRiskScore?.detailedExplanation && (
            <p className="mt-4 text-sm text-white/90 bg-black/10 p-3 rounded-lg">
              {analysisData.overallRiskScore.detailedExplanation}
            </p>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <MetricCard
          title="Borç/Gelir Oranı"
          value={analysisData.debtToIncomeRatio?.value || "N/A"}
          subtitle={analysisData.debtToIncomeRatio?.assessment || "Değerlendirme yok"}
          icon={<Scale />}
          color="blue"
        />
        <MetricCard
          title="Aylık Gelir"
          value={analysis.monthly_income ? `₺${analysis.monthly_income.toLocaleString("tr-TR")}` : "N/A"}
          subtitle="Beyan edilen gelir"
          icon={<Banknote />}
          color="green"
        />
        <MetricCard
          title="Net Varlık"
          value={
            analysisData.assetLiabilityAnalysis?.netWorth !== null &&
            analysisData.assetLiabilityAnalysis?.netWorth !== undefined
              ? `₺${analysisData.assetLiabilityAnalysis.netWorth.toLocaleString("tr-TR")}`
              : "N/A"
          }
          subtitle="Varlık - Yükümlülük"
          icon={<Landmark />}
          color="purple"
        />
        <MetricCard
          title="Analiz Tarihi"
          value={formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true, locale: tr })}
          subtitle="Oluşturulma zamanı"
          icon={<Calendar />}
          color="orange"
        />
      </div>

      {/* Modern Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1 p-1 h-auto">
              {["summary", "factors", "recommendations", "details", "outlook"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700/70 text-xs sm:text-sm"
                >
                  {tab === "summary" && (
                    <>
                      <Info className="h-4 w-4" /> Genel Bakış
                    </>
                  )}
                  {tab === "factors" && (
                    <>
                      <Activity className="h-4 w-4" /> Faktörler
                    </>
                  )}
                  {tab === "recommendations" && (
                    <>
                      <Lightbulb className="h-4 w-4" /> Öneriler
                    </>
                  )}
                  {tab === "details" && (
                    <>
                      <ClipboardList className="h-4 w-4" /> Detaylar
                    </>
                  )}
                  {tab === "outlook" && (
                    <>
                      <TrendingUp className="h-4 w-4" /> Gelecek
                    </>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="summary" className="p-4 md:p-6 space-y-6">
            <SectionCard
              title="Genel Risk Özeti"
              icon={<FileText className="text-blue-600" />}
              description="Finansal durumunuzun genel bir değerlendirmesi."
            >
              <p className="text-base">{analysisData.overallRiskSummary || "Genel özet bulunmamaktadır."}</p>
            </SectionCard>

            {analysisData.debtToIncomeRatio && (
              <SectionCard
                title="Borç/Gelir Oranı (DTI)"
                icon={<Scale className="text-indigo-600" />}
                description="Gelirinize oranla borçlarınızın durumu."
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Oran:</span>
                    <Badge
                      variant={
                        analysisData.debtToIncomeRatio.assessment === "İyi"
                          ? "success"
                          : analysisData.debtToIncomeRatio.assessment === "Orta"
                            ? "warning"
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
                    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-sm space-y-1">
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
                icon={<Banknote className="text-green-600" />}
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
                          ? "success"
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
              icon={<TrendingDown className="text-red-600" />}
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
              icon={<TrendingUp className="text-emerald-600" />}
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
              icon={<Lightbulb className="text-yellow-500" />}
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
            {analysisData.assetLiabilityAnalysis && (
              <SectionCard
                title="Varlık ve Yükümlülük Analizi"
                icon={<PieChart className="text-cyan-600" />}
                description="Mali durumunuzun anlık görüntüsü."
              >
                <div className="space-y-3">
                  <p>
                    <strong>Toplam Varlıklar:</strong> ₺
                    {analysisData.assetLiabilityAnalysis.totalAssets?.toLocaleString("tr-TR") || "N/A"}
                  </p>
                  <p>
                    <strong>Toplam Yükümlülükler:</strong> ₺
                    {analysisData.assetLiabilityAnalysis.totalLiabilities?.toLocaleString("tr-TR") || "N/A"}
                  </p>
                  <p>
                    <strong>Net Varlık:</strong> ₺
                    {analysisData.assetLiabilityAnalysis.netWorth?.toLocaleString("tr-TR") || "N/A"}
                  </p>
                  <div className="flex items-center">
                    <strong className="mr-2">Değerlendirme:</strong>
                    <Badge
                      variant={analysisData.assetLiabilityAnalysis.assessment === "Sağlıklı" ? "success" : "warning"}
                    >
                      {analysisData.assetLiabilityAnalysis.assessment}
                    </Badge>
                  </div>
                  <p>
                    <strong className="font-medium">Açıklama:</strong> {analysisData.assetLiabilityAnalysis.explanation}
                  </p>
                  {analysisData.assetLiabilityAnalysis.assetBreakdown &&
                    analysisData.assetLiabilityAnalysis.assetBreakdown.length > 0 && (
                      <div>
                        <strong className="font-medium">Varlık Dağılımı:</strong>
                        <ul className="list-disc list-inside ml-4 text-sm">
                          {analysisData.assetLiabilityAnalysis.assetBreakdown
                            .map(
                              (a) => `${a.category}: ₺${a.value.toLocaleString("tr-TR")} (%${a.percentage || "N/A"})`,
                            )
                            .map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                        </ul>
                      </div>
                    )}
                  {analysisData.assetLiabilityAnalysis.liabilityBreakdown &&
                    analysisData.assetLiabilityAnalysis.liabilityBreakdown.length > 0 && (
                      <div>
                        <strong className="font-medium">Yükümlülük Dağılımı:</strong>
                        <ul className="list-disc list-inside ml-4 text-sm">
                          {analysisData.assetLiabilityAnalysis.liabilityBreakdown
                            .map(
                              (l) => `${l.category}: ₺${l.value.toLocaleString("tr-TR")} (%${l.percentage || "N/A"})`,
                            )
                            .map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                        </ul>
                      </div>
                    )}
                </div>
              </SectionCard>
            )}
            {analysisData.savingsAnalysis && (
              <SectionCard
                title="Tasarruf Analizi"
                icon={<PiggyBank className="text-pink-600" />}
                description="Acil durum fonu ve tasarruf alışkanlıklarınız."
              >
                <div className="space-y-3">
                  <div className="flex items-center">
                    <strong className="mr-2">Değerlendirme:</strong>
                    <Badge variant={analysisData.savingsAnalysis.assessment === "Yeterli" ? "success" : "warning"}>
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
            {analysisData.creditHealthSummary && (
              <SectionCard
                title="Kredi Sağlığı Özeti"
                icon={<CreditCard className="text-orange-600" />}
                description="Kredi kullanımınızın genel bir değerlendirmesi."
              >
                <p>{analysisData.creditHealthSummary}</p>
                {analysisData.creditUtilization && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <div className="flex items-center">
                      <strong className="mr-2">Değerlendirme:</strong>
                      <Badge variant={analysisData.creditUtilization.assessment === "İyi" ? "success" : "warning"}>
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
            {analysisData.chartsData && (
              <SectionCard
                title="Grafik Verileri (Önizleme)"
                icon={<BarChart3 className="text-teal-600" />}
                description="AI tarafından üretilen grafik verileri."
              >
                {analysisData.chartsData.debtBreakdown && analysisData.chartsData.debtBreakdown.length > 0 && (
                  <div>
                    <h5 className="font-semibold mb-1">Borç Dağılımı:</h5>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {analysisData.chartsData.debtBreakdown.map((item, idx) => (
                        <li key={idx} style={{ color: item.color || "inherit" }}>
                          {item.name}: ₺{item.amount.toLocaleString("tr-TR")}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysisData.chartsData.assetAllocation && analysisData.chartsData.assetAllocation.length > 0 && (
                  <div className="mt-3">
                    <h5 className="font-semibold mb-1">Varlık Dağılımı:</h5>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {analysisData.chartsData.assetAllocation.map((item, idx) => (
                        <li key={idx} style={{ color: item.color || "inherit" }}>
                          {item.name}: ₺{item.value.toLocaleString("tr-TR")}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </SectionCard>
            )}
          </TabsContent>

          <TabsContent value="outlook" className="p-4 md:p-6">
            {analysisData.futureOutlook && (
              <SectionCard
                title="Gelecek Perspektifi"
                icon={<Zap className="text-fuchsia-600" />}
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
            <AlertDialogTitle>Risk Analizini Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu risk analizini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm">
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
