"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Wallet,
  ArrowLeft,
  MoreVertical,
  Edit,
  Trash2,
  DollarSign,
  TrendingUp,
  Calendar,
  Building2,
  CreditCard,
  PiggyBank,
  AlertCircle,
  CheckCircle,
  Clock,
  Banknote,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  Bell,
  BellOff,
  Loader2,
  Eye,
  EyeOff,
  FileText,
  History,
  BarChart3,
  Target,
  ChevronDown,
  Download,
  Phone,
  Mail,
  MapPin,
} from "lucide-react"

import { useAuth } from "@/hooks/use-auth"
import { getAccount, updateAccount, deleteAccount, type Account } from "@/lib/api/accounts"
import { formatCurrency, formatNumber } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import BankLogo from "@/components/bank-logo"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const getAccountTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "vadesiz":
      return <Wallet className="h-5 w-5" />
    case "vadeli":
      return <Clock className="h-5 w-5" />
    case "yatirim":
      return <TrendingUp className="h-5 w-5" />
    case "tasarruf":
      return <PiggyBank className="h-5 w-5" />
    default:
      return <Banknote className="h-5 w-5" />
  }
}

const getAccountTypeColor = (type: string): string => {
  switch (type.toLowerCase()) {
    case "vadesiz":
      return "from-blue-600 to-indigo-700"
    case "vadeli":
      return "from-green-600 to-emerald-700"
    case "yatirim":
      return "from-purple-600 to-violet-700"
    case "tasarruf":
      return "from-orange-600 to-amber-700"
    default:
      return "from-gray-600 to-slate-700"
  }
}

const getStatusIcon = (isActive: boolean) => {
  return isActive ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />
}

// Mock data for charts
const balanceHistory = [
  { date: "01.01", balance: 15000 },
  { date: "01.02", balance: 18000 },
  { date: "01.03", balance: 16500 },
  { date: "01.04", balance: 22000 },
  { date: "01.05", balance: 25000 },
  { date: "01.06", balance: 23500 },
]

const transactionCategories = [
  { name: "Gelen Havale", value: 45, color: "#10b981" },
  { name: "Giden Havale", value: 30, color: "#ef4444" },
  { name: "ATM", value: 15, color: "#f59e0b" },
  { name: "POS", value: 10, color: "#8b5cf6" },
]

