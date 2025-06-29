"use client"

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Target,
  Calendar,
  Trash2,
  CreditCard,
  Zap,
  FileText,
  Lightbulb,
  TrendingDown,
  Award,
  Calculator,
  Activity,
  ClipboardList,
  Info,
  Loader2,
  ChevronsUpDown,
  Sparkles,
  Scale,
  PiggyBank,
  ArrowRight,
  TrendingUpIcon,
  Banknote,
  Percent,
  Building2,
  Star,
  Shield,
  Users,
  BarChart3,
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

import { useAuth } from "@/hooks/use-auth"
import { getRefinancingAnalysisById, deleteRefinancingAnalysis } from "@/lib/api/refinancing-analyses"
import type { RefinancingAnalysis, RefinancingAnalysisData } from "@/lib/types"
import { formatCurrency } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"
import { MetricCard } from "@/components/metric-card"

const getRefinancingBadgeVariant = (
  potential: string | undefined,
): "destructive" | "warning" | "success" | "secondary" | "info" | "outline" | "default" => {
  switch (potential?.toLowerCase()) {
    case "yüksek":
      return "success"
    case "orta":
      return "warning"
    case "düşük":
      return "secondary"
    default:
      return "secondary"
  }
}

const getUrgencyBadgeVariant = (
  urgency: string | undefined,
): "destructive" | "warning" | "success" | "secondary" | "info" | "outline" | "default" => {
  switch (urgency?.toLowerCase()) {
    case "acil":
      return "destructive"
    case "yüksek":
      return "warning"
    case "orta":
      return "info"
    case "düşük":
      return "secondary"
    default:
      return "secondary"
  }
}

const getRefinancingProgressData = (
  potential: string | undefined,
  totalSavings: number | undefined,
): { value: number; className: string; label: string } => {
  if (!potential) return { value: 0, className: "bg-gray-500", label: "Bilinmiyor" }

  const potentialLower = potential.toLowerCase()

  if (potentialLower.includes("yüksek")) {
    return { value: 85, className: "bg-emerald-500", label: "Yüksek Potansiyel" }
  } else if (potentialLower.includes("orta")) {
    return { value: 55, className: "bg-yellow-500", label: "Orta Potansiyel" }
  } else if (potentialLower.includes("düşük")) {
    return { value: 25, className: "bg-gray-500", label: "Düşük Potansiyel" }
  }

  return { value: 0, className: "bg-gray-500", label: "Bilinmiyor" }
}

const getHeroGradient = (potential: string | undefined): string => {
  if (potential?.toLowerCase().includes("yüksek")) return "from-emerald-600 via-teal-600 to-green-700"
  if (potential?.toLowerCase().includes("orta")) return "from-yellow-500 via-amber-500 to-orange-600"
  if (potential?.toLowerCase().includes("düşük")) return "from-gray-600 via-slate-600 to-neutral-700"
  return "from-blue-600 via-indigo-600 to-purple-700"
}

const getPriorityIcon = (priority: string | undefined) => {
  if (priority === "Yüksek") return <AlertTriangle className="h-4 w-4 text-red-600" />
  if (priority === "Orta") return <Clock className="h-4 w-4 text-orange-600" />
  return <CheckCircle className="h-4 w-4 text-green-600" />
}

const getFeasibilityBadgeVariant = (
  feasibility: string | undefined,
): "success" | "warning" | "destructive" | "secondary" => {
  if (feasibility === "Yüksek") return "success"
  if (feasibility === "Orta") return "warning"
  if (feasibility === "Düşük") return "destructive"
  return "secondary"
}

