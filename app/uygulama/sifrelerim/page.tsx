"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import BankLogo from "@/components/bank-logo"
import { MetricCard } from "@/components/metric-card"
import {
  getBankingCredentials,
  deleteBankingCredential,
  updateLastUsedDate,
  decryptPassword,
  maskPassword,
  getBankingCredentialsStats,
  type BankingCredential,
} from "@/lib/api/banking-credentials"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"

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

const ITEMS_PER_PAGE = 6

export default function BankaciSifrelerimPage() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [credentials, setCredentials] = useState<BankingCredential[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set())
  const [copiedPasswords, setCopiedPasswords] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [stats, setStats] = useState({
    total: 0,
    internetBanking: 0,
    mobileBanking: 0,
    used: 0,
    needsPasswordChange: 0,
  })

  useEffect(() => {
    if (user && !authLoading) {
      loadCredentials()
      loadStats()
    }
  }, [user, authLoading, currentPage, searchTerm, selectedType])

  const loadCredentials = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, total } = await getBankingCredentials(user.id, currentPage, ITEMS_PER_PAGE)

      // Client-side filtering
      const filteredData = data.filter((credential) => {
        const matchesSearch =
          credential.credential_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          credential.bank_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          credential.username?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesType = selectedType === "all" || credential.credential_type === selectedType

        return matchesSearch && matchesType
      })

      setCredentials(filteredData)
      setTotalItems(total)
    } catch (error: any) {
      console.error("Credentials loading error:", error)
      toast({
        title: "Hata",
        description: "Şifreler yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    if (!user) return

    try {
      const statsData = await getBankingCredentialsStats(user.id)
      setStats(statsData)
    } catch (error: any) {
      console.error("Stats loading error:", error)
    }
  }

  const handleDelete = async (credentialId: string) => {
    if (!user) return

    try {
      await deleteBankingCredential(user.id, credentialId)
      await loadCredentials()
      await loadStats()
      toast({
        title: "Başarılı",
        description: "Şifre bilgisi silindi.",
      })
    } catch (error: any) {
      console.error("Delete error:", error)
      toast({
        title: "Hata",
        description: "Silme işlemi sırasında bir hata oluştu.",
        variant: "destructive",
      })
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
        await loadStats()
      } catch (error) {
        console.error("Last used date update error:", error)
      }
    }
    setVisiblePasswords(newVisible)
  }

  const copyPassword = async (credential: BankingCredential) => {
    if (!user) return

    try {
      const decryptedPassword = decryptPassword(credential.encrypted_password)
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
      await loadStats()

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

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

  if (authLoading || loading) {
    return (
      <div className="flex flex-col gap-4 md:gap-6 items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
        <p className="text-lg text-gray-600">Şifreler yükleniyor...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
        <Shield className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg text-red-600">Lütfen giriş yapınız.</p>
        <Button onClick={() => router.push("/giris")} className="mt-4">
          Giriş Yap
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-transparent shadow-xl rounded-xl">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Lock className="h-8 w-8" />
                Bankacılık Şifrelerim
              </h2>
              <p className="text-blue-100 text-lg">
                Mobil ve internet bankacılığı şifrelerinizi güvenli bir şekilde saklayın
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/uygulama/sifrelerim/ekle">
                <Button variant="outline" size="lg" className="bg-white text-blue-600 hover:bg-blue-50 border-white">
                  <Plus className="h-5 w-5 mr-2" />
                  Yeni Şifre Ekle
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Toplam Şifre"
          value={stats.total.toString()}
          subtitle="Kayıtlı"
          color="blue"
          icon={<Key className="h-5 w-5" />}
        />
        <MetricCard
          title="İnternet Bankacılığı"
          value={stats.internetBanking.toString()}
          subtitle="Adet"
          color="green"
          icon={<Globe className="h-5 w-5" />}
        />
        <MetricCard
          title="Mobil Bankacılık"
          value={stats.mobileBanking.toString()}
          subtitle="Adet"
          color="purple"
          icon={<Smartphone className="h-5 w-5" />}
        />
        <MetricCard
          title="Kullanılan Şifre"
          value={stats.used.toString()}
          subtitle="Son görüntülenen"
          color="orange"
          icon={<Eye className="h-5 w-5" />}
        />
        <MetricCard
          title="Değişim Gerekli"
          value={stats.needsPasswordChange.toString()}
          subtitle="Süresi dolmuş"
          color="red"
          icon={<AlertCircle className="h-5 w-5" />}
        />
      </div>

      {/* Filtreler */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Şifre adı, banka veya kullanıcı adı ile ara..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={selectedType}
              onValueChange={(value) => {
                setSelectedType(value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Türler</SelectItem>
                {Object.entries(credentialTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Şifre Listesi */}
      {credentials.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Lock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchTerm || selectedType !== "all" ? "Şifre bulunamadı" : "Henüz şifre eklenmemiş"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedType !== "all"
                ? "Arama kriterlerinize uygun şifre bulunamadı."
                : "Bankacılık şifrelerinizi ekleyerek güvenli bir şekilde saklayabilirsiniz."}
            </p>
            {!searchTerm && selectedType === "all" && (
              <Link href="/uygulama/sifrelerim/ekle">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  İlk Şifreni Ekle
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {credentials.map((credential) => {
            const TypeIcon = credentialTypeIcons[credential.credential_type]
            const isPasswordVisible = visiblePasswords.has(credential.id)
            const isPasswordCopied = copiedPasswords.has(credential.id)
            const decryptedPassword = decryptPassword(credential.encrypted_password)
            const passwordStatus = getPasswordChangeStatus(credential)

            return (
              <Card key={credential.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex-shrink-0">
                        <BankLogo bankName={credential.bank_name || ""} logoUrl={credential.bank_logo_url} size="md" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">{credential.credential_name}</h3>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <TypeIcon className="h-3 w-3" />
                            {credentialTypeLabels[credential.credential_type]}
                          </Badge>
                          {passwordStatus && (
                            <Badge
                              variant={
                                passwordStatus.status === "expired"
                                  ? "destructive"
                                  : passwordStatus.status === "warning"
                                    ? "default"
                                    : "secondary"
                              }
                              className={passwordStatus.status === "warning" ? "bg-yellow-100 text-yellow-800" : ""}
                            >
                              {passwordStatus.status === "expired"
                                ? "Değişim Gerekli"
                                : passwordStatus.status === "warning"
                                  ? "Yakında Değişim"
                                  : "Güncel"}
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Banka:</strong> {credential.bank_name}
                        </p>

                        {credential.username && (
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Kullanıcı Adı:</strong> {credential.username}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-gray-600">
                            <strong>Şifre:</strong>
                          </span>
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                            {isPasswordVisible && decryptedPassword
                              ? decryptedPassword
                              : maskPassword(decryptedPassword)}
                          </code>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePasswordVisibility(credential.id)}
                              className="h-8 w-8 p-0"
                            >
                              {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyPassword(credential)}
                              className="h-8 w-8 p-0"
                            >
                              {isPasswordCopied ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {credential.notes && (
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Notlar:</strong> {credential.notes}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Eklendi:{" "}
                            {formatDistanceToNow(new Date(credential.created_at), {
                              addSuffix: true,
                              locale: tr,
                            })}
                          </span>
                          {credential.last_used_date && (
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              Son kullanım:{" "}
                              {formatDistanceToNow(new Date(credential.last_used_date), {
                                addSuffix: true,
                                locale: tr,
                              })}
                            </span>
                          )}
                          {credential.last_password_change_date && (
                            <span className="flex items-center gap-1">
                              <Key className="h-3 w-3" />
                              Son değişim:{" "}
                              {formatDistanceToNow(new Date(credential.last_password_change_date), {
                                addSuffix: true,
                                locale: tr,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Link href={`/uygulama/sifrelerim/${credential.id}/duzenle`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Şifre Bilgisini Sil</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{credential.credential_name}" şifre bilgisini silmek istediğinizden emin misiniz? Bu
                              işlem geri alınamaz.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(credential.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Sil
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Sayfalandırma */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Toplam {totalItems} şifre, sayfa {currentPage} / {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Önceki
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Sonraki
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Güvenlik Uyarısı */}
      <Alert className="bg-amber-50 border-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Güvenlik Uyarısı</AlertTitle>
        <AlertDescription className="text-amber-700">
          Şifreleriniz güvenli bir şekilde şifrelenerek saklanmaktadır. Yine de güçlü şifreler kullanın ve düzenli
          olarak değiştirin. Bu bilgileri kimseyle paylaşmayın.
        </AlertDescription>
      </Alert>
    </div>
  )
}
