"use client"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MetricCard } from "@/components/metric-card"
import BankLogo from "@/components/bank-logo"
import { PaginationModern } from "@/components/ui/pagination-modern"
import {
  Plus,
  Search,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Shield,
  Smartphone,
  Globe,
  Phone,
  Settings,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  Loader2,
  Key,
  Lock,
  ArrowUpDown,
  List,
  MoreHorizontal,
  AlertCircle,
} from "lucide-react"

import { BsFillGrid3X3GapFill } from "react-icons/bs"

import { useAuth } from "@/hooks/use-auth"
import { useSubscription } from "@/hooks/use-subscription" // Import subscription hook
import { useToast } from "@/hooks/use-toast"
import {
  getBankingCredentials,
  deleteBankingCredential,
  decryptCredentialPassword,
  updateLastUsedDate,
  type BankingCredential,
} from "@/app/actions/banking-credentials"
import { maskPassword } from "@/lib/utils/password"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"

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

const credentialTypeLabels = {
  internet_banking: "İnternet Bankacılığı",
  mobile_banking: "Mobil Bankacılık",
  phone_banking: "Telefon Bankacılığı",
  other: "Diğer",
}

const credentialTypeIcons = {
  internet_banking: Globe,
  mobile_banking: Smartphone,
  phone_banking: Phone,
  other: Settings,
}

const getStatusIcon = (credential: BankingCredential) => {
  const passwordStatus = getPasswordChangeStatus(credential)
  if (passwordStatus?.status === "expired") return <AlertTriangle className="h-4 w-4 text-white" />
  if (passwordStatus?.status === "warning") return <Clock className="h-4 w-4 text-white" />
  return <Shield className="h-4 w-4 text-white" />
}

const getStatusBadgeText = (credential: BankingCredential): string => {
  const passwordStatus = getPasswordChangeStatus(credential)
  if (passwordStatus?.status === "expired") return "Değişim Gerekli"
  if (passwordStatus?.status === "warning") return "Yakında Değişim"
  return "Güncel"
}

const getStatusBadgeClass = (credential: BankingCredential): string => {
  const passwordStatus = getPasswordChangeStatus(credential)
  if (passwordStatus?.status === "expired")
    return "bg-gradient-to-r from-red-600 to-rose-700 text-white border-transparent hover:from-red-700 hover:to-rose-800"
  if (passwordStatus?.status === "warning")
    return "bg-gradient-to-r from-yellow-600 to-orange-700 text-white border-transparent hover:from-yellow-700 hover:to-orange-800"
  return "bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-transparent hover:from-emerald-700 hover:to-teal-800"
}

const getPasswordChangeStatus = (credential: BankingCredential) => {
  if (!credential.password_change_frequency_days || !credential.last_password_change_date) {
    return null
  }

  const now = new Date()
  const lastChange = new Date(credential.last_password_change_date)
  const daysSinceChange = Math.floor((now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24))

  if (daysSinceChange >= credential.password_change_frequency_days) {
    return { status: "expired", days: daysSinceChange }
  } else if (daysSinceChange >= credential.password_change_frequency_days * 0.8) {
    return { status: "warning", days: daysSinceChange }
  }

  return { status: "good", days: daysSinceChange }
}

