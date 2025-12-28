"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PaginationModern } from "@/components/ui/pagination-modern"
import { Separator } from "@/components/ui/separator"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Crown,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Star,
  Plus,
  Trash2,
  Receipt,
  ArrowRight,
  Settings as SettingsIcon,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  DollarSign,
  ArrowUpDown,
  Search,
  TrendingUp,
  Zap,
  Shield,
  AlertTriangle,
  Info,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useSubscriptionV2 } from "@/hooks/use-subscription-v2"
import { useToast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/loading-screen"
import { createBrowserClient } from "@supabase/ssr"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface PaymentTransaction {
  id: string
  amount: string
  currency: string
  status: string
  payment_method: string
  created_at: string
  iyzico_payment_id: string | null
}

interface Invoice {
  id: string
  invoice_number: string
  invoice_date: string
  amount: number
  currency: string
  status: string
  file_url: string | null
  file_name: string | null
  payment_date: string | null
  subscription_id: string | null
}

export default function SubscriptionPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const { subscription, loading, isPremium, refresh, cancelSubscription: cancelSubscriptionHook } = useSubscriptionV2()
  const [activeTab, setActiveTab] = useState("overview")
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  // Invoice and payment history states
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [transactionsSortBy, setTransactionsSortBy] = useState("tarih")
  const [transactionsSortOrder, setTransactionsSortOrder] = useState<"asc" | "desc">("desc")
  const [invoicesSortBy, setInvoicesSortBy] = useState("tarih")
  const [invoicesSortOrder, setInvoicesSortOrder] = useState<"asc" | "desc">("desc")
  const [transactionsPage, setTransactionsPage] = useState(1)
  const [invoicesPage, setInvoicesPage] = useState(1)
  const itemsPerPage = 8

  // Subscription ve grace period state'leri
  const [subscriptionData, setSubscriptionData] = useState<any>(null)
  const [pendingPaymentData, setPendingPaymentData] = useState<any>(null)
  const [loadingSubscription, setLoadingSubscription] = useState(true)

  useEffect(() => {
    fetchPaymentData()
    fetchSubscriptionData()
  }, [user])

  // Fetch subscription and pending payment data
  const fetchSubscriptionData = async () => {
    if (!user) {
      setLoadingSubscription(false)
      return
    }

    try {
      // Fetch subscription
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("plan_type", "premium")
        .maybeSingle()

      setSubscriptionData(sub)

      // Fetch pending payment if exists
      if (sub?.requires_payment_action) {
        const response = await fetch("/api/subscription/renewal/get-payment-url")
        const paymentData = await response.json()

        if (paymentData.hasPendingPayment) {
          setPendingPaymentData(paymentData)
        }
      }
    } catch (error) {
      console.error("Error fetching subscription:", error)
    } finally {
      setLoadingSubscription(false)
    }
  }

  const fetchPaymentData = async () => {
    if (!user) {
      setDataLoading(false)
      return
    }

    try {
      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (transactionsError) {
        console.error("[abonelik] Transactions error:", transactionsError)
      } else {
        setTransactions(transactionsData || [])
      }

      // Fetch invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", user.id)
        .order("invoice_date", { ascending: false })

      if (invoicesError) {
        console.error("[abonelik] Invoices error:", invoicesError)
      } else {
        setInvoices(invoicesData || [])
      }
    } catch (error) {
      console.error("[abonelik] Error fetching payment data:", error)
    } finally {
      setDataLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    setIsCancelling(true)
    try {
      const success = await cancelSubscriptionHook()
      if (success) {
        refresh()
      } else {
        // Error toast already shown by the hook
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
      setShowCancelDialog(false)
    }
  }

  const getPlanName = (planId: string) => {
    switch (planId) {
      case "pro-monthly":
        return "Aylık Pro"
      case "pro-yearly":
        return "Yıllık Pro"
      case "premium-monthly":
        return "Aylık Premium"
      case "premium-yearly":
        return "Yıllık Premium"
      case "free":
        return "Ücretsiz Plan"
      default:
        return "Ücretsiz Plan"
    }
  }

  const getPlanPrice = (planId: string) => {
    switch (planId) {
      case "pro-monthly":
        return "199₺/ay"
      case "pro-yearly":
        return "1,910₺/yıl"
      case "premium-monthly":
        return "399₺/ay"
      case "premium-yearly":
        return "3,830₺/yıl"
      case "free":
        return "0₺"
      default:
        return "0₺"
    }
  }

  // Filtered and sorted transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions.filter((transaction) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        transaction.amount.toString().toLowerCase().includes(searchLower) ||
        transaction.currency.toLowerCase().includes(searchLower) ||
        transaction.payment_method.toLowerCase().includes(searchLower) ||
        transaction.status.toLowerCase().includes(searchLower)
      )
    })

    filtered.sort((a, b) => {
      let comparison = 0
      if (transactionsSortBy === "tarih") {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else if (transactionsSortBy === "tutar") {
        comparison = Number.parseFloat(a.amount) - Number.parseFloat(b.amount)
      } else if (transactionsSortBy === "durum") {
        comparison = a.status.localeCompare(b.status)
      }
      return transactionsSortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }, [transactions, searchTerm, transactionsSortBy, transactionsSortOrder])

  // Filtered and sorted invoices
  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = invoices.filter((invoice) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        invoice.invoice_number.toLowerCase().includes(searchLower) ||
        invoice.amount.toString().toLowerCase().includes(searchLower) ||
        invoice.currency.toLowerCase().includes(searchLower) ||
        invoice.status.toLowerCase().includes(searchLower)
      )
    })

    filtered.sort((a, b) => {
      let comparison = 0
      if (invoicesSortBy === "tarih") {
        comparison = new Date(a.invoice_date).getTime() - new Date(b.invoice_date).getTime()
      } else if (invoicesSortBy === "tutar") {
        comparison = a.amount - b.amount
      } else if (invoicesSortBy === "faturaNo") {
        comparison = a.invoice_number.localeCompare(b.invoice_number)
      } else if (invoicesSortBy === "durum") {
        comparison = a.status.localeCompare(b.status)
      }
      return invoicesSortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }, [invoices, searchTerm, invoicesSortBy, invoicesSortOrder])

  // Pagination calculations
  const totalTransactionsPages = Math.ceil(filteredAndSortedTransactions.length / itemsPerPage)
  const startTransactionsIndex = (transactionsPage - 1) * itemsPerPage
  const endTransactionsIndex = startTransactionsIndex + itemsPerPage
  const currentTransactions = filteredAndSortedTransactions.slice(startTransactionsIndex, endTransactionsIndex)

  const totalInvoicesPages = Math.ceil(filteredAndSortedInvoices.length / itemsPerPage)
  const startInvoicesIndex = (invoicesPage - 1) * itemsPerPage
  const endInvoicesIndex = startInvoicesIndex + itemsPerPage
  const currentInvoices = filteredAndSortedInvoices.slice(startInvoicesIndex, endInvoicesIndex)

  const handleTransactionsSort = (column: string) => {
    if (transactionsSortBy === column) {
      setTransactionsSortOrder(transactionsSortOrder === "asc" ? "desc" : "asc")
    } else {
      setTransactionsSortBy(column)
      setTransactionsSortOrder("asc")
    }
  }

  const handleInvoicesSort = (column: string) => {
    if (invoicesSortBy === column) {
      setInvoicesSortOrder(invoicesSortOrder === "asc" ? "desc" : "asc")
    } else {
      setInvoicesSortBy(column)
      setInvoicesSortOrder("asc")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-emerald-600 dark:bg-emerald-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aktif
          </Badge>
        )
      case "canceled":
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            <AlertCircle className="h-3 w-3 mr-1" />
            İptal Edildi
          </Badge>
        )
      case "expired":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <AlertCircle className="h-3 w-3 mr-1" />
            Süresi Doldu
          </Badge>
        )
      case "completed":
      case "paid":
        return (
          <Badge className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-transparent hover:from-emerald-700 hover:to-teal-800 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {status === "completed" ? "Tamamlandı" : "Ödendi"}
          </Badge>
        )
      case "preparing":
        return (
          <Badge className="bg-gradient-to-r from-yellow-600 to-amber-700 text-white border-transparent hover:from-yellow-700 hover:to-amber-800 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Hazırlanıyor
          </Badge>
        )
      case "ready":
        return (
          <Badge className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-transparent hover:from-emerald-700 hover:to-teal-800 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Hazır
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-gradient-to-r from-orange-600 to-amber-700 text-white border-transparent hover:from-orange-700 hover:to-amber-800 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Beklemede
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-gradient-to-r from-red-600 to-rose-700 text-white border-transparent hover:from-red-700 hover:to-rose-800 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Başarısız
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Hero Section - Kredilerim Style */}
      <Card className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 dark:from-emerald-700 dark:via-teal-700 dark:to-emerald-800 text-white border-0 shadow-2xl">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                <Crown className="h-8 w-8" />
                Abonelik Yönetimi
              </h1>
              <p className="text-white/80 text-base md:text-lg mb-4">
                Abonelik bilgilerinizi ve ödeme geçmişinizi buradan yönetebilirsiniz
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-white/70 text-xs sm:text-sm mb-1">Toplam Fatura</p>
                  <p className="text-xl sm:text-2xl font-bold">{invoices.length} Adet</p>
                </div>
                <div>
                  <p className="text-white/70 text-xs sm:text-sm mb-1">Plan</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {subscription?.planId
                      ? subscription.planId.includes("premium")
                        ? "Premium"
                        : subscription.planId.includes("pro")
                          ? "Pro"
                          : "Ücretsiz"
                      : "Ücretsiz"}
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => router.push("/uygulama/premium")}
              className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
              size="lg"
              variant="outline"
            >
              <Crown className="h-5 w-5 mr-2" />
              {isPremium ? "Planı Yönet" : "Premium'a Yükselt"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Status Banners */}
      {!loadingSubscription && subscriptionData && (
        <div className="space-y-4">
          {/* Grace Period Banner */}
          {subscriptionData.grace_period_started_at && subscriptionData.grace_period_ends_at && (
            <>
              {(() => {
                const now = new Date()
                const gracePeriodEnds = new Date(subscriptionData.grace_period_ends_at)
                const daysRemaining = Math.ceil((gracePeriodEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                const hoursRemaining = Math.ceil((gracePeriodEnds.getTime() - now.getTime()) / (1000 * 60 * 60))
                const isLastDay = daysRemaining <= 1

                return (
                  <Alert
                    variant="default"
                    className={
                      isLastDay
                        ? "bg-red-50 border-2 border-red-400 dark:bg-red-950/50 dark:border-red-600 shadow-lg"
                        : "bg-amber-50 border-2 border-amber-400 dark:bg-amber-950/50 dark:border-amber-600 shadow-lg"
                    }
                  >
                    {isLastDay ? (
                      <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    ) : (
                      <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    )}
                    <AlertTitle
                      className={`text-lg ${
                        isLastDay
                          ? "text-red-800 dark:text-red-300 font-bold"
                          : "text-amber-800 dark:text-amber-300 font-bold"
                      }`}
                    >
                      {isLastDay
                        ? `⚠️ ACİL: Premium Erişiminiz ${hoursRemaining} Saat İçinde Kapanacak`
                        : `⏰ Ek Süre Aktif - ${daysRemaining} Gün Kaldı`}
                    </AlertTitle>
                    <AlertDescription
                      className={`text-base mt-2 ${
                        isLastDay ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {isLastDay ? (
                        <>
                          <strong>Son uyarı!</strong> Aboneliğinize verilen ek süre{" "}
                          {new Date(subscriptionData.grace_period_ends_at).toLocaleDateString("tr-TR")}{" "}
                          {new Date(subscriptionData.grace_period_ends_at).toLocaleTimeString("tr-TR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          tarihinde sona erecek. Bu süre sonunda premium özelliklerinize erişiminiz kapanacak ve risk
                          analizi limitleriniz sıfırlanacaktır.
                        </>
                      ) : (
                        <>
                          Aboneliğinizin süresi doldu. Size {7} gün ek süre tanıdık. Ek süre{" "}
                          {new Date(subscriptionData.grace_period_ends_at).toLocaleDateString("tr-TR")} tarihinde sona
                          erecek. Premium özellikleriniz şu an aktif, ancak{" "}
                          <strong>{daysRemaining} gün içinde</strong> aboneliğinizi yenilemezseniz erişiminiz
                          kapanacaktır.
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                )
              })()}
            </>
          )}

          {/* Pending Payment Banner */}
          {subscriptionData.requires_payment_action && pendingPaymentData?.hasPendingPayment && (
            <>
              {(() => {
                const payment = pendingPaymentData.payment
                const hoursLeft = Math.max(0, payment.timeRemaining.hours)
                const isExpiringSoon = hoursLeft <= 24

                return (
                  <Alert
                    variant="default"
                    className={
                      isExpiringSoon
                        ? "bg-orange-50 border-2 border-orange-400 dark:bg-orange-950/50 dark:border-orange-600 shadow-lg"
                        : "bg-blue-50 border-2 border-blue-400 dark:bg-blue-950/50 dark:border-blue-600 shadow-lg"
                    }
                  >
                    {isExpiringSoon ? (
                      <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    ) : (
                      <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    )}
                    <AlertTitle
                      className={`text-lg ${
                        isExpiringSoon
                          ? "text-orange-800 dark:text-orange-300 font-bold"
                          : "text-blue-800 dark:text-blue-300 font-bold"
                      }`}
                    >
                      {isExpiringSoon
                        ? `🔔 Ödeme Linki ${hoursLeft} Saat İçinde Geçersiz Olacak`
                        : "🔔 Abonelik Yenileme Onayı Bekleniyor"}
                    </AlertTitle>
                    <AlertDescription
                      className={`mt-3 ${
                        isExpiringSoon
                          ? "text-orange-700 dark:text-orange-300"
                          : "text-blue-700 dark:text-blue-300"
                      }`}
                    >
                      <div className="flex flex-col gap-3">
                        <p className="text-base">
                          Aboneliğinizi yenilemek için ödeme onayınıza ihtiyacımız var. Ödeme linki{" "}
                          {new Date(payment.expiresAt).toLocaleDateString("tr-TR")}{" "}
                          {new Date(payment.expiresAt).toLocaleTimeString("tr-TR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          tarihine kadar geçerli. <strong>Tutar: {payment.amount.toFixed(2)} {payment.currency}</strong>
                        </p>
                        <Button
                          onClick={() => window.open(payment.paymentUrl, "_blank")}
                          className="w-fit bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
                          size="lg"
                        >
                          <CreditCard className="h-5 w-5 mr-2" />
                          Ödemeyi Tamamla ({hoursLeft} saat kaldı)
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )
              })()}
            </>
          )}

          {/* Suspended Banner */}
          {subscriptionData.status === "suspended" && (
            <Alert variant="default" className="bg-red-50 border-2 border-red-400 dark:bg-red-950/50 dark:border-red-600 shadow-lg">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              <AlertTitle className="text-lg text-red-800 dark:text-red-300 font-bold">
                ⛔ Premium Aboneliğiniz Askıya Alındı
              </AlertTitle>
              <AlertDescription className="text-base text-red-700 dark:text-red-300 mt-3">
                <div className="flex flex-col gap-3">
                  <p>
                    Verilen ek süre içinde ödeme yapılmadığı için premium özelliklerinize erişiminiz kapatıldı.
                    Aboneliğinizi yenileyerek tüm premium özelliklere tekrar erişebilirsiniz.
                  </p>
                  <Button
                    onClick={() => router.push("/uygulama/premium")}
                    className="w-fit bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
                    size="lg"
                  >
                    <Crown className="h-5 w-5 mr-2" />
                    Aboneliği Yenile
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Modern Tabs */}
      <div className="bg-white dark:bg-black/20 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-emerald-900/10">
            <TabsList className="grid grid-cols-3 bg-transparent h-auto p-1 sm:p-2 gap-1 sm:gap-2">
              <TabsTrigger
                value="overview"
                className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900/20 data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/60"
              >
                <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline font-medium">Abonelik Bilgileri</span>
                <span className="sm:hidden font-medium">Genel</span>
              </TabsTrigger>
              <TabsTrigger
                value="invoices"
                className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900/20 data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/60"
              >
                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline font-medium">Faturalar</span>
                <span className="sm:hidden font-medium">Fatura</span>
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900/20 data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/60"
              >
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline font-medium">Ödeme Geçmişi</span>
                <span className="sm:hidden font-medium">Geçmiş</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Content */}
          <div className="p-6 dark:bg-black/20">
            {/* Abonelik Bilgileri Tab */}
            <TabsContent value="overview" className="space-y-4 mt-0">
              {!isPremium ? (
                /* Free Plan - Upgrade Prompt */
                <Card className="dark:bg-black/20">
                  <CardContent className="p-6 text-center">
                    <Crown className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ücretsiz Plan</h2>
                    <p className="text-gray-600 dark:text-white/60 mb-6">
                      Premium'a yükseltin ve tüm özelliklerin kilidini açın
                    </p>
                    <Button
                      onClick={() => router.push("/uygulama/premium")}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                      size="lg"
                    >
                      <Crown className="h-5 w-5 mr-2" />
                      Premium'a Yükselt
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Premium Abonelik Detayları */}
                  <Card className="dark:bg-black/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Crown className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        {subscription?.planId ? getPlanName(subscription.planId) : "Premium"}
                      </CardTitle>
                      <CardDescription>
                        {subscription?.planId ? getPlanPrice(subscription.planId) : ""}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {subscription?.status && (
                          <Badge className="bg-emerald-600 dark:bg-emerald-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {subscription.status === "active" ? "Aktif" : subscription.status === "canceled" ? "İptal Edildi" : "Süresi Doldu"}
                          </Badge>
                        )}
                        {subscription?.expiresAt && subscription.status === "active" && (
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            {Math.ceil((new Date(subscription.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} gün kaldı
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Timeline - Elegant Single Card */}
                  {subscription?.startDate && subscription?.expiresAt && subscription.status === "active" && (
                    <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 overflow-hidden shadow-lg">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                          Abonelik Dönemi
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">
                          {Math.ceil((new Date(subscription.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} gün sonra yenilenecek
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-8 pb-8">
                        {/* Timeline Visualization */}
                        <div className="relative">
                          {/* Progress Bar */}
                          <div className="relative h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="absolute h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-full transition-all duration-1000 shadow-lg"
                              style={{
                                width: `${Math.min(100, ((new Date().getTime() - new Date(subscription.startDate).getTime()) / (new Date(subscription.expiresAt).getTime() - new Date(subscription.startDate).getTime())) * 100)}%`
                              }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                            </div>
                          </div>

                          {/* Timeline Markers */}
                          <div className="relative mt-6">
                            <div className="flex justify-between items-start">
                              {/* Start Marker */}
                              <div className="flex flex-col items-center w-1/3">
                                <div className="relative mb-3">
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg border-4 border-white dark:border-gray-900">
                                    <Calendar className="h-6 w-6 text-white" />
                                  </div>
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-ping"></div>
                                </div>
                                <div className="text-center">
                                  <p className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                                    {new Date(subscription.startDate).toLocaleDateString("tr-TR", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric"
                                    })}
                                  </p>
                                  <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium mt-1">Başlangıç</p>
                                </div>
                              </div>

                      
                              {/* End Marker */}
                              <div className="flex flex-col items-center w-1/3">
                                <div className="relative mb-3">
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg border-4 border-white dark:border-gray-900">
                                    <Clock className="h-6 w-6 text-white" />
                                  </div>
                                </div>
                                <div className="text-center">
                                  <p className="text-lg font-bold text-orange-900 dark:text-orange-100">
                                    {new Date(subscription.expiresAt).toLocaleDateString("tr-TR", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric"
                                    })}
                                  </p>
                                  <p className="text-sm text-orange-700 dark:text-orange-300 font-medium mt-1">Yenileme</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Info Box - Auto Renewal */}
                        <div className="p-4 bg-white-20 dark:bg-white-900/30 rounded-xl border border-gray-700/20 dark:border-emerald-800">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-emerald-500 rounded-lg">
                              <Zap className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                                Otomatik Yenileme Aktif
                              </p>
                              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                                Aboneliğiniz {new Date(subscription.expiresAt).toLocaleDateString("tr-TR")} tarihinde otomatik olarak yenilenecektir
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Premium Feature Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    {/* OCR Analysis Card */}
                    <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 overflow-hidden">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                              {subscription?.usage?.ocrAnalysis?.limit === 999999 ? "∞" : subscription?.usage?.ocrAnalysis?.limit || 1}
                            </h3>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400">Analiz Edilen OCR Kredi Dökümü</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {subscription?.usage?.ocrAnalysis?.used || 0} kullanıldı
                            </p>
                          </div>
                          <FileText className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        {subscription?.usage?.ocrAnalysis?.limit !== 999999 && (
                          <Progress
                            value={((subscription?.usage?.ocrAnalysis?.used || 0) / (subscription?.usage?.ocrAnalysis?.limit || 1)) * 100}
                            className="h-2"
                          />
                        )}
                      </CardContent>
                    </Card>

                    {/* OCR Saved Credits Card - NEW */}
                    <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 overflow-hidden">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                              {subscription?.usage?.ocrAnalysis?.savedCreditsLimit === 999999 ? "∞" : subscription?.usage?.ocrAnalysis?.savedCreditsLimit || 1}
                            </h3>
                            <p className="text-sm text-teal-600 dark:text-teal-400">Kayıt Edilen OCR Kredi Dökümü</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {subscription?.usage?.ocrAnalysis?.savedCredits || 0} kayıt edildi
                            </p>
                          </div>
                          <FileText className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                        </div>
                        {subscription?.usage?.ocrAnalysis?.savedCreditsLimit !== 999999 && (
                          <Progress
                            value={((subscription?.usage?.ocrAnalysis?.savedCredits || 0) / (subscription?.usage?.ocrAnalysis?.savedCreditsLimit || 1)) * 100}
                            className="h-2"
                          />
                        )}
                      </CardContent>
                    </Card>

                    {/* Risk Analysis Card */}
                    <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 overflow-hidden">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                              {subscription?.usage?.riskAnalysis?.limit === 999999 ? "∞" : subscription?.usage?.riskAnalysis?.limit || 0}
                            </h3>
                            <p className="text-sm text-blue-600 dark:text-blue-400">AI Finansal Sağlık Analizi</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {subscription?.usage?.riskAnalysis?.used || 0} kullanıldı
                            </p>
                          </div>
                          <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        {subscription?.usage?.riskAnalysis?.limit !== 999999 && (subscription?.usage?.riskAnalysis?.limit ?? 0) > 0 && (
                          <Progress
                            value={((subscription?.usage?.riskAnalysis?.used || 0) / (subscription?.usage?.riskAnalysis?.limit || 1)) * 100}
                            className="h-2"
                          />
                        )}
                      </CardContent>
                    </Card>

                  </div>

                  {/* Cancellation Warning */}
                  {subscription?.status === "canceled" && (
                    <Card className="border-orange-200 dark:border-orange-800/50 bg-orange-50 dark:bg-orange-950/20">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                              Aboneliğiniz İptal Edildi
                            </h4>
                            <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                              {subscription.expiresAt && (
                                <>
                                  {new Date(subscription.expiresAt).toLocaleDateString("tr-TR")} tarihine kadar
                                  premium özelliklerine erişmeye devam edebilirsiniz.
                                </>
                              )}
                            </p>
                            <Button
                              onClick={() => router.push("/uygulama/premium")}
                              size="sm"
                              className="bg-orange-600 hover:bg-orange-700 text-white"
                            >
                              Aboneliği Yeniden Başlat
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Quick Actions */}
                  {subscription?.status === "active" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      {/* Plan Değiştir Widget */}
                      <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                        <CardContent className="p-6" onClick={() => router.push("/uygulama/premium")}>
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-500 rounded-xl">
                              <SettingsIcon className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Planı Değiştir</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Aylık veya yıllık plana geç</p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                          </div>
                        </CardContent>
                      </Card>

                      {/* İptal Et Widget */}
                      <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                        <CardContent className="p-6" onClick={() => setShowCancelDialog(true)}>
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-500 rounded-xl">
                              <AlertCircle className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Aboneliği İptal Et</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">İstediğiniz zaman iptal edebilirsiniz</p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Faturalar Tab */}
            <TabsContent value="invoices" className="space-y-0">
              <Card className="dark:bg-black/20 dark:border-white/10">
                {/* Search and Sort Header - Kredilerim Style */}
                <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-white dark:bg-black/20">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* LEFT: Search + Sort */}
                    <div className="flex gap-2 flex-1">
                      <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400 dark:text-white/60" />
                        <Input
                          placeholder="Fatura ara..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8 w-full sm:w-[250px] bg-white dark:bg-black/10 border border-gray-200 dark:border-white/10"
                        />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="dark:bg-black/10 dark:border-white/10 dark:text-white flex items-center gap-2">
                            <ArrowUpDown className="h-4 w-4" />
                            <span className="hidden sm:inline">Sırala</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="dark:bg-black/20 dark:border-white/10 backdrop-blur-xl">
                          <DropdownMenuItem onClick={() => handleInvoicesSort("tarih")} className="dark:text-white dark:hover:bg-white/10">
                            Tarihe Göre
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleInvoicesSort("tutar")} className="dark:text-white dark:hover:bg-white/10">
                            Tutara Göre
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleInvoicesSort("faturaNo")} className="dark:text-white dark:hover:bg-white/10">
                            Fatura No'ya Göre
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleInvoicesSort("durum")} className="dark:text-white dark:hover:bg-white/10">
                            Duruma Göre
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
                <CardContent>
                  {dataLoading ? (
                    <p className="text-gray-500 dark:text-white/60 text-center py-8">Yükleniyor...</p>
                  ) : filteredAndSortedInvoices.length === 0 ? (
                    <div className="text-center py-12">
                      <Receipt className="mx-auto h-12 w-12 text-gray-400 dark:text-white/40 mb-4" />
                      <p className="text-gray-500 dark:text-white/60">
                        {searchTerm ? "Arama kriterlerine uygun fatura bulunamadı" : "Henüz fatura bulunmuyor"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-white dark:bg-black/20">
                              <TableHead className="font-semibold text-gray-700 dark:text-white/70 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400" onClick={() => handleInvoicesSort("faturaNo")}>
                                <div className="flex items-center gap-1">
                                  Fatura No
                                  <ArrowUpDown className="h-3 w-3" />
                                </div>
                              </TableHead>
                              <TableHead className="font-semibold text-gray-700 dark:text-white/70 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400" onClick={() => handleInvoicesSort("tarih")}>
                                <div className="flex items-center gap-1">
                                  Tarih
                                  <ArrowUpDown className="h-3 w-3" />
                                </div>
                              </TableHead>
                              <TableHead className="font-semibold text-gray-700 dark:text-white/70 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400" onClick={() => handleInvoicesSort("tutar")}>
                                <div className="flex items-center gap-1">
                                  Tutar
                                  <ArrowUpDown className="h-3 w-3" />
                                </div>
                              </TableHead>
                              <TableHead className="font-semibold text-gray-700 dark:text-white/70 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400" onClick={() => handleInvoicesSort("durum")}>
                                <div className="flex items-center gap-1">
                                  Durum
                                  <ArrowUpDown className="h-3 w-3" />
                                </div>
                              </TableHead>
                              <TableHead className="text-right font-semibold text-gray-700 dark:text-white/70">İşlemler</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentInvoices.map((invoice, index) => (
                              <TableRow
                                key={invoice.id}
                                className={`hover:bg-emerald-50 dark:hover:bg-white/10 transition-colors ${
                                  index % 2 === 0 ? "bg-white dark:bg-black/20" : "bg-gray-50/50 dark:bg-black/10"
                                }`}
                              >
                                <TableCell className="font-mono font-semibold text-gray-900 dark:text-white">
                                  <div className="flex items-center gap-2">
                                    <Receipt className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    {invoice.invoice_number}
                                  </div>
                                </TableCell>
                                <TableCell className="text-gray-900 dark:text-white">
                                  {new Date(invoice.invoice_date).toLocaleDateString("tr-TR", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </TableCell>
                                <TableCell className="font-semibold text-gray-900 dark:text-white">
                                  {Number(invoice.amount).toFixed(2)} {invoice.currency}
                                </TableCell>
                                <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                                <TableCell className="text-right">
                                  {invoice.file_url ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(invoice.file_url!, "_blank")}
                                      className="dark:bg-black/20 dark:text-white dark:border-white/10 dark:hover:bg-white/10"
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      PDF İndir
                                    </Button>
                                  ) : (
                                    <Button variant="ghost" size="sm" disabled className="dark:text-white/60">
                                      <Clock className="h-4 w-4 mr-2" />
                                      Hazırlanıyor
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {filteredAndSortedInvoices.length > itemsPerPage && (
                        <PaginationModern
                          currentPage={invoicesPage}
                          totalPages={totalInvoicesPages}
                          totalItems={filteredAndSortedInvoices.length}
                          itemsPerPage={itemsPerPage}
                          onPageChange={setInvoicesPage}
                          itemName="fatura"
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Ödeme Geçmişi Tab */}
            <TabsContent value="history" className="space-y-0">
              <Card className="dark:bg-black/20 dark:border-white/10">
                {/* Search and Sort Header - Kredilerim Style */}
                <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-white dark:bg-black/20">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* LEFT: Search + Sort */}
                    <div className="flex gap-2 flex-1">
                      <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400 dark:text-white/60" />
                        <Input
                          placeholder="Ödeme ara..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8 w-full sm:w-[250px] bg-white dark:bg-black/10 border border-gray-200 dark:border-white/10"
                        />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="dark:bg-black/10 dark:border-white/10 dark:text-white flex items-center gap-2">
                            <ArrowUpDown className="h-4 w-4" />
                            <span className="hidden sm:inline">Sırala</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="dark:bg-black/20 dark:border-white/10 backdrop-blur-xl">
                          <DropdownMenuItem onClick={() => handleTransactionsSort("tarih")} className="dark:text-white dark:hover:bg-white/10">
                            Tarihe Göre
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTransactionsSort("tutar")} className="dark:text-white dark:hover:bg-white/10">
                            Tutara Göre
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTransactionsSort("durum")} className="dark:text-white dark:hover:bg-white/10">
                            Duruma Göre
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
                <CardContent>
                  {dataLoading ? (
                    <p className="text-gray-500 dark:text-white/60 text-center py-8">Yükleniyor...</p>
                  ) : filteredAndSortedTransactions.length === 0 ? (
                    <div className="text-center py-12">
                      <DollarSign className="mx-auto h-12 w-12 text-gray-400 dark:text-white/40 mb-4" />
                      <p className="text-gray-500 dark:text-white/60">
                        {searchTerm ? "Arama kriterlerine uygun ödeme bulunamadı" : "Henüz ödeme kaydı bulunmuyor"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-white dark:bg-black/20">
                              <TableHead className="font-semibold text-gray-700 dark:text-white/70 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400" onClick={() => handleTransactionsSort("tarih")}>
                                <div className="flex items-center gap-1">
                                  Tarih
                                  <ArrowUpDown className="h-3 w-3" />
                                </div>
                              </TableHead>
                              <TableHead className="font-semibold text-gray-700 dark:text-white/70 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400" onClick={() => handleTransactionsSort("tutar")}>
                                <div className="flex items-center gap-1">
                                  Tutar
                                  <ArrowUpDown className="h-3 w-3" />
                                </div>
                              </TableHead>
                              <TableHead className="font-semibold text-gray-700 dark:text-white/70">Ödeme Yöntemi</TableHead>
                              <TableHead className="font-semibold text-gray-700 dark:text-white/70 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400" onClick={() => handleTransactionsSort("durum")}>
                                <div className="flex items-center gap-1">
                                  Durum
                                  <ArrowUpDown className="h-3 w-3" />
                                </div>
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentTransactions.map((transaction, index) => (
                              <TableRow
                                key={transaction.id}
                                className={`hover:bg-emerald-50 dark:hover:bg-white/10 transition-colors ${
                                  index % 2 === 0 ? "bg-white dark:bg-black/20" : "bg-gray-50/50 dark:bg-black/10"
                                }`}
                              >
                                <TableCell className="text-gray-900 dark:text-white">
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                    {new Date(transaction.created_at).toLocaleDateString("tr-TR", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                  </div>
                                </TableCell>
                                <TableCell className="font-semibold text-gray-900 dark:text-white">
                                  {Number.parseFloat(transaction.amount).toFixed(2)} {transaction.currency}
                                </TableCell>
                                <TableCell className="text-gray-600 dark:text-white/70">
                                  <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    {transaction.payment_method === "credit_card" ? "Kredi Kartı" : transaction.payment_method}
                                  </div>
                                </TableCell>
                                <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {filteredAndSortedTransactions.length > itemsPerPage && (
                        <PaginationModern
                          currentPage={transactionsPage}
                          totalPages={totalTransactionsPages}
                          totalItems={filteredAndSortedTransactions.length}
                          itemsPerPage={itemsPerPage}
                          onPageChange={setTransactionsPage}
                          itemName="ödeme"
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aboneliği İptal Et</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Aboneliğinizi iptal etmek istediğinize emin misiniz?</p>
              {subscription?.expiresAt && (
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(subscription.expiresAt).toLocaleDateString("tr-TR")} tarihine kadar premium özelliklerine
                  erişmeye devam edebileceksiniz.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCancelling ? "İptal Ediliyor..." : "Aboneliği İptal Et"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}