const ModernSectionCard: React.FC<{
  title: string
  icon: React.ReactNode
  description?: string
  children: React.ReactNode
  defaultOpen?: boolean
  gradient?: string
}> = ({ title, icon, description, children, defaultOpen = true, gradient = "from-blue-50 to-indigo-50" }) => (
  <Collapsible defaultOpen={defaultOpen}>
    <Card className="border-0 shadow-xl overflow-hidden bg-white dark:bg-gray-900">
      <CollapsibleTrigger className="w-full">
        <CardHeader
          className={`bg-gradient-to-r ${gradient} hover:from-blue-100 hover:to-indigo-100 dark:from-gray-800 dark:to-gray-700 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-white/80 dark:bg-gray-800/80 text-primary rounded-xl mr-4 shadow-lg">{icon}</div>
              <div className="text-left">
                <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</CardTitle>
                {description && (
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {description}
                  </CardDescription>
                )}
              </div>
            </div>
            <ChevronsUpDown className="h-5 w-5 text-gray-500 group-data-[state=open]:rotate-180 transition-transform duration-300" />
          </div>
        </CardHeader>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <CardContent className="p-8 space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
          {children}
        </CardContent>
      </CollapsibleContent>
    </Card>
  </Collapsible>
)

const RefinancingOptionCard: React.FC<{
  option: any
  creditType: string
}> = ({ option, creditType }) => (
  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 text-white shadow-2xl">
    <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h5 className="text-2xl font-bold text-white">{option.recommendedBank || option.optionName}</h5>
            <p className="text-white/80 text-lg">{creditType} Refinansmanı</p>
          </div>
        </div>
        <Badge variant={getFeasibilityBadgeVariant(option.feasibility)} className="text-sm px-4 py-2 font-semibold">
          {option.feasibility}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
          <Percent className="h-6 w-6 mx-auto text-white mb-2" />
          <p className="text-xs text-white/80 mb-1">Yeni Faiz Oranı</p>
          <p className="text-xl font-bold text-white">%{option.newRate}</p>
        </div>
        <div className="text-center p-4 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
          <Calendar className="h-6 w-6 mx-auto text-white mb-2" />
          <p className="text-xs text-white/80 mb-1">Vade</p>
          <p className="text-xl font-bold text-white">{option.newTerm || "36"} ay</p>
        </div>
        <div className="text-center p-4 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
          <Banknote className="h-6 w-6 mx-auto text-white mb-2" />
          <p className="text-xs text-white/80 mb-1">Yeni Aylık Taksit</p>
          <p className="text-xl font-bold text-white">{formatCurrency(option.newMonthlyPayment)}</p>
        </div>
        <div className="text-center p-4 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
          <TrendingUpIcon className="h-6 w-6 mx-auto text-white mb-2" />
          <p className="text-xs text-white/80 mb-1">Aylık Tasarruf</p>
          <p className="text-xl font-bold text-white">{formatCurrency(option.monthlySavings || 0)}</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 backdrop-blur-sm p-6 rounded-xl border border-emerald-400/30 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <DollarSign className="h-6 w-6 text-emerald-300" />
          <span className="font-bold text-emerald-100 text-lg">Toplam Tasarruf</span>
        </div>
        <p className="text-3xl font-bold text-emerald-100 mb-2">{formatCurrency(option.totalSavings)}</p>
        {option.comparisonDetails && (
          <p className="text-sm text-emerald-200 bg-emerald-500/20 p-3 rounded-lg">{option.comparisonDetails}</p>
        )}
      </div>

      {option.requirements && option.requirements.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm p-6 rounded-xl border border-yellow-400/30">
          <h6 className="font-bold text-yellow-100 mb-4 flex items-center gap-2 text-lg">
            <CheckCircle className="h-5 w-5" />
            Gereksinimler
          </h6>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {option.requirements.map((req: string, i: number) => (
              <div key={i} className="flex items-center gap-3 text-sm text-yellow-100">
                <ArrowRight className="h-4 w-4 text-yellow-300" />
                {req}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
)

const ActionPlanCard: React.FC<{
  title: string
  icon: React.ReactNode
  actions: string[]
  color: "red" | "orange" | "green" | "blue"
}> = ({ title, icon, actions, color }) => {
  const colorClasses = {
    red: {
      bg: "from-red-500 to-rose-600",
      cardBg: "from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20",
      border: "border-red-200 dark:border-red-800",
      text: "text-red-800 dark:text-red-200",
      iconBg: "bg-red-600",
    },
    orange: {
      bg: "from-orange-500 to-amber-600",
      cardBg: "from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20",
      border: "border-orange-200 dark:border-orange-800",
      text: "text-orange-800 dark:text-orange-200",
      iconBg: "bg-orange-600",
    },
    green: {
      bg: "from-green-500 to-emerald-600",
      cardBg: "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
      border: "border-green-200 dark:border-green-800",
      text: "text-green-800 dark:text-green-200",
      iconBg: "bg-green-600",
    },
    blue: {
      bg: "from-blue-500 to-indigo-600",
      cardBg: "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20",
      border: "border-blue-200 dark:border-blue-800",
      text: "text-blue-800 dark:text-blue-200",
      iconBg: "bg-blue-600",
    },
  }

  const classes = colorClasses[color]

  return (
    <Card className={`border-0 shadow-xl overflow-hidden bg-gradient-to-br ${classes.cardBg}`}>
      <CardHeader className={`bg-gradient-to-r ${classes.bg} text-white`}>
        <CardTitle className="flex items-center gap-3 text-xl font-bold">
          <div className="p-2 bg-white/20 rounded-lg">{icon}</div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {actions.map((action, index) => (
            <div
              key={index}
              className={`flex items-start gap-4 p-4 bg-white/70 dark:bg-gray-800/70 rounded-xl border ${classes.border}`}
            >
              <div
                className={`p-2 ${classes.iconBg} text-white rounded-full text-sm font-bold min-w-[2rem] h-8 flex items-center justify-center`}
              >
                {index + 1}
              </div>
              <p className={`${classes.text} font-medium leading-relaxed`}>{action}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function RefinansmanDetayPage() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const analysisId = params.id as string

  const [analysis, setAnalysis] = useState<RefinancingAnalysis | null>(null)
  const [analysisData, setAnalysisData] = useState<RefinancingAnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState("summary")

  const refinancingProgressData = useMemo(
    () =>
      getRefinancingProgressData(
        analysisData?.overallAssessment?.refinancingPotential,
        analysisData?.overallAssessment?.totalPotentialSavings,
      ),
    [analysisData?.overallAssessment?.refinancingPotential, analysisData?.overallAssessment?.totalPotentialSavings],
  )
  const [animatedProgress, setAnimatedProgress] = useState(0)

  useEffect(() => {
    if (refinancingProgressData.value > 0) {
      const timer = setTimeout(() => {
        setAnimatedProgress(refinancingProgressData.value)
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setAnimatedProgress(0)
    }
  }, [refinancingProgressData.value])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  useEffect(() => {
    if (!authLoading && user?.id && analysisId) {
      fetchAnalysis()
    } else if (!authLoading && !user?.id) {
      setError("Refinansman analizi detaylarını görüntülemek için lütfen giriş yapın.")
      setLoading(false)
    }
  }, [authLoading, user?.id, analysisId])

  const fetchAnalysis = async () => {
    if (!user?.id || !analysisId) return

    setLoading(true)
    setError(null)
    try {
      const data = await getRefinancingAnalysisById(user.id, analysisId)
      if (!data) {
        setError("Refinansman analizi bulunamadı.")
        setAnalysis(null)
        setAnalysisData(null)
        return
      }
      setAnalysis(data)
      setAnalysisData(data.analysis_data as RefinancingAnalysisData)
    } catch (err: any) {
      console.error("Refinansman analizi getirilirken hata:", err)
      setError("Refinansman analizi yüklenirken bir sorun oluştu.")
      setAnalysis(null)
      setAnalysisData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!user || !analysis) return

    setIsDeleting(true)
    try {
      await deleteRefinancingAnalysis(user.id, analysis.id)
      toast({
        title: "Başarılı",
        description: "Refinansman analizi başarıyla silindi.",
        variant: "success",
      })
      router.push("/uygulama/refinansman")
    } catch (err: any) {
      console.error("Refinansman analizi silinirken hata:", err)
      toast({
        title: "Hata",
        description: "Refinansman analizi silinirken bir sorun oluştu.",
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
          <Calculator className="h-24 w-24 text-emerald-500 opacity-20" />
          <Loader2 className="absolute inset-0 m-auto h-12 w-12 animate-spin text-emerald-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
          Detaylı Refinansman Analiziniz Hazırlanıyor...
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Kredi bilgileriniz ve piyasa koşulları Gemini AI kullanılarak kapsamlı bir şekilde değerlendiriliyor. Bu işlem
          birkaç saniye sürebilir.
        </p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-6">
        <Alert variant="destructive" className="max-w-md shadow-lg">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Erişim Reddedildi</AlertTitle>
          <AlertDescription>Refinansman analizi detaylarını görüntülemek için lütfen giriş yapın.</AlertDescription>
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
          <AlertDescription>{error || "Refinansman analizi verileri yüklenemedi veya bulunamadı."}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.push("/uygulama/refinansman")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Refinansman Analizi Listesine Dön
        </Button>
      </div>
    )
  }

  const overallAssessment = analysisData.overallAssessment
  const individualAnalysis = analysisData.individualCreditAnalysis || []
  const actionPlan = analysisData.actionPlan

  return (
    <div className="flex flex-col gap-8 p-4 md:p-6">
      {/* Hero Section */}
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${getHeroGradient(overallAssessment?.refinancingPotential)} p-6 md:p-8 text-white shadow-2xl`}
      >
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push("/uygulama/refinansman")}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 h-10 w-10 shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Refinansman Analizi Detayı</h1>
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
                {overallAssessment?.refinancingPotential?.toLowerCase().includes("yüksek") && (
                  <TrendingUp className="h-8 w-8 text-white" />
                )}
                {overallAssessment?.refinancingPotential?.toLowerCase().includes("orta") && (
                  <Calculator className="h-8 w-8 text-white" />
                )}
                {overallAssessment?.refinancingPotential?.toLowerCase().includes("düşük") && (
                  <TrendingDown className="h-8 w-8 text-white" />
                )}
                {!overallAssessment?.refinancingPotential && <Calculator className="h-8 w-8 text-white" />}
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  {overallAssessment?.refinancingPotential || "Bilinmiyor"}
                </h3>
                <p className="text-white/80 text-sm sm:text-base">Refinansman Potansiyeli</p>
              </div>
            </div>
            <Badge
              variant="secondary"
              className={`px-4 py-2 text-sm font-medium bg-white/20 text-white border-white/30 justify-self-start md:justify-self-end`}
            >
              {refinancingProgressData.label}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-white/80">Refinansman Seviyesi</span>
              <span className="font-medium text-white">{animatedProgress.toFixed(0)}%</span>
            </div>
            <Progress
              value={animatedProgress}
              className={`h-3 bg-white/20 [&>div]:${refinancingProgressData.className} [&>div]:transition-all [&>div]:duration-1000 [&>div]:ease-out`}
              aria-label={`Refinansman Seviyesi: ${animatedProgress.toFixed(0)}%`}
            />
          </div>
          {overallAssessment?.summary && (
            <p className="mt-4 text-sm text-white/90 bg-black/10 p-3 rounded-lg">{overallAssessment.summary}</p>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <MetricCard
          title="Potansiyel Tasarruf"
          value={formatCurrency(overallAssessment?.totalPotentialSavings || 0)}
          subtitle="Toplam tasarruf miktarı"
          icon={<DollarSign />}
          color="emerald"
        />
        <MetricCard
          title="Refinansman Potansiyeli"
          value={overallAssessment?.refinancingPotential || "Bilinmiyor"}
          subtitle="Genel değerlendirme"
          icon={<TrendingUp />}
          color="blue"
        />
        <MetricCard
          title="Aciliyet Seviyesi"
          value={analysis.urgency_level || "Orta"}
          subtitle="Eylem önceliği"
          icon={<Clock />}
          color="orange"
        />
        <MetricCard
          title="Analiz Tarihi"
          value={formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true, locale: tr })}
          subtitle="Oluşturulma zamanı"
          icon={<Calendar />}
          color="purple"
        />
      </div>

      {/* Modern Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
            <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-2 h-auto bg-transparent">
              {["summary", "credits", "action-plan", "recommendations"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="flex items-center justify-center gap-2 py-3 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-emerald-600 data-[state=active]:shadow-lg rounded-xl transition-all duration-300 hover:bg-white/70 dark:hover:bg-gray-800/70 text-xs sm:text-sm font-semibold"
                >
                  {tab === "summary" && (
                    <>
                      <Info className="h-4 w-4" /> Genel Bakış
                    </>
                  )}
                  {tab === "credits" && (
                    <>
                      <CreditCard className="h-4 w-4" /> Kredi Önerileri
                    </>
                  )}
                  {tab === "action-plan" && (
                    <>
                      <ClipboardList className="h-4 w-4" /> Eylem Planı
                    </>
                  )}
                  {tab === "recommendations" && (
                    <>
                      <Lightbulb className="h-4 w-4" /> Öneriler
                    </>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent
            value="summary"
            className="p-6 md:p-8 space-y-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800"
          >
            <ModernSectionCard
              title="Genel Değerlendirme"
              icon={<FileText className="text-blue-600 h-6 w-6" />}
              description="Refinansman durumunuzun kapsamlı analizi"
              gradient="from-blue-50 to-indigo-50"
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="h-6 w-6" />
                  <h4 className="text-xl font-bold">AI Analiz Sonucu</h4>
                </div>
                <p className="text-lg leading-relaxed">
                  {overallAssessment?.summary || "Genel değerlendirme bulunmamaktadır."}
                </p>
              </div>
            </ModernSectionCard>

            <ModernSectionCard
              title="Önerilen Strateji"
              icon={<Target className="text-indigo-600 h-6 w-6" />}
              description="Size özel refinansman stratejisi"
              gradient="from-indigo-50 to-purple-50"
            >
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="h-6 w-6" />
                  <h4 className="text-xl font-bold">Stratejik Öneri</h4>
                </div>
                <p className="text-lg leading-relaxed">
                  {overallAssessment?.recommendedStrategy || "Strateji önerisi bulunmamaktadır."}
                </p>
              </div>
            </ModernSectionCard>

            {analysisData.consolidationAnalysis && (
              <ModernSectionCard
                title="Konsolidasyon Analizi"
                icon={<Scale className="text-green-600 h-6 w-6" />}
                description="Kredilerinizi birleştirme imkanları"
                gradient="from-green-50 to-emerald-50"
              >
                <div className="bg-gradient-to-br from-green-600 to-emerald-600 text-white p-8 rounded-2xl shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <Building2 className="h-8 w-8" />
                    <div>
                      <h4 className="text-2xl font-bold">
                        Önerilen Banka: {analysisData.consolidationAnalysis.recommendedBank}
                      </h4>
                      <Badge
                        variant={getFeasibilityBadgeVariant(analysisData.consolidationAnalysis.feasibility)}
                        className="mt-2"
                      >
                        {analysisData.consolidationAnalysis.feasibility} Uygulanabilirlik
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-white/15 backdrop-blur-sm rounded-xl">
                      <DollarSign className="h-6 w-6 mx-auto mb-2" />
                      <p className="text-sm opacity-80">Konsolide Tutar</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(analysisData.consolidationAnalysis.consolidatedLoanAmount)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-white/15 backdrop-blur-sm rounded-xl">
                      <Percent className="h-6 w-6 mx-auto mb-2" />
                      <p className="text-sm opacity-80">Önerilen Oran</p>
                      <p className="text-xl font-bold">%{analysisData.consolidationAnalysis.suggestedRate}</p>
                    </div>
                    <div className="text-center p-4 bg-white/15 backdrop-blur-sm rounded-xl">
                      <Calendar className="h-6 w-6 mx-auto mb-2" />
                      <p className="text-sm opacity-80">Yeni Vade</p>
                      <p className="text-xl font-bold">{analysisData.consolidationAnalysis.suggestedTerm} ay</p>
                    </div>
                    <div className="text-center p-4 bg-white/15 backdrop-blur-sm rounded-xl">
                      <TrendingUp className="h-6 w-6 mx-auto mb-2" />
                      <p className="text-sm opacity-80">Toplam Tasarruf</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(analysisData.consolidationAnalysis.totalSavings)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {analysisData.consolidationAnalysis.benefits &&
                      analysisData.consolidationAnalysis.benefits.length > 0 && (
                        <div className="bg-white/10 p-4 rounded-xl">
                          <h6 className="font-bold mb-3 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            Faydalar
                          </h6>
                          <div className="space-y-2">
                            {analysisData.consolidationAnalysis.benefits.map((benefit, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <Star className="h-4 w-4 text-yellow-300" />
                                {benefit}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {analysisData.consolidationAnalysis.risks &&
                      analysisData.consolidationAnalysis.risks.length > 0 && (
                        <div className="bg-white/10 p-4 rounded-xl">
                          <h6 className="font-bold mb-3 flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Dikkat Edilecekler
                          </h6>
                          <div className="space-y-2">
                            {analysisData.consolidationAnalysis.risks.map((risk, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <AlertTriangle className="h-4 w-4 text-orange-300" />
                                {risk}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </ModernSectionCard>
            )}

            <ModernSectionCard
              title="Piyasa Oranları Karşılaştırması"
              icon={<Activity className="text-purple-600 h-6 w-6" />}
              description="Güncel piyasa koşulları analizi"
              gradient="from-purple-50 to-pink-50"
            >
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white p-8 rounded-2xl shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="h-8 w-8" />
                  <h4 className="text-2xl font-bold">2024 Piyasa Oranları</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-white/15 backdrop-blur-sm rounded-xl">
                    <Users className="h-6 w-6 mx-auto mb-2" />
                    <h6 className="font-bold mb-1">İhtiyaç Kredisi</h6>
                    <p className="text-sm opacity-80">Piyasa Ortalaması</p>
                    <p className="text-lg font-bold">%2.8 - %3.2</p>
                  </div>
                  <div className="text-center p-4 bg-white/15 backdrop-blur-sm rounded-xl">
                    <Building2 className="h-6 w-6 mx-auto mb-2" />
                    <h6 className="font-bold mb-1">Konut Kredisi</h6>
                    <p className="text-sm opacity-80">Piyasa Ortalaması</p>
                    <p className="text-lg font-bold">%1.9 - %2.3</p>
                  </div>
                  <div className="text-center p-4 bg-white/15 backdrop-blur-sm rounded-xl">
                    <CreditCard className="h-6 w-6 mx-auto mb-2" />
                    <h6 className="font-bold mb-1">Taşıt Kredisi</h6>
                    <p className="text-sm opacity-80">Piyasa Ortalaması</p>
                    <p className="text-lg font-bold">%2.2 - %2.8</p>
                  </div>
                  <div className="text-center p-4 bg-white/15 backdrop-blur-sm rounded-xl">
                    <Sparkles className="h-6 w-6 mx-auto mb-2" />
                    <h6 className="font-bold mb-1">Ticari Kredi</h6>
                    <p className="text-sm opacity-80">Piyasa Ortalaması</p>
                    <p className="text-lg font-bold">%3.1 - %3.8</p>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-white/10 rounded-xl">
                  <p className="text-sm flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Oranlar güncel piyasa koşullarına göre Gemini AI tarafından analiz edilmiştir. Gerçek oranlar
                    bankalara göre değişiklik gösterebilir.
                  </p>
                </div>
              </div>
            </ModernSectionCard>
          </TabsContent>

          <TabsContent
            value="credits"
            className="p-6 md:p-8 space-y-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800"
          >
            <div className="mb-8 text-center">
              <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                Kredi Bazlı Refinansman Önerileri
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Her krediniz için özel olarak hazırlanmış refinansman seçenekleri ve banka önerileri.
              </p>
            </div>

            {individualAnalysis.length === 0 ? (
              <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <Info className="h-4 w-4" />
                <AlertTitle>Bilgi</AlertTitle>
                <AlertDescription>Henüz kredi bazlı analiz bulunmamaktadır.</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-8">
                {individualAnalysis.map((credit, index) => (
                  <Card key={index} className="border-0 shadow-2xl overflow-hidden bg-white dark:bg-gray-900">
                    <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                            {getPriorityIcon(credit.priority)}
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">
                              {credit.creditType} - {credit.bankName}
                            </CardTitle>
                            <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
                              Mevcut Durum: {formatCurrency(credit.currentSituation?.remainingDebt || 0)} kalan borç
                            </CardDescription>
                          </div>
                        </div>
                        <Badge
                          variant={
                            credit.priority === "Yüksek"
                              ? "destructive"
                              : credit.priority === "Orta"
                                ? "warning"
                                : "secondary"
                          }
                        >
                          {credit.priority} Öncelik
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl">
                        <div className="text-center">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Mevcut Faiz</p>
                          <p className="text-2xl font-bold text-red-600">
                            %{credit.currentSituation?.currentRate || 0}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Aylık Ödeme</p>
                          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                            {formatCurrency(credit.currentSituation?.monthlyPayment || 0)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Kalan Vade</p>
                          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                            {credit.currentSituation?.remainingMonths || 0} ay
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Kalan Borç</p>
                          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                            {formatCurrency(credit.currentSituation?.remainingDebt || 0)}
                          </p>
                        </div>
                      </div>

                      {credit.refinancingOptions && credit.refinancingOptions.length > 0 && (
                        <div className="space-y-6">
                          <h5 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            Refinansman Seçenekleri
                          </h5>
                          {credit.refinancingOptions.map((option: any, optionIndex: number) => (
                            <RefinancingOptionCard key={optionIndex} option={option} creditType={credit.creditType} />
                          ))}
                        </div>
                      )}

                      {credit.netBenefit && (
                        <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 p-6 rounded-xl border border-emerald-200 dark:border-emerald-800">
                          <h6 className="font-bold text-emerald-800 dark:text-emerald-200 mb-3 flex items-center gap-2 text-lg">
                            <PiggyBank className="h-5 w-5" />
                            Net Fayda Analizi
                          </h6>
                          <p className="text-emerald-700 dark:text-emerald-300 leading-relaxed">{credit.netBenefit}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="action-plan"
            className="p-6 md:p-8 space-y-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800"
          >
            <div className="mb-8 text-center">
              <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">Adım Adım Eylem Planı</h3>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Refinansman sürecinizi başarıyla tamamlamak için önerilen adımlar.
              </p>
            </div>

            {!actionPlan ? (
              <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <Info className="h-4 w-4" />
                <AlertTitle>Bilgi</AlertTitle>
                <AlertDescription>Henüz eylem planı bulunmamaktadır.</AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {actionPlan.immediate && actionPlan.immediate.length > 0 && (
                  <ActionPlanCard
                    title="Acil Adımlar"
                    icon={<Zap className="h-6 w-6" />}
                    actions={actionPlan.immediate}
                    color="red"
                  />
                )}

                {actionPlan.shortTerm && actionPlan.shortTerm.length > 0 && (
                  <ActionPlanCard
                    title="Kısa Vadeli Adımlar"
                    icon={<Clock className="h-6 w-6" />}
                    actions={actionPlan.shortTerm}
                    color="orange"
                  />
                )}

                {actionPlan.longTerm && actionPlan.longTerm.length > 0 && (
                  <ActionPlanCard
                    title="Uzun Vadeli Adımlar"
                    icon={<Target className="h-6 w-6" />}
                    actions={actionPlan.longTerm}
                    color="green"
                  />
                )}
              </div>
            )}

            {actionPlan?.expectedOutcome && (
              <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                    <Award className="h-8 w-8" />
                    Beklenen Sonuç
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-lg leading-relaxed text-blue-100">{actionPlan.expectedOutcome}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent
            value="recommendations"
            className="p-6 md:p-8 space-y-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800"
          >
            <div className="mb-8 text-center">
              <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">Alternatif Stratejiler</h3>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Farklı finansal durumlar için alternatif çözüm önerileri.
              </p>
            </div>

            {!analysisData.alternativeStrategies || analysisData.alternativeStrategies.length === 0 ? (
              <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <Info className="h-4 w-4" />
                <AlertTitle>Bilgi</AlertTitle>
                <AlertDescription>Henüz alternatif strateji önerisi bulunmamaktadır.</AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {analysisData.alternativeStrategies.map((strategy, index) => (
                  <Card key={index} className="border-0 shadow-2xl overflow-hidden bg-white dark:bg-gray-900">
                    <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 p-6">
                      <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800 dark:text-gray-100">
                        <Lightbulb className="h-6 w-6 text-purple-600" />
                        {strategy.strategy}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">{strategy.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                          <DollarSign className="h-6 w-6 mx-auto text-emerald-600 mb-2" />
                          <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-1">Beklenen Tasarruf</p>
                          <p className="text-xl font-bold text-emerald-800 dark:text-emerald-200">
                            {formatCurrency(strategy.expectedSavings || 0)}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                          <Banknote className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                          <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Yeni Aylık Ödeme</p>
                          <p className="text-xl font-bold text-blue-800 dark:text-blue-200">
                            {formatCurrency(strategy.newMonthlyPayment || 0)}
                          </p>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl">
                        <h6 className="font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                          <Scale className="h-5 w-5" />
                          Uygunluk Değerlendirmesi
                        </h6>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{strategy.suitability}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refinansman Analizini Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu refinansman analizini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
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