export default function HesapDetayPage() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const accountId = params.id as string

  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [balanceUpdateDialogOpen, setBalanceUpdateDialogOpen] = useState(false)
  const [newBalance, setNewBalance] = useState("")
  const [balanceNote, setBalanceNote] = useState("")
  const [isUpdatingBalance, setIsUpdatingBalance] = useState(false)

  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [showAccountNumber, setShowAccountNumber] = useState(false)
  const [activeTab, setActiveTab] = useState("genel")

  useEffect(() => {
    if (accountId) {
      fetchAccount()
    }
  }, [accountId])

  const fetchAccount = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAccount(accountId)
      setAccount(data)
      setNewBalance(data?.current_balance?.toString() || "0")
    } catch (err: any) {
      console.error("Hesap yüklenirken hata:", err)
      setError("Hesap bilgileri yüklenirken bir sorun oluştu.")
    } finally {
      setLoading(false)
    }
  }

  const handleBalanceUpdate = async () => {
    if (!account || !newBalance) return

    setIsUpdatingBalance(true)
    try {
      const updatedAccount = await updateAccount(account.id, {
        current_balance: Number.parseFloat(newBalance),
        last_balance_update: new Date().toISOString(),
        notes: balanceNote || account.notes,
      })
      setAccount(updatedAccount)
      setBalanceUpdateDialogOpen(false)
      setBalanceNote("")
      toast({ title: "Başarılı", description: "Hesap bakiyesi güncellendi." })
    } catch (err: any) {
      console.error("Bakiye güncelleme hatası:", err)
      toast({ title: "Hata", description: "Bakiye güncellenirken bir sorun oluştu.", variant: "destructive" })
    } finally {
      setIsUpdatingBalance(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!account) return

    try {
      await deleteAccount(account.id)
      toast({ title: "Başarılı", description: "Hesap başarıyla silindi." })
      router.push("/uygulama/hesaplar")
    } catch (err: any) {
      console.error("Hesap silme hatası:", err)
      toast({ title: "Hata", description: "Hesap silinirken bir sorun oluştu.", variant: "destructive" })
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex flex-col gap-4 md:gap-6 items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
        <p className="text-lg text-gray-600">Hesap detayları yükleniyor...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg text-red-600">Bu sayfayı görüntülemek için lütfen giriş yapın.</p>
        <Button
          onClick={() => router.push("/giris")}
          className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white"
        >
          Giriş Yap
        </Button>
      </div>
    )
  }

  if (error || !account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg text-red-600">{error || "Hesap bulunamadı."}</p>
        <Button onClick={() => router.back()} className="mt-4">
          Geri Dön
        </Button>
      </div>
    )
  }

  const overdraftUsage = account.overdraft_limit > 0 ? Math.max(0, -account.current_balance) : 0
  const overdraftUsagePercentage = account.overdraft_limit > 0 ? (overdraftUsage / account.overdraft_limit) * 100 : 0

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.back()}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-4">
                <BankLogo
                  bankName={account.banks?.name || "Bilinmeyen Banka"}
                  size="lg"
                  className="bg-white/20 border-2 border-white"
                />
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">Hesap Detayı</h1>
                  <p className="text-teal-100 text-lg">
                    {account.account_name} - {account.banks?.name || "N/A"}
                  </p>
                  <p className="text-teal-200 text-sm capitalize">{account.account_type}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="lg"
                    className="bg-white text-white-800 hover:bg-gray-100 hover:text-white-900 font-semibold shadow-lg border border-white/20 backdrop-blur-sm gap-2"
                  >
                    <MoreVertical className="h-4 w-4" />
                    İşlemler
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setBalanceUpdateDialogOpen(true)} className="gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    Bakiye Güncelle
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push(`/uygulama/hesaplar/${account.id}/duzenle`)}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4 text-blue-600" />
                    Düzenle
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600 gap-2" onClick={handleDeleteAccount}>
                    <Trash2 className="h-4 w-4" />
                    Sil
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Hesap Bilgileri Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <p className="text-teal-100 text-sm mb-1">Mevcut Bakiye</p>
              <p className="text-2xl md:text-3xl font-bold">
                {formatCurrency(account.current_balance)} {account.currency}
              </p>
            </div>
            <div className="text-center">
              <p className="text-teal-100 text-sm mb-1">Faiz Oranı</p>
              <p className="text-2xl md:text-3xl font-bold">%{formatNumber(account.interest_rate)}</p>
            </div>
            <div className="text-center">
              <p className="text-teal-100 text-sm mb-1">Kredili Mevduat</p>
              <p className="text-2xl md:text-3xl font-bold">
                {formatCurrency(account.overdraft_limit)} {account.currency}
              </p>
            </div>
            <div className="text-center">
              <p className="text-teal-100 text-sm mb-1">Kullanılabilir</p>
              <p className="text-2xl md:text-3xl font-bold">
                {formatCurrency(account.current_balance + account.overdraft_limit)} {account.currency}
              </p>
            </div>
          </div>

          {/* Overdraft Usage Progress */}
          {account.overdraft_limit > 0 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Kredili Mevduat Kullanımı</span>
                <span className="text-sm font-bold">
                  {formatCurrency(overdraftUsage)} / {formatCurrency(account.overdraft_limit)} {account.currency}
                </span>
              </div>
              <Progress value={overdraftUsagePercentage} className="h-3 bg-white/20" />
              <p className="text-xs text-teal-100 mt-1">{overdraftUsagePercentage.toFixed(1)}% kullanıldı</p>
            </div>
          )}

          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Badge className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-transparent hover:from-emerald-700 hover:to-teal-800 px-4 py-2 text-sm font-semibold shadow-lg">
              <CheckCircle className="mr-2 h-4 w-4" />
              {account.is_active ? "Aktif" : "Pasif"}
            </Badge>
            <div className="text-right">
              <p className="text-teal-100 text-sm">
                Açılış: {format(new Date(account.created_at), "dd MMMM yyyy", { locale: tr })}
              </p>
              <p className="text-teal-100 text-sm">
                Son Güncelleme:{" "}
                {account.last_balance_update
                  ? format(new Date(account.last_balance_update), "dd MMMM yyyy", { locale: tr })
                  : "Henüz güncellenmedi"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-gray-100 bg-gray-100">
            <TabsList className="grid grid-cols-5 bg-transparent h-auto p-2 gap-2">
              <TabsTrigger
                value="genel"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Genel Bilgiler</span>
                <span className="sm:hidden font-medium">Genel</span>
              </TabsTrigger>
              <TabsTrigger
                value="hareketler"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Hareketler</span>
                <span className="sm:hidden font-medium">Hareket</span>
              </TabsTrigger>
              <TabsTrigger
                value="gecmis"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">İşlem Geçmişi</span>
                <span className="sm:hidden font-medium">Geçmiş</span>
              </TabsTrigger>
              <TabsTrigger
                value="grafikler"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Grafikler</span>
                <span className="sm:hidden font-medium">Grafik</span>
              </TabsTrigger>
              <TabsTrigger
                value="ayarlar"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Ayarlar</span>
                <span className="sm:hidden font-medium">Ayar</span>
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="p-6">
            {/* Genel Bilgiler Tab */}
            {activeTab === "genel" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="shadow-sm border-gray-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-900">
                        <Building2 className="h-5 w-5 text-teal-600" />
                        Hesap Bilgileri
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Hesap Adı</p>
                          <p className="font-medium text-gray-900">{account.account_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Hesap Türü</p>
                          <p className="font-medium text-gray-900 capitalize">{account.account_type}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Para Birimi</p>
                          <p className="font-medium text-gray-900">{account.currency}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Durum</p>
                          <Badge className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-transparent hover:from-emerald-700 hover:to-teal-800">
                            {account.is_active ? "Aktif" : "Pasif"}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Hesap No</p>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {showAccountNumber ? account.account_number || "Belirtilmemiş" : "••••••••••••"}
                            </p>
                            <Button variant="ghost" size="sm" onClick={() => setShowAccountNumber(!showAccountNumber)}>
                              {showAccountNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">IBAN</p>
                          <p className="font-medium text-gray-900">{account.iban || "Belirtilmemiş"}</p>
                        </div>
                      </div>
                      {account.notes && (
                        <div>
                          <p className="text-sm text-gray-500">Notlar</p>
                          <p className="text-sm bg-gray-50 p-3 rounded-lg">{account.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm border-gray-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-900">
                        <Building2 className="h-5 w-5 text-teal-600" />
                        Banka Bilgileri
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4 mb-4">
                        <BankLogo bankName={account.banks?.name || "Bilinmeyen Banka"} size="md" />
                        <div>
                          <p className="font-semibold text-gray-900">{account.banks?.name || "N/A"}</p>
                          <p className="text-sm text-gray-500">Banka</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{account.banks?.contact_phone || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{account.banks?.contact_email || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{account.banks?.website || "N/A"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Özet İstatistikler */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-blue-500 border-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg">
                          <Wallet className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm text-blue-100">Mevcut Bakiye</p>
                          <p className="text-xl font-bold text-white">{formatCurrency(account.current_balance)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-emerald-500 border-emerald-500">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg">
                          <TrendingUp className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-sm text-emerald-100">Faiz Oranı</p>
                          <p className="text-xl font-bold text-white">%{formatNumber(account.interest_rate)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-orange-500 border-orange-500">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg">
                          <CreditCard className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-sm text-orange-100">Kredili Mevduat</p>
                          <p className="text-xl font-bold text-white">{formatCurrency(account.overdraft_limit)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-500 border-purple-500">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg">
                          <Target className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <p className="text-sm text-purple-100">Kullanılabilir</p>
                          <p className="text-xl font-bold text-white">
                            {formatCurrency(account.current_balance + account.overdraft_limit)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Hareketler Tab */}
            {activeTab === "hareketler" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Hesap Hareketleri</h3>
                    <p className="text-sm text-gray-600">Son işlemlerinizi buradan takip edebilirsiniz.</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2 w-fit bg-transparent">
                    <Download className="h-4 w-4" />
                    Hareketleri İndir
                  </Button>
                </div>

                <div className="text-center py-12 text-gray-500">
                  <Wallet className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="font-medium text-gray-900 mb-2">Henüz Hareket Yok</h3>
                  <p className="text-sm">Hesap hareketleriniz burada görünecek</p>
                </div>
              </div>
            )}

            {/* Geçmiş Tab */}
            {activeTab === "gecmis" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">İşlem Geçmişi</h3>
                    <p className="text-sm text-gray-600">Tüm işlem geçmişinizi buradan inceleyebilirsiniz.</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2 w-fit bg-transparent">
                    <Download className="h-4 w-4" />
                    Geçmişi İndir
                  </Button>
                </div>

                <div className="text-center py-12 text-gray-500">
                  <History className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="font-medium text-gray-900 mb-2">İşlem Geçmişi Bulunamadı</h3>
                  <p className="text-sm">İşlem geçmişiniz burada görünecek</p>
                </div>
              </div>
            )}

            {/* Grafikler Tab */}
            {activeTab === "grafikler" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="shadow-sm border-gray-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-900">
                        <TrendingUp className="h-5 w-5 text-teal-600" />
                        Bakiye Trendi
                      </CardTitle>
                      <CardDescription>Son 6 ayın bakiye değişimi</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={balanceHistory}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip formatter={(value) => [formatCurrency(value as number), "Bakiye"]} />
                          <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm border-gray-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-900">
                        <BarChart3 className="h-5 w-5 text-teal-600" />
                        İşlem Dağılımı
                      </CardTitle>
                      <CardDescription>İşlem türlerine göre dağılım</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={transactionCategories}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {transactionCategories.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Ayarlar Tab */}
            {activeTab === "ayarlar" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="shadow-sm border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-gray-900">Bildirim Ayarları</CardTitle>
                      <CardDescription>Bu hesap için bildirim tercihleriniz</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Hesap Hareketleri</p>
                          <p className="text-sm text-gray-500">Hesap hareketleri için bildirim al</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                          className={notificationsEnabled ? "text-green-600 border-green-600" : "text-gray-600"}
                        >
                          {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Bakiye Değişiklikleri</p>
                          <p className="text-sm text-gray-500">Bakiye değiştiğinde bildirim al</p>
                        </div>
                        <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 bg-transparent">
                          <Bell className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Aylık Rapor</p>
                          <p className="text-sm text-gray-500">Aylık hesap raporu gönder</p>
                        </div>
                        <Button variant="outline" size="sm" className="text-gray-600 bg-transparent">
                          <BellOff className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-gray-900">Hızlı İşlemler</CardTitle>
                      <CardDescription>Bu hesap için yapabileceğiniz işlemler</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        className="w-full justify-start bg-teal-500 hover:bg-teal-600"
                        onClick={() => setBalanceUpdateDialogOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Bakiye Güncelle
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start bg-transparent"
                        onClick={() => router.push(`/uygulama/hesaplar/${account.id}/duzenle`)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Hesap Bilgilerini Düzenle
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        Havale/EFT Yap
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <ArrowDownRight className="mr-2 h-4 w-4" />
                        Para Yatır
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <Download className="mr-2 h-4 w-4" />
                        Hesap Ekstresini İndir
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </Tabs>
      </div>

      {/* Balance Update Dialog */}
      <Dialog open={balanceUpdateDialogOpen} onOpenChange={setBalanceUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bakiye Güncelle</DialogTitle>
            <DialogDescription>Hesap bakiyenizi güncelleyin. Bu işlem sadece takip amaçlıdır.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newBalance">Yeni Bakiye</Label>
              <Input
                id="newBalance"
                type="number"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="balanceNote">Not (İsteğe bağlı)</Label>
              <Textarea
                id="balanceNote"
                value={balanceNote}
                onChange={(e) => setBalanceNote(e.target.value)}
                placeholder="Bakiye güncelleme nedeni..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceUpdateDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleBalanceUpdate} disabled={isUpdatingBalance}>
              {isUpdatingBalance ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Güncelleniyor...
                </>
              ) : (
                "Güncelle"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