export default function BankaciSifrelerimPage() {
  const { user, loading: authLoading } = useAuth()
  const { isPremium, loading: subscriptionLoading } = useSubscription() // Check premium status
  const { toast } = useToast()
  const router = useRouter()

  const [allCredentials, setAllCredentials] = useState<BankingCredential[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState("tumSifreler")
  const [viewMode, setViewMode] = useState("table") // Changed from "cards" to "table"
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("sonKullanim")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [credentialToDelete, setCredentialToDelete] = useState<string | null>(null)

  const [showUpdatePasswordDialog, setShowUpdatePasswordDialog] = useState(false)
  const [credentialToUpdate, setCredentialToUpdate] = useState<BankingCredential | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set())
  const [copiedPasswords, setCopiedPasswords] = useState<Set<string>>(new Set())

  const itemsPerPageCards = 8
  const itemsPerPageTable = 8

  useEffect(() => {
    let isMounted = true

    async function fetchData() {
      if (user?.id && isMounted) {
        setLoadingData(true)
        setError(null)
        try {
          const data = await getBankingCredentials(user.id) // Get all credentials

          if (isMounted && data) {
            setAllCredentials(data || [])
          }
        } catch (err) {
          console.error("Credentials data fetch error:", err)
          if (isMounted) {
            setError("Şifreler yüklenirken bir hata oluştu.")
          }
        } finally {
          if (isMounted) {
            setLoadingData(false)
          }
        }
      } else if (!authLoading && !user && isMounted) {
        setLoadingData(false)
        setError("Lütfen giriş yapınız.")
      }
    }
    fetchData()

    return () => {
      isMounted = false
    }
  }, [user, authLoading])

  useEffect(() => {
    if (!subscriptionLoading && !isPremium && !authLoading) {
      router.push("/uygulama/premium")
    }
  }, [isPremium, subscriptionLoading, authLoading, router])

  const filteredAndSortedCredentials = useMemo(() => {
    const filtered = allCredentials.filter((credential) => {
      const matchesSearch =
        credential.credential_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        credential.bank_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        credential.username?.toLowerCase().includes(searchTerm.toLowerCase())

      switch (activeTab) {
        case "internetBankaciligi":
          return matchesSearch && credential.credential_type === "internet_banking"
        case "mobilBankaciligi":
          return matchesSearch && credential.credential_type === "mobile_banking"
        case "telefonBankaciligi":
          return matchesSearch && credential.credential_type === "phone_banking"
        case "diger":
          return matchesSearch && credential.credential_type === "other"
        default:
          return matchesSearch
      }
    })

    if (sortBy === "bankaAdi") {
      filtered.sort((a, b) => {
        const comparison = (a.bank_name || "").localeCompare(b.bank_name || "")
        return sortOrder === "asc" ? comparison : -comparison
      })
    } else if (sortBy === "tur") {
      filtered.sort((a, b) => {
        const comparison = (a.credential_type || "").localeCompare(b.credential_type || "")
        return sortOrder === "asc" ? comparison : -comparison
      })
    } else if (sortBy === "sifreAdi") {
      filtered.sort((a, b) => {
        const comparison = (a.credential_name || "").localeCompare(b.credential_name || "")
        return sortOrder === "asc" ? comparison : -comparison
      })
    } else if (sortBy === "kullaniciAdi") {
      filtered.sort((a, b) => {
        const comparison = (a.username || "").localeCompare(b.username || "")
        return sortOrder === "asc" ? comparison : -comparison
      })
    } else if (sortBy === "sonKullanim") {
      filtered.sort((a, b) => {
        const dateA = a.last_used_date ? new Date(a.last_used_date).getTime() : 0
        const dateB = b.last_used_date ? new Date(b.last_used_date).getTime() : 0
        const comparison = dateA - dateB
        return sortOrder === "asc" ? comparison : -comparison
      })
    }

    return filtered
  }, [allCredentials, searchTerm, activeTab, sortBy, sortOrder])

  const currentItemsPerPage = viewMode === "cards" ? itemsPerPageCards : itemsPerPageTable
  const totalItems = filteredAndSortedCredentials.length
  const totalPages = Math.ceil(totalItems / currentItemsPerPage)
  const startIndex = (currentPage - 1) * currentItemsPerPage
  const endIndex = startIndex + currentItemsPerPage
  const currentItems = filteredAndSortedCredentials.slice(startIndex, endIndex)

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
      setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  const handleDeleteCredential = async (credentialId: string) => {
    setCredentialToDelete(credentialId)
    setShowDeleteDialog(true)
  }

  const handleUpdatePassword = async (credential: BankingCredential) => {
    setCredentialToUpdate(credential)
    setNewPassword("")
    setShowUpdatePasswordDialog(true)
  }

  const confirmUpdatePassword = async () => {
    if (!credentialToUpdate || !user || !newPassword.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen yeni şifrenizi girin.",
        variant: "destructive",
      })
      return
    }

    setIsUpdatingPassword(true)
    try {
      const { encryptPassword } = await import("@/lib/api/banking-credentials")
      const encryptedPassword = await encryptPassword(newPassword)

      const { supabase } = await import("@/lib/supabase")
      const { error } = await supabase
        .from("banking_credentials")
        .update({
          encrypted_password: encryptedPassword,
          last_password_change_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", credentialToUpdate.id)
        .eq("user_id", user.id)

      if (error) throw error

      // Listeyi güncelle
      setAllCredentials((prev) =>
        prev.map((c) =>
          c.id === credentialToUpdate.id
            ? {
                ...c,
                encrypted_password: encryptedPassword,
                last_password_change_date: new Date().toISOString(),
              }
            : c,
        ),
      )

      toast({
        title: "Başarılı",
        description: "Şifre başarıyla güncellendi.",
      })

      setShowUpdatePasswordDialog(false)
      setCredentialToUpdate(null)
      setNewPassword("")
    } catch (error) {
      console.error("Şifre güncellenirken hata:", error)
      toast({
        title: "Hata",
        description: "Şifre güncellenirken bir sorun oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const confirmDeleteCredential = async () => {
    if (!credentialToDelete || !user) return

    try {
      await deleteBankingCredential(user.id, credentialToDelete)
      setAllCredentials((prev) => prev.filter((c) => c.id !== credentialToDelete))
      toast({ title: "Başarılı", description: "Şifre başarıyla silindi." })
    } catch (error) {
      console.error("Şifre silinirken hata:", error)
      toast({ title: "Hata", description: "Şifre silinirken bir sorun oluştu.", variant: "destructive" })
    } finally {
      setShowDeleteDialog(false)
      setCredentialToDelete(null)
    }
  }

  const togglePasswordVisibility = async (credentialId: string) => {
    if (!user) return

    const newVisible = new Set(visiblePasswords)
    if (newVisible.has(credentialId)) {
      newVisible.delete(credentialId)
    } else {
      newVisible.add(credentialId)
      // Son kullanım tarihini güncelle
      try {
        await updateLastUsedDate(user.id, credentialId)
      } catch (error) {
        console.error("Last used date update error:", error)
      }
    }
    setVisiblePasswords(newVisible)
  }

  const copyPassword = async (credential: BankingCredential) => {
    if (!user) return

    try {
      const decryptedPassword = await decryptCredentialPassword(user.id, credential.id)
      if (!decryptedPassword) {
        toast({
          title: "Hata",
          description: "Şifre çözülemedi.",
          variant: "destructive",
        })
        return
      }

      await navigator.clipboard.writeText(decryptedPassword)

      const newCopied = new Set(copiedPasswords)
      newCopied.add(credential.id)
      setCopiedPasswords(newCopied)

      // Son kullanım tarihini güncelle
      await updateLastUsedDate(user.id, credential.id)

      toast({
        title: "Başarılı",
        description: "Şifre panoya kopyalandı.",
      })

      // 2 saniye sonra kopyalama durumunu temizle
      setTimeout(() => {
        setCopiedPasswords((prev) => {
          const updated = new Set(prev)
          updated.delete(credential.id)
          return updated
        })
      }, 2000)
    } catch (error: any) {
      console.error("Copy password error:", error)
      toast({
        title: "Hata",
        description: "Şifre kopyalanırken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  // Metric calculations
  const totalCredentials = allCredentials.length
  const internetBankingCount = allCredentials.filter((c) => c.credential_type === "internet_banking").length
  const mobileBankingCount = allCredentials.filter((c) => c.credential_type === "mobile_banking").length
  const recentlyUsedCount = allCredentials.filter((c) => {
    if (!c.last_used_date) return false
    const daysSinceUsed = Math.floor((Date.now() - new Date(c.last_used_date).getTime()) / (1000 * 60 * 60 * 24))
    return daysSinceUsed <= 7
  }).length

  if (authLoading || subscriptionLoading) {
    return (
      <div className="flex flex-col gap-4 md:gap-6 items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
        <p className="text-lg text-gray-600 dark:text-white/70">Veriler yükleniyor...</p>
      </div>
    )
  }

  if (!isPremium) {
    return null
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg text-red-600 dark:text-red-400">{error}</p>
        {!user && (
          <Button onClick={() => router.push("/giris")} className="mt-4">
            Giriş Yap
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-transparent shadow-xl rounded-xl">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Lock className="h-8 w-8" />
                Bankacılık Şifre Yönetimi
              </h2>
              <p className="text-emerald-100 text-lg">
                Tüm bankacılık şifrelerinizi güvenli bir şekilde saklayın ve yönetin
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                size="lg"
                className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
                onClick={() => router.push("/uygulama/sifrelerim/ekle")}
              >
                <Plus className="h-5 w-5 mr-2" />
                Yeni Şifre Ekle
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Toplam Şifre"
          value={totalCredentials.toString()}
          subtitle="Kayıtlı"
          color="blue"
          icon={<Key />}
        />
        <MetricCard
          title="İnternet Bankacılığı"
          value={internetBankingCount.toString()}
          subtitle="Adet"
          color="emerald"
          icon={<Globe />}
        />
        <MetricCard
          title="Mobil Bankacılık"
          value={mobileBankingCount.toString()}
          subtitle="Adet"
          color="purple"
          icon={<Smartphone />}
        />
        <MetricCard
          title="Son Kullanılan"
          value={recentlyUsedCount.toString()}
          subtitle="Bu hafta"
          color="orange"
          icon={<Eye />}
        />
      </div>

      {/* Modern Tabs */}
      <div className="bg-white dark:bg-black/20 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-emerald-900/10">
            <TabsList className="grid grid-cols-5 bg-transparent h-auto p-2 gap-2">
              <TabsTrigger
                value="tumSifreler"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-100 dark:data-[state=active]:bg-emerald-900/20 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <Key className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Tüm Şifreler</span>
                <span className="sm:hidden font-medium">Tümü</span>
              </TabsTrigger>
              <TabsTrigger
                value="internetBankaciligi"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-100 dark:data-[state=active]:bg-emerald-900/20 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">İnternet</span>
                <span className="sm:hidden font-medium">İnternet</span>
              </TabsTrigger>
              <TabsTrigger
                value="mobilBankaciligi"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-100 dark:data-[state=active]:bg-emerald-900/20 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <Smartphone className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Mobil</span>
                <span className="sm:hidden font-medium">Mobil</span>
              </TabsTrigger>
              <TabsTrigger
                value="telefonBankaciligi"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-100 dark:data-[state=active]:bg-emerald-900/20 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Telefon</span>
                <span className="sm:hidden font-medium">Telefon</span>
              </TabsTrigger>
              <TabsTrigger
                value="diger"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-100 dark:data-[state=active]:bg-emerald-900/20 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Diğer</span>
                <span className="sm:hidden font-medium">Diğer</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Search, Sort and View Toggle */}
          <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-white dark:bg-black/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Şifre ara..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-8 w-[250px]"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      Sırala: {sortBy === "sonKullanim" ? "Son Kullanım" : "Banka Adı"} (
                      {sortOrder === "asc" ? "Artan" : "Azalan"})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="dark:bg-black/10 dark:border-white/10">
                    <DropdownMenuItem
                      onClick={() => handleSort("sonKullanim")}
                      className="dark:text-white dark:hover:bg-white/10"
                    >
                      Son Kullanıma Göre
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleSort("bankaAdi")}
                      className="dark:text-white dark:hover:bg-white/10"
                    >
                      Banka Adına Göre
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* View Mode Toggle */}
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

          {/* Content */}
          <div className="p-6">
            {currentItems.length === 0 && !loadingData && (
              <div className="text-center py-10">
                <Lock className="mx-auto h-12 w-12 text-gray-400 dark:text-white/60" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Şifre Bulunamadı</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
                  {activeTab === "tumSifreler" ? "Hiç şifre eklenmemiş." : "Bu filtreye uygun şifre bulunamadı."}
                </p>
                <div className="mt-6">
                  <Button
                    onClick={() => router.push("/uygulama/sifrelerim/ekle")}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                  >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    Yeni Şifre Ekle
                  </Button>
                </div>
              </div>
            )}
            {viewMode === "cards" && currentItems.length > 0 ? (
              /* Cards View */
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {currentItems.map((credential) => {
                    const TypeIcon = credentialTypeIcons[credential.credential_type]
                    const isPasswordVisible = visiblePasswords.has(credential.id)

                    return (
                      <Card
                        key={credential.id}
                        className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl border-gray-200 dark:border-white/10 overflow-hidden"
                      >
                        <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-emerald-900/20 dark:to-emerald-900/10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <BankLogo
                                  bankName={credential.bank_name || "Bilinmeyen Banka"}
                                  logoUrl={credential.bank_logo_url ?? undefined}
                                  size="md"
                                  className="ring-2 ring-white shadow-lg"
                                />
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                                  <TypeIcon className="h-2.5 w-2.5 text-white" />
                                </div>
                              </div>
                              <div>
                                <CardTitle className="text-lg text-gray-900 dark:text-white">
                                  {credential.bank_name || "N/A"}
                                </CardTitle>
                                <CardDescription className="text-emerald-600 font-medium">
                                  {credentialTypeLabels[credential.credential_type]}
                                </CardDescription>
                              </div>
                            </div>
                            <Badge className={getStatusBadgeClass(credential)}>
                              {getStatusIcon(credential)}
                              {getStatusBadgeText(credential)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-5 pt-4">
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <p className="text-sm text-gray-500 dark:text-white/60">Şifre Adı</p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {credential.credential_name}
                              </p>
                            </div>
                            {credential.username && (
                              <div>
                                <p className="text-sm text-gray-500 dark:text-white/60">Kullanıcı Adı</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {credential.username}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-white/60">Şifre:</span>
                            <PasswordDisplay
                              credential={credential}
                              isVisible={isPasswordVisible}
                              onToggleVisibility={() => togglePasswordVisibility(credential.id)}
                              onCopy={() => copyPassword(credential)}
                              isCopied={copiedPasswords.has(credential.id)}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500 dark:text-white/60">Eklendi</p>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {formatDistanceToNow(new Date(credential.created_at), {
                                  addSuffix: true,
                                  locale: tr,
                                })}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 dark:text-white/60">Son Kullanım</p>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {credential.last_used_date
                                  ? formatDistanceToNow(new Date(credential.last_used_date), {
                                      addSuffix: true,
                                      locale: tr,
                                    })
                                  : "Hiç"}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => router.push(`/uygulama/sifrelerim/${credential.id}/duzenle`)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Düzenle
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleUpdatePassword(credential)}>
                                  <Key className="mr-2 h-4 w-4" />
                                  Şifre Güncelle
                                </DropdownMenuItem>
                                <DropdownMenuItem>Rapor Al</DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600 dark:text-red-400"
                                  onClick={() => handleDeleteCredential(credential.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Sil
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
                {totalItems > 0 && (
                  <PaginationModern
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={currentItemsPerPage}
                    onPageChange={setCurrentPage}
                    itemName="şifre"
                  />
                )}
              </div>
            ) : viewMode === "table" && currentItems.length > 0 ? (
              /* Table View */
              <div className="space-y-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-white dark:bg-black/20">
                        <TableHead
                          className="font-semibold text-gray-700 dark:text-white/70 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400"
                          onClick={() => handleSort("bankaAdi")}
                        >
                          <div className="flex items-center gap-1">
                            Banka
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </TableHead>
                        <TableHead
                          className="font-semibold text-gray-700 dark:text-white/70 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400"
                          onClick={() => handleSort("tur")}
                        >
                          <div className="flex items-center gap-1">
                            Tür
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </TableHead>
                        <TableHead
                          className="font-semibold text-gray-700 dark:text-white/70 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400"
                          onClick={() => handleSort("sifreAdi")}
                        >
                          <div className="flex items-center gap-1">
                            Şifre Adı
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </TableHead>
                        <TableHead
                          className="font-semibold text-gray-700 dark:text-white/70 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400"
                          onClick={() => handleSort("kullaniciAdi")}
                        >
                          <div className="flex items-center gap-1">
                            Kullanıcı Adı
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-white/70">Şifre</TableHead>
                        <TableHead
                          className="font-semibold text-gray-700 dark:text-white/70 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400"
                          onClick={() => handleSort("sonKullanim")}
                        >
                          <div className="flex items-center gap-1">
                            Son Kullanım
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-white/70">Durum</TableHead>
                        <TableHead className="w-[50px] text-right font-semibold text-gray-700 dark:text-white/70">
                          İşlemler
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentItems.map((credential, index) => {
                        const TypeIcon = credentialTypeIcons[credential.credential_type]
                        const isPasswordVisible = visiblePasswords.has(credential.id)

                        return (
                          <TableRow
                            key={credential.id}
                            className={`hover:bg-emerald-50 dark:hover:bg-white/10 transition-colors duration-150 ease-in-out ${
                              index % 2 === 0 ? "bg-white dark:bg-black/20" : "bg-gray-50/50 dark:bg-black/10"
                            }`}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <BankLogo
                                  bankName={credential.bank_name || "Bilinmeyen Banka"}
                                  logoUrl={credential.bank_logo_url ?? undefined}
                                  size="md"
                                  className="ring-1 ring-emerald-200 dark:ring-emerald-700 bg-white dark:bg-black/10"
                                />
                                <div>
                                  <span className="font-medium text-gray-900 dark:text-white block">
                                    {credential.bank_name || "N/A"}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-600 dark:text-white/70">
                              <div className="flex items-center gap-2">
                                <TypeIcon className="h-4 w-4" />
                                {credentialTypeLabels[credential.credential_type]}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-gray-900 dark:text-white">
                              {credential.credential_name}
                            </TableCell>
                            <TableCell className="text-gray-600 dark:text-white/70">
                              {credential.username || "-"}
                            </TableCell>
                            <TableCell>
                              <PasswordDisplay
                                credential={credential}
                                isVisible={isPasswordVisible}
                                onToggleVisibility={() => togglePasswordVisibility(credential.id)}
                                onCopy={() => copyPassword(credential)}
                                isCopied={copiedPasswords.has(credential.id)}
                              />
                            </TableCell>
                            <TableCell className="text-gray-600 dark:text-white/70">
                              {credential.last_used_date
                                ? formatDistanceToNow(new Date(credential.last_used_date), {
                                    addSuffix: true,
                                    locale: tr,
                                  })
                                : "Hiç"}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getStatusBadgeClass(credential)} flex items-center gap-1`}>
                                {getStatusIcon(credential)}
                                {getStatusBadgeText(credential)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-teal-900/20 dark:hover:text-emerald-400"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Actions</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/uygulama/sifrelerim/${credential.id}/duzenle`)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Düzenle
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdatePassword(credential)}>
                                    <Key className="mr-2 h-4 w-4" />
                                    Şifre Güncelle
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600 dark:text-red-400"
                                    onClick={() => handleDeleteCredential(credential.id)}
                                  >
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
                {totalItems > 0 && (
                  <PaginationModern
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={currentItemsPerPage}
                    onPageChange={setCurrentPage}
                    itemName="şifre"
                  />
                )}
              </div>
            ) : null}
          </div>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Şifreyi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu şifreyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteDialog(false)
                setCredentialToDelete(null)
              }}
            >
              İptal
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCredential} className="bg-red-600 hover:bg-red-700 text-white">
              <Trash2 className="h-4 w-4 mr-2" />
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Update Password Dialog */}
      <AlertDialog open={showUpdatePasswordDialog} onOpenChange={setShowUpdatePasswordDialog}>
        <AlertDialogContent className="dark:bg-black/10 dark:border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 dark:text-white">
              <Key className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Şifre Güncelle
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-white/60">
              {credentialToUpdate && (
                <div className="mb-4">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {credentialToUpdate.bank_name} - {credentialToUpdate.credential_name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-white/60">
                    Kullanıcı: {credentialToUpdate.username || "N/A"}
                  </p>
                </div>
              )}
              Sadece yeni şifrenizi girerek mevcut şifrenizi güncelleyebilirsiniz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-gray-700 dark:text-white/70 mb-2 block">Yeni Şifre</label>
            <Input
              type="password"
              placeholder="Yeni şifrenizi girin..."
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="dark:bg-black/20 dark:border-white/10 dark:text-white"
              disabled={isUpdatingPassword}
            />
          </div>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel
              onClick={() => {
                setShowUpdatePasswordDialog(false)
                setCredentialToUpdate(null)
                setNewPassword("")
              }}
              disabled={isUpdatingPassword}
              className="dark:bg-black/20 dark:text-white dark:hover:bg-white/10"
            >
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUpdatePassword}
              disabled={isUpdatingPassword || !newPassword.trim()}
              className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white"
            >
              {isUpdatingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Güncelleniyor...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Şifreyi Güncelle
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Şifre görüntüleme komponenti
function PasswordDisplay({
  credential,
  isVisible,
  onToggleVisibility,
  onCopy,
  isCopied,
}: {
  credential: BankingCredential
  isVisible: boolean
  onToggleVisibility: () => void
  onCopy: () => void
  isCopied: boolean
}) {
  const { user } = useAuth()
  const [decryptedPassword, setDecryptedPassword] = useState<string | null>(null)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [decryptError, setDecryptError] = useState<string | null>(null)

  useEffect(() => {
    if (isVisible && !decryptedPassword && !isDecrypting && user?.id) {
      setIsDecrypting(true)
      setDecryptError(null)

      decryptCredentialPassword(user.id, credential.id)
        .then((password) => {
          if (password) {
            setDecryptedPassword(password)
          } else {
            setDecryptError("Şifre çözülemedi")
          }
        })
        .catch((error) => {
          console.error("Password decryption error:", error)
          setDecryptError("Şifre çözme hatası")
          setDecryptedPassword(null)
        })
        .finally(() => setIsDecrypting(false))
    }
  }, [isVisible, credential.id, decryptedPassword, isDecrypting, user?.id])

  const displayPassword = () => {
    if (isDecrypting) return "Çözülüyor..."
    if (decryptError) return "Hata: " + decryptError
    if (isVisible && decryptedPassword) return decryptedPassword
    return maskPassword(decryptedPassword || "••••••••")
  }

  return (
    <div className="flex items-center gap-2">
      <code className="bg-gray-100 dark:bg-black/10 px-2 py-1 rounded text-sm font-mono max-w-[120px] truncate text-gray-900 dark:text-white">
        {displayPassword()}
      </code>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleVisibility}
          className="h-8 w-8 p-0"
          disabled={isDecrypting}
          title={isVisible ? "Şifreyi gizle" : "Şifreyi göster"}
        >
          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopy}
          className="h-8 w-8 p-0"
          disabled={isDecrypting || !!decryptError}
          title="Şifreyi kopyala"
        >
          {isCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
