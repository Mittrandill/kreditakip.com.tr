"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Wallet,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Building2,
  DollarSign,
  TrendingUp,
  ArrowUpDown,
  List,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  PiggyBank,
  Banknote,
  Shield,
  Eye,
} from "lucide-react"
import { BsFillGrid3X3GapFill } from "react-icons/bs"

import { useAuth } from "@/hooks/use-auth"
import { getAccounts, deleteAccount, type Account } from "@/lib/api/accounts"
import { formatCurrency, formatNumber } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow, format } from "date-fns"
import { tr } from "date-fns/locale"
import BankLogo from "@/components/bank-logo"
import { MetricCard } from "@/components/metric-card"

const getAccountTypeBadgeClass = (type: string): string => {
  switch (type.toLowerCase()) {
    case "vadesiz":
      return "bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-transparent hover:from-blue-700 hover:to-indigo-800"
    case "vadeli":
      return "bg-gradient-to-r from-green-600 to-emerald-700 text-white border-transparent hover:from-green-700 hover:to-emerald-800"
    case "yatirim":
      return "bg-gradient-to-r from-purple-600 to-violet-700 text-white border-transparent hover:from-purple-700 hover:to-violet-800"
    case "tasarruf":
      return "bg-gradient-to-r from-orange-600 to-amber-700 text-white border-transparent hover:from-orange-700 hover:to-amber-800"
    default:
      return "bg-gradient-to-r from-gray-600 to-slate-700 text-white border-transparent hover:from-gray-700 hover:to-slate-800"
  }
}

const getAccountTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "vadesiz":
      return <Wallet className="h-4 w-4" />
    case "vadeli":
      return <Clock className="h-4 w-4" />
    case "yatirim":
      return <TrendingUp className="h-4 w-4" />
    case "tasarruf":
      return <PiggyBank className="h-4 w-4" />
    default:
      return <Banknote className="h-4 w-4" />
  }
}

const getStatusBadgeClass = (status: string): string => {
  switch (status.toLowerCase()) {
    case "aktif":
      return "bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-transparent hover:from-emerald-700 hover:to-teal-800"
    case "pasif":
      return "bg-gradient-to-r from-gray-600 to-slate-700 text-white border-transparent hover:from-gray-700 hover:to-slate-800"
    case "dondurulmus":
      return "bg-gradient-to-r from-red-600 to-rose-700 text-white border-transparent hover:from-red-700 hover:to-rose-800"
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
    case "dondurulmus":
      return <AlertCircle className="h-4 w-4" />
    default:
      return <Shield className="h-4 w-4" />
  }
}

