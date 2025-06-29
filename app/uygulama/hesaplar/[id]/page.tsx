"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
  MoreHorizontal,
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
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
        <Button
          onClick={() => router.push("/uygulama/hesaplar")}
          className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Hesaplara Dön
        </Button>
      </div>
    )
  }

  const overdraftUsage = account.overdraft_limit > 0 ? Math.max(0, -account.current_balance) : 0
  const overdraftUsagePercentage = account.overdraft_limit > 0 ? (overdraftUsage / account.overdraft_limit) * 100 : 0

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/uygulama/hesaplar")}
        className="self-start hover:bg-gray-100"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Hesaplara Dön
      </Button>

      {/* Hero Section */}
      <Card
        className={`bg-gradient-to-r ${getAccountTypeColor(account.account_type)} text-white border-transparent shadow-xl rounded-xl`}
      >
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex items-center gap-3">
                <BankLogo bankName={account.banks?.name || ""} size="lg" className="bg-white/20 p-2 rounded-lg" />
                <div className="bg-white/20 p-3 rounded-lg">{getAccountTypeIcon(account.account_type)}</div>
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">{account.account_name}</h1>
                <p className="opacity-90 text-lg mb-4">{account.banks?.name}</p>
                <div className="flex items-center gap-4 text-sm opacity-90">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(account.created_at), "dd MMMM yyyy", { locale: tr })}
                  </span>
                  <Badge className="bg-white/20 text-white border-white/30">
                    {getStatusIcon(account.is_active)}
                    <span className="ml-1">{account.is_active ? "Aktif" : "Pasif"}</span>
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="lg" className="bg-white/20 text-white hover:bg-white/30 border-white/30">
                    <MoreHorizontal className="h-5 w-5 mr-2" />
                    İşlemler
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setBalanceUpdateDialogOpen(true)}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Bakiye Güncelle
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(`/uygulama/hesaplar/${account.id}/duzenle`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Düzenle
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600" onClick={handleDeleteAccount}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Sil
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm opacity-80">Mevcut Bakiye</p>
              <p className="text-2xl font-bold">
                {formatCurrency(account.current_balance)} {account.currency}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm opacity-80">Faiz Oranı</p>
              <p className="text-2xl font-bold">%{formatNumber(account.interest_rate)}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm opacity-80">Kredili Mevduat</p>
              <p className="text-2xl font-bold">
                {formatCurrency(account.overdraft_limit)} {account.currency}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm opacity-80">Kullanılabilir</p>
              <p className="text-2xl font-bold">
                {formatCurrency(account.current_balance + account.overdraft_limit)} {account.currency}
              </p>
            </div>
          </div>

          {/* Overdraft Usage Progress */}
          {account.overdraft_limit > 0 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm opacity-80">Kredili Mevduat Kullanımı</span>
                <span className="text-sm font-medium">
                  {formatCurrency(overdraftUsage)} / {formatCurrency(account.overdraft_limit)} {account.currency}
                </span>
              </div>
              <Progress value={overdraftUsagePercentage} className="h-2 bg-white/20" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="genel" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-white border border-gray-200 rounded-xl p-1">
          <TabsTrigger value="genel" className="rounded-lg">
            Genel
          </TabsTrigger>
          <TabsTrigger value="hareketler" className="rounded-lg">
            Hareketler
          </TabsTrigger>
          <TabsTrigger value="gecmis" className="rounded-lg">
            Geçmiş
          </TabsTrigger>
          <TabsTrigger value="grafikler" className="rounded-lg">
            Grafikler
          </TabsTrigger>
          <TabsTrigger value="ayarlar" className="rounded-lg">
            Ayarlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="genel" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Account Details */}
            <Card className="shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Hesap Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Hesap Türü</p>
                    <p className="font-medium capitalize">{account.account_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Para Birimi</p>
                    <p className="font-medium">{account.currency}</p>
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
                    <p className="font-medium">{account.iban || "Belirtilmemiş"}</p>
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

            {/* Quick Actions */}
            <Card className="shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  Hızlı İşlemler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white"
                  onClick={() => setBalanceUpdateDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Bakiye Güncelle
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start hover:bg-blue-50 hover:text-blue-600 bg-transparent"
                  onClick={() => router.push(`/uygulama/hesaplar/${account.id}/duzenle`)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Hesap Bilgilerini Düzenle
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start hover:bg-orange-50 hover:text-orange-600 bg-transparent"
                >
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Havale/EFT Yap
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start hover:bg-purple-50 hover:text-purple-600 bg-transparent"
                >
                  <ArrowDownRight className="mr-2 h-4 w-4" />
                  Para Yatır
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hareketler" className="space-y-6">
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle>Hesap Hareketleri</CardTitle>
              <CardDescription>Son işlemlerinizi buradan takip edebilirsiniz.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Wallet className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Henüz hareket yok</h3>
                <p className="mt-1 text-sm text-gray-500">Hesap hareketleriniz burada görünecek.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gecmis" className="space-y-6">
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle>İşlem Geçmişi</CardTitle>
              <CardDescription>Tüm işlem geçmişinizi buradan inceleyebilirsiniz.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Geçmiş kayıt yok</h3>
                <p className="mt-1 text-sm text-gray-500">İşlem geçmişiniz burada görünecek.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grafikler" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle>Bakiye Trendi</CardTitle>
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

            <Card className="shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle>İşlem Dağılımı</CardTitle>
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
        </TabsContent>

        <TabsContent value="ayarlar" className="space-y-6">
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-600" />
                Hesap Ayarları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Bildirimler</h4>
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
                  <h4 className="font-medium">Hesap Numarası Gizliliği</h4>
                  <p className="text-sm text-gray-500">Hesap numarasını gizli göster</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAccountNumber(!showAccountNumber)}
                  className="text-blue-600 border-blue-600"
                >
                  {showAccountNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