export default function HesaplarPage() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const userId = user?.id

  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [activeTab, setActiveTab] = useState("tumHesaplar")
  const [viewMode, setViewMode] = useState("cards")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPageCards = 8
  const itemsPerPageTable = 8

  useEffect(() => {
    if (userId) {
      fetchAccounts()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [userId, authLoading])

  const fetchAccounts = async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const data = await getAccounts(userId)
      setAccounts(data || [])
    } catch (err: any) {
      console.error("Hesaplar yüklenirken hata:", err)
      setError("Hesaplar yüklenirken bir sorun oluştu.")
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedAccounts = accounts
    .filter((a) => {
      if (activeTab === "vadesizHesaplar" && a.account_type !== "vadesiz") return false
      if (activeTab === "vadeliHesaplar" && a.account_type !== "vadeli") return false
      if (activeTab === "yatirimHesaplari" && a.account_type !== "yatirim") return false
      if (activeTab === "tasarrufHesaplari" && a.account_type !== "tasarruf") return false

      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase()
        const bankName = a.banks?.name || ""
        if (
          !a.account_name.toLowerCase().includes(lowerSearchTerm) &&
          !bankName.toLowerCase().includes(lowerSearchTerm) &&
          !a.account_type.toLowerCase().includes(lowerSearchTerm)
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
      } else if (sortBy === "balance") {
        comparison = (a.current_balance || 0) - (b.current_balance || 0)
      } else if (sortBy === "account_name") {
        comparison = a.account_name.localeCompare(b.account_name, "tr")
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

  const currentItemsPerPage = viewMode === "cards" ? itemsPerPageCards : itemsPerPageTable
  const totalItems = filteredAndSortedAccounts.length
  const totalPages = Math.ceil(totalItems / currentItemsPerPage)
  const startIndex = (currentPage - 1) * currentItemsPerPage
  const endIndex = startIndex + currentItemsPerPage
  const currentAccounts = filteredAndSortedAccounts.slice(startIndex, endIndex)

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
    router.push("/uygulama/hesaplar/ekle")
  }

  const openDetailPage = (account: Account) => {
    router.push(`/uygulama/hesaplar/${account.id}`)
  }

  const openEditDialog = (account: Account) => {
    router.push(`/uygulama/hesaplar/${account.id}/duzenle`)
  }

  const handleDeleteAccount = async () => {
    if (!accountToDelete) return

    setIsDeleting(true)
    try {
      await deleteAccount(accountToDelete.id)
      setAccounts((prev) => prev.filter((a) => a.id !== accountToDelete.id))
      toast({ title: "Başarılı", description: "Hesap başarıyla silindi." })
    } catch (err: any) {
      console.error("Hesap silme hatası:", err)
      toast({ title: "Hata", description: "Hesap silinirken bir sorun oluştu.", variant: "destructive" })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setAccountToDelete(null)
    }
  }

  const openDeleteDialog = (account: Account) => {
    setAccountToDelete(account)
    setDeleteDialogOpen(true)
  }

  // Metrics calculations
  const totalBalance = accounts.reduce((sum, account) => sum + (account.current_balance || 0), 0)
  const activeAccountsCount = accounts.filter((a) => a.is_active).length
  const accountTypeDistribution = accounts.reduce(
    (acc, account) => {
      const type = account.account_type.toLowerCase()
      if (type === "vadesiz") acc.vadesiz++
      else if (type === "vadeli") acc.vadeli++
      else if (type === "yatirim") acc.yatirim++
      else if (type === "tasarruf") acc.tasarruf++
      return acc
    },
    { vadesiz: 0, vadeli: 0, yatirim: 0, tasarruf: 0 },
  )

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
        <p className="text-lg text-red-600">Hesapları görüntülemek için lütfen giriş yapın.</p>
        <Button
          onClick={() => router.push("/giris")}
          className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white"
        >
          Giriş Yap
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-transparent shadow-xl rounded-xl">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Wallet className="h-8 w-8" />
                Hesap Yönetimi
              </h2>
              <p className="opacity-90 text-lg">Banka hesaplarınızı takip edin ve yönetin.</p>
            </div>
            <Button
              variant="outline-white"
              onClick={openCreateDialog}
              size="lg"
             
            >
              <Plus className="h-5 w-5 mr-2" />
              Yeni Hesap Ekle
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Toplam Bakiye"
          value={formatCurrency(totalBalance)}
          subtitle="Tüm hesaplarda"
          color="emerald"
          icon={<DollarSign />}
        />
        <MetricCard
          title="Aktif Hesap"
          value={formatNumber(activeAccountsCount)}
          subtitle="adet hesap"
          color="blue"
          icon={<CheckCircle />}
        />
        <MetricCard
          title="Toplam Hesap"
          value={formatNumber(accounts.length)}
          subtitle="kayıtlı hesap"
          color="purple"
          icon={<Building2 />}
        />
        <MetricCard
          title="En Çok Kullanılan"
          value={
            accountTypeDistribution.vadesiz >=
            Math.max(accountTypeDistribution.vadeli, accountTypeDistribution.yatirim, accountTypeDistribution.tasarruf)
              ? "Vadesiz"
              : accountTypeDistribution.vadeli >=
                  Math.max(accountTypeDistribution.yatirim, accountTypeDistribution.tasarruf)
                ? "Vadeli"
                : accountTypeDistribution.yatirim >= accountTypeDistribution.tasarruf
                  ? "Yatırım"
                  : "Tasarruf"
          }
          subtitle="hesap türü"
          color="orange"
          icon={<TrendingUp />}
        />
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="border-b border-gray-100 bg-gray-50/50">
            <TabsList className="grid grid-cols-2 sm:grid-cols-5 bg-transparent h-auto p-2 gap-2">
              <TabsTrigger
                value="tumHesaplar"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <Wallet className="h-4 w-4" />
                Tümü
              </TabsTrigger>
              <TabsTrigger
                value="vadesizHesaplar"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <Banknote className="h-4 w-4" />
                Vadesiz
              </TabsTrigger>
              <TabsTrigger
                value="vadeliHesaplar"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <Clock className="h-4 w-4" />
                Vadeli
              </TabsTrigger>
              <TabsTrigger
                value="yatirimHesaplari"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <TrendingUp className="h-4 w-4" />
                Yatırım
              </TabsTrigger>
              <TabsTrigger
                value="tasarrufHesaplari"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <PiggyBank className="h-4 w-4" />
                Tasarruf
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-4 border-b border-gray-100 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Hesap ara..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-8 w-[250px] custom-input"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                      <ArrowUpDown className="h-4 w-4" />
                      Sırala: {sortBy === "created_at" ? "Tarih" : sortBy === "balance" ? "Bakiye" : "İsim"} (
                      {sortOrder === "asc" ? "Artan" : "Azalan"})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => handleSort("created_at")}>Tarihe Göre</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort("balance")}>Bakiyeye Göre</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort("account_name")}>İsme Göre</DropdownMenuItem>
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
            {currentAccounts.length === 0 && (
              <div className="text-center py-10">
                <Wallet className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Hesap Bulunamadı</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || activeTab !== "tumHesaplar"
                    ? "Bu filtreye uygun hesap bulunamadı."
                    : "Henüz hesap eklenmemiş."}
                </p>
                {!searchTerm && activeTab === "tumHesaplar" && (
                  <Button
                    onClick={openCreateDialog}
                    className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    İlk Hesabınızı Ekleyin
                  </Button>
                )}
              </div>
            )}

            {viewMode === "cards" && currentAccounts.length > 0 && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {currentAccounts.map((account) => (
                    <Card
                      key={account.id}
                      className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl border-gray-200"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <BankLogo bankName={account.banks?.name || ""} size="sm" />
                            </div>
                            <div>
                              <CardTitle className="text-lg text-gray-900 dark:text-white">
                                {account.account_name}
                              </CardTitle>
                              <p className="text-sm text-gray-500">{account.banks?.name}</p>
                            </div>
                          </div>
                          <Badge className={getStatusBadgeClass(account.is_active ? "aktif" : "pasif")}>
                            {getStatusIcon(account.is_active ? "aktif" : "pasif")}
                            <span className="ml-1">{account.is_active ? "Aktif" : "Pasif"}</span>
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Bakiye</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatCurrency(account.current_balance || 0)} {account.currency}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge className={getAccountTypeBadgeClass(account.account_type)}>
                            {getAccountTypeIcon(account.account_type)}
                            <span className="ml-1 capitalize">{account.account_type}</span>
                          </Badge>
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(account.created_at), { addSuffix: true, locale: tr })}
                          </p>
                        </div>
                        {account.notes && <p className="text-sm text-gray-600 line-clamp-2">{account.notes}</p>}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 bg-transparent hover:bg-blue-50 hover:text-blue-600"
                            onClick={() => openDetailPage(account)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Detay
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-transparent hover:bg-blue-50 hover:text-blue-600"
                            onClick={() => openEditDialog(account)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                            onClick={() => openDeleteDialog(account)}
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
                    itemName="hesap"
                  />
                )}
              </div>
            )}

            {viewMode === "table" && currentAccounts.length > 0 && (
              <div className="space-y-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-white dark:bg-gray-900">
                        <TableHead>Banka</TableHead>
                        <TableHead>Hesap Adı</TableHead>
                        <TableHead>Tür</TableHead>
                        <TableHead>Bakiye</TableHead>
                        <TableHead>Para Birimi</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Tarih</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentAccounts.map((account, index) => (
                        <TableRow
                          key={account.id}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 ease-in-out ${
                            index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-800/50"
                          }`}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <BankLogo bankName={account.banks?.name || ""} size="sm" />
                              <span className="text-gray-700 dark:text-gray-300">{account.banks?.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-blue-700 dark:text-blue-400">
                            {account.account_name}
                          </TableCell>
                          <TableCell>
                            <Badge className={getAccountTypeBadgeClass(account.account_type)}>
                              {getAccountTypeIcon(account.account_type)}
                              <span className="ml-1 capitalize">{account.account_type}</span>
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(account.current_balance || 0)}
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400">{account.currency}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeClass(account.is_active ? "aktif" : "pasif")}>
                              {getStatusIcon(account.is_active ? "aktif" : "pasif")}
                              <span className="ml-1">{account.is_active ? "Aktif" : "Pasif"}</span>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400">
                            {format(new Date(account.created_at), "dd.MM.yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openDetailPage(account)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Detay
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditDialog(account)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Düzenle
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => openDeleteDialog(account)}>
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
                    itemName="hesap"
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
            <AlertDialogTitle>Hesabı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu hesabı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {accountToDelete && (
            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
              <strong>Hesap:</strong> {accountToDelete.account_name}
              <br />
              <strong>Banka:</strong> {accountToDelete.banks?.name}
              <br />
              <strong>Bakiye:</strong> {formatCurrency(accountToDelete.current_balance || 0)} {accountToDelete.currency}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
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
