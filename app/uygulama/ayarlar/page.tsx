"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import Cropper from "react-easy-crop"
import type { Area } from "react-easy-crop"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  User,
  DollarSign,
  Shield,
  Settings,
  Bell,
  Mail,
  Phone,
  MapPin,
  Save,
  Loader2,
  AlertCircle,
  Info,
  Eye,
  EyeOff,
  Key,
  Monitor,
  Download,
  Trash2,
  AlertTriangle,
  X,
  Clock,
  LocateIcon as Location,
  Upload,
  Crown,
  CreditCard,
  Calendar,
  FileText,
  TrendingUp,
  ArrowUpRight,
  Check,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { getProfile, updateProfile } from "@/lib/auth"
import { getFinancialProfile, upsertFinancialProfile } from "@/lib/api/financials"
import type { Profile, FinancialProfile } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { useUserTheme } from "@/components/user-theme-provider"
import { useSubscription } from "@/hooks/use-subscription"
import { UserInvoices } from "@/components/user-invoices"

export default function AyarlarPage() {
  const { user, profile: initialProfile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const { theme, setTheme } = useUserTheme()

  const { subscription, isPremium, loading: subscriptionLoading } = useSubscription()

  const [profileData, setProfileData] = useState<Partial<Profile> & Record<string, any>>({})
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("profile")

  // Avatar upload state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [showCropModal, setShowCropModal] = useState(false)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

  // Güvenlik state'leri
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordChangeStatus, setPasswordChangeStatus] = useState<{
    type: "success" | "error" | null
    message: string
  }>({ type: null, message: "" })

  // Tercihler state'leri
  const [compactView, setCompactView] = useState(false)
  const [animationsEnabled, setAnimationsEnabled] = useState(true)

  // Abonelik state'leri
  const [invoices, setInvoices] = useState<any[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  // Oturum geçmişi (real data)
  const [sessions, setSessions] = useState<any[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)

  useEffect(() => {
    let isMounted = true
    const searchParams = new URLSearchParams(window.location.search)
    const tab = searchParams.get("tab")
    const payment = searchParams.get("payment")
    const reason = searchParams.get("reason")

    // Handle payment callback
    if (payment && isMounted) {
      if (payment === "success") {
        toast({
          title: "Ödeme Başarılı!",
          description: "Premium üyeliğiniz aktif edildi. Tüm özelliklere erişebilirsiniz!",
        })
      } else if (payment === "failed") {
        toast({
          title: "Ödeme Başarısız",
          description: reason ? decodeURIComponent(reason) : "Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin.",
          variant: "destructive",
        })
      }
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname)
    }

    if (tab && isMounted) setActiveTab(tab)

    if (initialProfile && isMounted) {
      setProfileData(initialProfile)
      setLoadingProfile(false)
    } else if (user?.id && !authLoading && isMounted) {
      const fetchProfile = async () => {
        try {
          const fetchedProfile = await getProfile(user.id)
          if (isMounted) {
            setProfileData(fetchedProfile || { email: user.email })
          }
        } catch (e) {
          console.error("Profil çekilirken hata:", e)
          if (isMounted) {
            setError("Profil bilgileri yüklenemedi.")
          }
        } finally {
          if (isMounted) {
            setLoadingProfile(false)
          }
        }
      }
      fetchProfile()
    } else if (!authLoading && !user && isMounted) {
      setError("Lütfen giriş yapınız.")
      setLoadingProfile(false)
    }

    if (typeof window !== "undefined") {
      const savedCompactView = localStorage.getItem("compactView") === "true"
      const savedAnimations = localStorage.getItem("animationsEnabled") !== "false"

      setCompactView(savedCompactView)
      setAnimationsEnabled(savedAnimations)
    }

    return () => {
      isMounted = false
    }
  }, [user, initialProfile, authLoading])

  // Theme is now managed by useThemeSync hook - no need for manual loading

  // Fetch sessions
  useEffect(() => {
    let isMounted = true
    if (user?.id && activeTab === "security" && isMounted) {
      const fetchSessions = async () => {
        try {
          setLoadingSessions(true)
          const response = await fetch("/api/user/sessions")
          const data = await response.json()
          if (isMounted && data.sessions) {
            setSessions(data.sessions)
          }
        } catch (error) {
          console.error("Error fetching sessions:", error)
        } finally {
          if (isMounted) {
            setLoadingSessions(false)
          }
        }
      }
      fetchSessions()
    }
    return () => {
      isMounted = false
    }
  }, [user, activeTab])

  // Finansal Profil State ve Fonksiyonları
  const [financialProfileData, setFinancialProfileData] = useState<Partial<FinancialProfile> & Record<string, any>>({})
  const [loadingFinancialProfile, setLoadingFinancialProfile] = useState(true)
  const [isSavingFinancial, setIsSavingFinancial] = useState(false)

  useEffect(() => {
    let isMounted = true
    if (user?.id && !authLoading && isMounted) {
      const fetchFinancialProfile = async () => {
        if (isMounted) setLoadingFinancialProfile(true)
        try {
          const fetchedData = await getFinancialProfile(user.id)
          if (isMounted) {
            setFinancialProfileData(fetchedData || {})
          }
        } catch (e) {
          console.error("Finansal profil çekilirken hata:", e)
        } finally {
          if (isMounted) {
            setLoadingFinancialProfile(false)
          }
        }
      }
      fetchFinancialProfile()
    }
    return () => {
      isMounted = false
    }
  }, [user, authLoading])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setProfileData((prev) => ({ ...prev, [id]: value }))
  }

  const handleFinancialInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    const numericFields = ["monthly_income", "monthly_expenses", "total_assets", "total_liabilities"]
    setFinancialProfileData((prev) => ({
      ...prev,
      [id]: numericFields.includes(id) ? (value === "" ? null : Number.parseFloat(value)) : value,
    }))
  }

  const handleSelectChange = (id: string, value: string) => {
    setFinancialProfileData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleSaveProfile = async () => {
    if (!user) {
      toast({ title: "Hata", description: "Kullanıcı bulunamadı.", variant: "destructive" })
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      await updateProfile(user.id, profileData)
      toast({ title: "Başarılı", description: "Profil bilgileriniz güncellendi." })
    } catch (err: any) {
      console.error("Profil güncellenirken hata:", err)
      setError(err.message || "Profil güncellenirken bir hata oluştu.")
      toast({
        title: "Hata",
        description: err.message || "Profil güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveFinancialProfile = async () => {
    if (!user) {
      toast({ title: "Hata", description: "Kullanıcı bulunamadı.", variant: "destructive" })
      return
    }
    setIsSavingFinancial(true)
    setError(null)
    try {
      await upsertFinancialProfile(user.id, financialProfileData)
      toast({ title: "Başarılı", description: "Finansal bilgileriniz güncellendi." })
    } catch (err: any) {
      console.error("Finansal profil güncellenirken hata:", err)
      setError(err.message || "Finansal profil güncellenirken bir hata oluştu.")
      toast({
        title: "Hata",
        description: err.message || "Finansal profil güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsSavingFinancial(false)
    }
  }

  const compressImage = (file: File, maxWidth = 400, quality = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height
            height = maxWidth
          }
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            }
          },
          "image/jpeg",
          quality,
        )
      }

      img.src = URL.createObjectURL(file)
    })
  }

  // Avatar upload handler
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Hata", description: "Dosya boyutu 10MB'dan büyük olamaz.", variant: "destructive" })
      return
    }

    setIsUploadingAvatar(true)

    try {
      // Optimize image
      const compressedFile = await compressImage(file, 400, 0.8)

      // Show preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(compressedFile)

      toast({
        title: "Resim optimize ediliyor...",
        description: `Dosya boyutu: ${(compressedFile.size / 1024).toFixed(0)}KB`,
      })

      // Upload immediately
      const fileExt = compressedFile.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, compressedFile, {
        cacheControl: "3600",
        upsert: false,
      })

      if (uploadError) {
        console.error("[Avatar Upload] Upload error:", uploadError)
        toast({ title: "Hata", description: "Yükleme başarısız: " + uploadError.message, variant: "destructive" })
        return
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath)


      await updateProfile(user.id, { avatar_url: publicUrl })
      setProfileData((prev) => ({ ...prev, avatar_url: publicUrl }))


      // Clear preview immediately and use the uploaded URL
      setAvatarPreview(null)

      toast({
        title: "Başarılı",
        description: "Profil fotoğrafınız güncellendi.",
      })
    } catch (error) {
      console.error("[Avatar Upload] Error:", error)
      toast({ title: "Hata", description: "Resim yüklenirken bir hata oluştu.", variant: "destructive" })
    } finally {
      setIsUploadingAvatar(false)
    }
  }


  // Password change handler
  const handlePasswordChange = async () => {
    // Clear previous status
    setPasswordChangeStatus({ type: null, message: "" })

    if (!newPassword || !confirmPassword) {
      setPasswordChangeStatus({ type: "error", message: "Lütfen tüm alanları doldurun." })
      toast({ title: "Hata", description: "Lütfen tüm alanları doldurun.", variant: "destructive" })
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordChangeStatus({ type: "error", message: "Yeni şifreler eşleşmiyor." })
      toast({ title: "Hata", description: "Yeni şifreler eşleşmiyor.", variant: "destructive" })
      return
    }

    if (newPassword.length < 6) {
      setPasswordChangeStatus({ type: "error", message: "Şifre en az 6 karakter olmalıdır." })
      toast({ title: "Hata", description: "Şifre en az 6 karakter olmalıdır.", variant: "destructive" })
      return
    }

    setIsChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setPasswordChangeStatus({
        type: "success",
        message: "✓ Şifreniz başarıyla değiştirildi! Artık yeni şifrenizle giriş yapabilirsiniz.",
      })
      toast({ title: "Başarılı", description: "Şifreniz başarıyla değiştirildi." })

      // Clear success message after 5 seconds
      setTimeout(() => {
        setPasswordChangeStatus({ type: null, message: "" })
      }, 5000)
    } catch (error: any) {
      console.error("Password change error:", error)
      const errorMessage = error.message || "Şifre değiştirilirken bir hata oluştu."
      setPasswordChangeStatus({ type: "error", message: errorMessage })
      toast({ title: "Hata", description: errorMessage, variant: "destructive" })
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Preferences handlers - now syncs with Supabase
  const handleDarkModeToggle = (enabled: boolean) => {
    const newTheme = enabled ? "dark" : "light"
    setTheme(newTheme)
    toast({ title: "Başarılı", description: `${enabled ? "Koyu" : "Açık"} tema etkinleştirildi ve kaydedildi.` })
  }

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const response = await fetch("/api/user/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })

      if (response.ok) {
        setSessions(sessions.filter((s) => s.id !== sessionId))
        toast({ title: "Başarılı", description: "Oturum sonlandırıldı." })
      } else {
        throw new Error("Oturum sonlandırılamadı")
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Oturum sonlandırılırken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleCompactViewToggle = (enabled: boolean) => {
    setCompactView(enabled)
    localStorage.setItem("compactView", enabled.toString())
    toast({
      title: "Başarılı",
      description: `Kompakt görünüm ${enabled ? "etkinleştirildi" : "devre dışı bırakıldı"}.`,
    })
  }

  const handleAnimationsToggle = (enabled: boolean) => {
    setAnimationsEnabled(enabled)
    localStorage.setItem("animationsEnabled", enabled.toString())
    toast({
      title: "Başarılı",
      description: `Animasyonlar ${enabled ? "etkinleştirildi" : "devre dışı bırakıldı"}.`,
    })
  }

  // Data export handler - Export ALL user data
  const handleDataExport = async () => {
    try {
      if (!user?.id) {
        toast({ title: "Hata", description: "Kullanıcı oturumu bulunamadı", variant: "destructive" })
        return
      }

      toast({ title: "Veriler hazırlanıyor...", description: "Lütfen bekleyin" })

      // Fetch all user data from Supabase
      const [
        { data: credits },
        { data: creditCards },
        { data: accounts },
        { data: paymentHistory },
        { data: riskAnalyses },
        { data: refinancingAnalyses },
        { data: subscription },
        { data: usageTracking },
      ] = await Promise.all([
        supabase.from("credits").select("*").eq("user_id", user.id),
        supabase.from("credit_cards").select("*").eq("user_id", user.id),
        supabase.from("accounts").select("*").eq("user_id", user.id),
        supabase.from("payment_history").select("*").eq("user_id", user.id),
        supabase.from("risk_analyses").select("*").eq("user_id", user.id),
        supabase.from("refinancing_analyses").select("*").eq("user_id", user.id),
        supabase.from("subscriptions").select("*").eq("user_id", user.id),
        supabase.from("usage_tracking").select("*").eq("user_id", user.id),
      ])

      const exportData = {
        exportInfo: {
          exportDate: new Date().toISOString(),
          userName: `${profileData.first_name || ""} ${profileData.last_name || ""}`.trim(),
          email: profileData.email,
          version: "1.0.0",
        },
        profile: profileData,
        financialProfile: financialProfileData,
        credits: credits || [],
        creditCards: creditCards || [],
        accounts: accounts || [],
        paymentHistory: paymentHistory || [],
        riskAnalyses: riskAnalyses || [],
        refinancingAnalyses: refinancingAnalyses || [],
        subscription: subscription || [],
        usageTracking: usageTracking || [],
        statistics: {
          totalCredits: credits?.length || 0,
          totalCreditCards: creditCards?.length || 0,
          totalAccounts: accounts?.length || 0,
          totalPayments: paymentHistory?.length || 0,
          totalRiskAnalyses: riskAnalyses?.length || 0,
        },
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `kreditakip-verilerim-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({ title: "Başarılı", description: "Verileriniz başarıyla dışa aktarıldı." })
    } catch (error) {
      toast({ title: "Hata", description: "Veri dışa aktarılırken bir hata oluştu.", variant: "destructive" })
    }
  }

  // Account deletion handler
  const handleAccountDeletion = async () => {
    if (!confirm("Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
      return
    }

    try {
      // In a real app, you'd call a server endpoint to handle account deletion
      toast({
        title: "Bilgi",
        description: "Hesap silme işlemi için destek ekibiyle iletişime geçin.",
        variant: "destructive",
      })
    } catch (error) {
      toast({ title: "Hata", description: "Hesap silinirken bir hata oluştu.", variant: "destructive" })
    }
  }

  // Load invoices
  useEffect(() => {
    const loadInvoices = async () => {
      if (!user?.id || activeTab !== "subscription") return

      setLoadingInvoices(true)
      try {
        const response = await fetch("/api/subscription/invoices")
        const data = await response.json()

        if (data.success) {
          setInvoices(data.invoices || [])
        }
      } catch (error) {
        console.error("Error loading invoices:", error)
      } finally {
        setLoadingInvoices(false)
      }
    }

    loadInvoices()
  }, [user?.id, activeTab])

  // Cancel subscription handler
  const handleCancelSubscription = async () => {
    setShowCancelDialog(false)
    setIsCancelling(true)
    try {
      if (!user?.id) {
        throw new Error("Kullanıcı bulunamadı")
      }

      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Abonelik İptal Edildi",
          description: "Aboneliğiniz başarıyla iptal edildi. Mevcut dönem sonuna kadar premium özelliklerden yararlanabilirsiniz.",
        })
        window.location.reload()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Abonelik iptal edilirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
    }
  }

  const getAvatarFallbackText = () => {
    if (profileData.first_name && profileData.last_name) {
      return `${profileData.first_name[0]}${profileData.last_name[0]}`.toUpperCase()
    }
    if (profileData.email) {
      return profileData.email[0].toUpperCase()
    }
    return "KT"
  }

  if (authLoading || loadingProfile || subscriptionLoading) {
    return (
      <div className="flex flex-col gap-4 md:gap-6 items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
        <p className="text-lg text-gray-600">Ayarlar yükleniyor...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg text-red-600">{error}</p>
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
      <Card className="bg-gradient-to-r from-slate-600 to-gray-700 text-white border-transparent shadow-xl rounded-xl">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Settings className="h-8 w-8" />
                Hesap ve Sistem Ayarları
              </h2>
              <p className="text-slate-100 text-lg">
                Hesap bilgilerinizi, güvenlik ayarlarınızı ve uygulama tercihlerini yönetin
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                size="lg"
                className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
                onClick={() => {
                  if (activeTab === "profile") handleSaveProfile()
                  if (activeTab === "financial") handleSaveFinancialProfile()
                }}
                disabled={isSaving || isSavingFinancial}
              >
                {isSaving || isSavingFinancial ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5 mr-2" />
                )}
                {isSaving || isSavingFinancial ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modern Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
            <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 bg-transparent h-auto p-2 gap-2">
              <TabsTrigger
                value="profile"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <User className="h-4 w-4" />
                <span className="font-medium">Profil</span>
              </TabsTrigger>
              <TabsTrigger
                value="subscription"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Crown className="h-4 w-4" />
                <span className="font-medium">Abonelik</span>
              </TabsTrigger>
              <TabsTrigger
                value="invoices"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FileText className="h-4 w-4" />
                <span className="font-medium">Faturalar</span>
              </TabsTrigger>
              <TabsTrigger
                value="financial"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">Finansal</span>
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Shield className="h-4 w-4" />
                <span className="font-medium">Güvenlik</span>
              </TabsTrigger>
              <TabsTrigger
                value="preferences"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Settings className="h-4 w-4" />
                <span className="font-medium">Tercihler</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="profile">
              <div className="space-y-6">
                <Card className="dark:bg-gray-900 dark:border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-white">
                      <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      Kişisel Bilgiler
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400">Profil bilgilerinizi güncelleyin</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Profil Fotoğrafı */}
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={avatarPreview || profileData.avatar_url || ""} />
                        <AvatarFallback className="text-lg">{getAvatarFallbackText()}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <Label htmlFor="avatar" className="cursor-pointer">
                          <div className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 bg-transparent rounded-md transition-colors">
                            {isUploadingAvatar ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Yükleniyor...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4" />
                                <span>Fotoğraf Seç</span>
                              </>
                            )}
                          </div>
                        </Label>
                        <Input
                          id="avatar"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                          disabled={isUploadingAvatar}
                        />
                        <p className="text-xs text-muted-foreground dark:text-gray-400">
                          JPG, PNG, GIF veya WebP. Maksimum 10MB.
                          <br />
                          Seçilen fotoğraf otomatik olarak optimize edilip yüklenecek.
                        </p>
                      </div>
                    </div>

                    {/* Form Alanları */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name" className="dark:text-gray-200">
                          Ad
                        </Label>
                        <Input
                          id="first_name"
                          value={profileData.first_name || ""}
                          onChange={handleInputChange}
                          className="custom-input dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name" className="dark:text-gray-200">
                          Soyad
                        </Label>
                        <Input
                          id="last_name"
                          value={profileData.last_name || ""}
                          onChange={handleInputChange}
                          className="custom-input dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="dark:text-gray-200">
                          E-posta
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <Input
                            id="email"
                            type="email"
                            value={profileData.email || ""}
                            onChange={handleInputChange}
                            className="pl-10 custom-input dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                            disabled
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="dark:text-gray-200">
                          Telefon
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <Input
                            id="phone"
                            value={profileData.phone || ""}
                            onChange={handleInputChange}
                            className="pl-10 custom-input dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="dark:text-gray-200">
                        Adres
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <Textarea
                          id="address"
                          value={profileData.address || ""}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, address: e.target.value }))}
                          className="pl-10 custom-input min-h-[80px] dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          placeholder="Tam adresinizi girin..."
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="subscription">
              <div className="space-y-6">
                {/* Mevcut Plan */}
                <Card className="dark:bg-gray-900 dark:border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-white">
                      <Crown className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      Mevcut Plan
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400">
                      Abonelik durumunuz ve plan bilgileriniz
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 p-6 text-white">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                              <Crown className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold">{isPremium ? "Premium" : "Ücretsiz"} Plan</h3>
                              <p className="text-emerald-100">
                                {isPremium ? "Tüm özelliklere erişim" : "Temel özellikler"}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-white/20 border-white/30 text-white backdrop-blur-sm px-4 py-2">
                            {subscription?.status === "active" ? "Aktif" : subscription?.status || "N/A"}
                          </Badge>
                        </div>

                        {isPremium && subscription?.expiresAt && (
                          <div className="flex items-center gap-2 text-emerald-100">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm">
                              Bitiş Tarihi: {new Date(subscription.expiresAt).toLocaleDateString("tr-TR")}
                            </span>
                          </div>
                        )}

                        {subscription?.plan_id && (
                          <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg">
                            <p className="text-sm font-medium mb-2">Plan Detayları</p>
                            <p className="text-xs text-emerald-100">
                              {subscription.plan_id === "premium-yearly"
                                ? "Yıllık Premium - 1,990₺/yıl"
                                : subscription.plan_id === "premium-monthly"
                                  ? "Aylık Premium - 199₺/ay"
                                  : "Ücretsiz Plan"}
                            </p>
                          </div>
                        )}

                        {/* Kullanım İstatistikleri */}
                        {subscription && (
                          <div className="mt-4 space-y-3">
                            <p className="text-sm font-medium text-emerald-100">Kullanım İstatistikleri</p>
                            <div className="grid grid-cols-1 gap-3">
                              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-medium text-white">OCR Analizi</span>
                                  <Badge variant="outline" className="text-xs bg-white/20 border-white/30 text-white">
                                    {isPremium ? "Sınırsız" : `${subscription.usage?.ocrAnalysis?.used || 0}/${subscription.usage?.ocrAnalysis?.limit || 1}`}
                                  </Badge>
                                </div>
                                <div className="w-full bg-white/20 rounded-full h-2">
                                  <div
                                    className="bg-white h-2 rounded-full transition-all duration-300"
                                    style={{
                                      width: isPremium
                                        ? "100%"
                                        : `${Math.min(100, ((subscription.usage?.ocrAnalysis?.used || 0) / (subscription.usage?.ocrAnalysis?.limit || 1)) * 100)}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-medium text-white">Risk Analizi</span>
                                  <Badge variant="outline" className="text-xs bg-white/20 border-white/30 text-white">
                                    {isPremium ? "Sınırsız" : "Premium Gerekli"}
                                  </Badge>
                                </div>
                                <div className="w-full bg-white/20 rounded-full h-2">
                                  <div
                                    className="bg-white h-2 rounded-full transition-all duration-300"
                                    style={{ width: isPremium ? "100%" : "0%" }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>


                    {/* İptal Uyarısı */}
                    {subscription?.status === "cancelled" && subscription?.expiresAt && (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                          <div>
                            <p className="font-medium text-yellow-900 dark:text-yellow-100">Abonelik İptal Edildi</p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                              Premium özellikleriniz{" "}
                              <strong>
                                {new Date(subscription.expiresAt).toLocaleDateString("tr-TR", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </strong>{" "}
                              tarihine kadar aktif kalacak.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Aksiyonlar */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {!isPremium ? (
                        <Button
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 dark:from-emerald-500 dark:to-teal-600 dark:hover:from-emerald-600 dark:hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all"
                          onClick={() => router.push("/uygulama/premium")}
                        >
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Premium'a Yükselt
                        </Button>
                      ) : subscription?.status === "cancelled" ? (
                        <Button
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 dark:from-emerald-500 dark:to-teal-600 dark:hover:from-emerald-600 dark:hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all"
                          onClick={() => router.push("/uygulama/premium")}
                        >
                          <ArrowUpRight className="h-4 w-4 mr-2" />
                          Yeniden Abone Ol
                        </Button>
                      ) : (
                        <>
                          <Button
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 dark:from-emerald-500 dark:to-teal-600 dark:hover:from-emerald-600 dark:hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all"
                            onClick={() => router.push("/uygulama/premium")}
                          >
                            <ArrowUpRight className="h-4 w-4 mr-2" />
                            Planı Değiştir
                          </Button>
                          <Button
                            variant="outline"
                            className="border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-400 bg-transparent shadow-sm hover:shadow-md transition-all"
                            onClick={() => setShowCancelDialog(true)}
                            disabled={isCancelling}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Aboneliği İptal Et
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Faturalama */}
                <Card className="dark:bg-gray-900 dark:border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-white">
                      <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      Faturalama
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400">
                      Ödeme geçmişinizi ve faturalarınızı görüntüleyin
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700 dark:bg-gray-800/50">
                      <div>
                        <p className="font-medium dark:text-white mb-1">Fatura Geçmişi</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Tüm ödeme işlemlerinizi ve faturalarınızı görüntüleyin
                        </p>
                      </div>
                      <Button
                        onClick={() => router.push("/uygulama/faturalandirma")}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 dark:from-emerald-500 dark:to-teal-600 dark:hover:from-emerald-600 dark:hover:to-teal-700 text-white"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Faturalara Git
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Bilgilendirme */}
                <Alert className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700/50">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <AlertTitle className="text-blue-700 dark:text-blue-300">Abonelik Bilgisi</AlertTitle>
                  <AlertDescription className="text-blue-600 dark:text-blue-400">
                    {isPremium
                      ? "Premium üyeliğiniz aktif. Tüm özelliklere sınırsız erişiminiz var. Aboneliğinizi istediğiniz zaman iptal edebilir veya planınızı değiştirebilirsiniz."
                      : "Ücretsiz plan kullanıyorsunuz. Premium'a yükselterek sınırsız OCR analizi, risk analizi ve reklamsız deneyimin keyfini çıkarabilirsiniz."}
                  </AlertDescription>
                </Alert>

                {/* Cancel Subscription Dialog */}
                <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <DialogTitle className="text-xl">Abonelik İptali</DialogTitle>
                      </div>
                      <DialogDescription className="text-base pt-2">
                        Aboneliğinizi iptal etmek istediğinize emin misiniz?
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <div className="space-y-3">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Mevcut Abonelik:</p>
                          <div className="flex items-center justify-between">
                            <span className="text-base text-gray-700 dark:text-gray-300">
                              {subscription?.plan_id === "premium-yearly" ? "Yıllık Premium" : "Aylık Premium"}
                            </span>
                            <Badge variant="outline">
                              {subscription?.plan_id === "premium-yearly" ? "1,990₺/yıl" : "199₺/ay"}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                                Önemli Bilgiler
                              </p>
                              <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                                <li>• Mevcut dönem sonuna kadar premium özelliklerden yararlanabilirsiniz</li>
                                <li>• İptal işlemi hemen gerçekleşecektir</li>
                                <li>• Otomatik yenileme durdurulacaktır</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter className="sm:space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowCancelDialog(false)}
                        className="border-gray-300 dark:border-gray-700"
                        disabled={isCancelling}
                      >
                        Vazgeç
                      </Button>
                      <Button
                        onClick={handleCancelSubscription}
                        disabled={isCancelling}
                        className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
                      >
                        {isCancelling ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            İptal Ediliyor...
                          </>
                        ) : (
                          "Aboneliği İptal Et"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </TabsContent>

            <TabsContent value="invoices">
              <UserInvoices />
            </TabsContent>

            <TabsContent value="financial">
              <Card className="dark:bg-gray-900 dark:border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    Finansal Bilgiler
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Risk analizi ve finansal planlama için bilgilerinizi girin.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {loadingFinancialProfile ? (
                    <div className="flex justify-center items-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400" />
                      <p className="ml-2 dark:text-gray-300">Finansal bilgiler yükleniyor...</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="monthly_income" className="dark:text-gray-200">
                            Aylık Net Gelir (₺)
                          </Label>
                          <Input
                            id="monthly_income"
                            type="number"
                            placeholder="Örn: 25000"
                            value={financialProfileData.monthly_income ?? ""}
                            onChange={handleFinancialInputChange}
                            className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          />
                          <p className="text-xs text-muted-foreground dark:text-gray-400">
                            Vergi sonrası aylık geliriniz
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="monthly_expenses" className="dark:text-gray-200">
                            Aylık Ortalama Gider (₺)
                          </Label>
                          <Input
                            id="monthly_expenses"
                            type="number"
                            placeholder="Örn: 18000"
                            value={financialProfileData.monthly_expenses ?? ""}
                            onChange={handleFinancialInputChange}
                            className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          />
                          <p className="text-xs text-muted-foreground dark:text-gray-400">
                            Kira, market, faturalar dahil tüm giderler
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="emergency_fund" className="dark:text-gray-200">
                            Acil Durum Fonu (₺)
                          </Label>
                          <Input
                            id="emergency_fund"
                            type="number"
                            placeholder="Örn: 50000"
                            value={financialProfileData.emergency_fund ?? ""}
                            onChange={handleFinancialInputChange}
                            className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          />
                          <p className="text-xs text-muted-foreground dark:text-gray-400">
                            Beklenmedik durumlar için ayrılan para
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="investment_portfolio" className="dark:text-gray-200">
                            Yatırım Portföyü (₺)
                          </Label>
                          <Input
                            id="investment_portfolio"
                            type="number"
                            placeholder="Örn: 75000"
                            value={financialProfileData.investment_portfolio ?? ""}
                            onChange={handleFinancialInputChange}
                            className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          />
                          <p className="text-xs text-muted-foreground dark:text-gray-400">
                            Hisse, fon, altın vb. yatırımlar
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="real_estate_value" className="dark:text-gray-200">
                            Gayrimenkul Değeri (₺)
                          </Label>
                          <Input
                            id="real_estate_value"
                            type="number"
                            placeholder="Örn: 800000"
                            value={financialProfileData.real_estate_value ?? ""}
                            onChange={handleFinancialInputChange}
                            className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          />
                          <p className="text-xs text-muted-foreground dark:text-gray-400">
                            Sahip olduğunuz ev/arsa değeri
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vehicle_value" className="dark:text-gray-200">
                            Araç Değeri (₺)
                          </Label>
                          <Input
                            id="vehicle_value"
                            type="number"
                            placeholder="Örn: 150000"
                            value={financialProfileData.vehicle_value ?? ""}
                            onChange={handleFinancialInputChange}
                            className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          />
                          <p className="text-xs text-muted-foreground dark:text-gray-400">
                            Sahip olduğunuz araçların piyasa değeri
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="credit_card_debt" className="dark:text-gray-200">
                            Kredi Kartı Borcu (₺)
                          </Label>
                          <Input
                            id="credit_card_debt"
                            type="number"
                            placeholder="Örn: 12000"
                            value={financialProfileData.credit_card_debt ?? ""}
                            onChange={handleFinancialInputChange}
                            className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          />
                          <p className="text-xs text-muted-foreground dark:text-gray-400">
                            Toplam kredi kartı borcunuz
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="other_monthly_obligations" className="dark:text-gray-200">
                            Diğer Aylık Yükümlülükler (₺)
                          </Label>
                          <Input
                            id="other_monthly_obligations"
                            type="number"
                            placeholder="Örn: 2500"
                            value={financialProfileData.other_monthly_obligations ?? ""}
                            onChange={handleFinancialInputChange}
                            className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          />
                          <p className="text-xs text-muted-foreground dark:text-gray-400">
                            Nafaka, öğrenim kredisi vb.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="employment_duration_months" className="dark:text-gray-200">
                            Mevcut İşteki Çalışma Süresi (Ay)
                          </Label>
                          <Input
                            id="employment_duration_months"
                            type="number"
                            placeholder="Örn: 36"
                            value={financialProfileData.employment_duration_months ?? ""}
                            onChange={handleFinancialInputChange}
                            className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          />
                          <p className="text-xs text-muted-foreground dark:text-gray-400">
                            Mevcut işyerindeki deneyim süresi
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dependents_count" className="dark:text-gray-200">
                            Bakmakla Yükümlü Kişi Sayısı
                          </Label>
                          <Input
                            id="dependents_count"
                            type="number"
                            placeholder="Örn: 2"
                            value={financialProfileData.dependents_count ?? ""}
                            onChange={handleFinancialInputChange}
                            className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          />
                          <p className="text-xs text-muted-foreground dark:text-gray-400">Çocuk, yaşlı ebeveyn vb.</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="employment_status" className="dark:text-gray-200">
                            Çalışma Durumu
                          </Label>
                          <Select
                            value={financialProfileData.employment_status || ""}
                            onValueChange={(value) => handleSelectChange("employment_status", value)}
                          >
                            <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                              <SelectValue placeholder="Seçiniz..." />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                              <SelectItem value="tam_zamanli">Tam Zamanlı Çalışan</SelectItem>
                              <SelectItem value="yari_zamanli">Yarı Zamanlı Çalışan</SelectItem>
                              <SelectItem value="serbest_calisan">Serbest Çalışan (Freelancer)</SelectItem>
                              <SelectItem value="is_sahibi">İş Sahibi</SelectItem>
                              <SelectItem value="issiz">İşsiz</SelectItem>
                              <SelectItem value="ogrenci">Öğrenci</SelectItem>
                              <SelectItem value="emekli">Emekli</SelectItem>
                              <SelectItem value="diger">Diğer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="housing_status" className="dark:text-gray-200">
                            Konut Durumu
                          </Label>
                          <Select
                            value={financialProfileData.housing_status || ""}
                            onValueChange={(value) => handleSelectChange("housing_status", value)}
                          >
                            <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                              <SelectValue placeholder="Seçiniz..." />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                              <SelectItem value="kira">Kiracı</SelectItem>
                              <SelectItem value="ev_sahibi_kredili">Ev Sahibi (Kredili)</SelectItem>
                              <SelectItem value="ev_sahibi_kredisiz">Ev Sahibi (Kredisiz)</SelectItem>
                              <SelectItem value="aile_yani">Aile Yanında Yaşıyor</SelectItem>
                              <SelectItem value="diger">Diğer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="other_debt_obligations" className="dark:text-gray-200">
                          Diğer Borç Yükümlülükleri
                        </Label>
                        <Textarea
                          id="other_debt_obligations"
                          placeholder="Örn: Kredi kartı borcu, öğrenim kredisi"
                          value={financialProfileData.other_debt_obligations || ""}
                          onChange={handleFinancialInputChange}
                          className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="savings_goals" className="dark:text-gray-200">
                          Tasarruf Hedefleri
                        </Label>
                        <Textarea
                          id="savings_goals"
                          placeholder="Örn: Ev almak, araba almak, emeklilik"
                          value={financialProfileData.savings_goals || ""}
                          onChange={handleFinancialInputChange}
                          className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="risk_tolerance" className="dark:text-gray-200">
                          Risk Toleransı
                        </Label>
                        <Select
                          value={financialProfileData.risk_tolerance || ""}
                          onValueChange={(value) => handleSelectChange("risk_tolerance", value)}
                        >
                          <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                            <SelectValue placeholder="Seçiniz..." />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                            <SelectItem value="dusuk">Düşük</SelectItem>
                            <SelectItem value="orta">Orta</SelectItem>
                            <SelectItem value="yuksek">Yüksek</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="pt-4">
                        <Button
                          variant="outline"
                          className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 bg-transparent"
                          onClick={handleSaveFinancialProfile}
                          disabled={isSavingFinancial}
                        >
                          {isSavingFinancial ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          {isSavingFinancial ? "Kaydediliyor..." : "Finansal Bilgileri Kaydet"}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              <Alert
                variant="default"
                className="mt-6 bg-sky-50 border-sky-200 dark:bg-sky-900/30 dark:border-sky-700/50"
              >
                <Info className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                <AlertTitle className="text-sky-700 dark:text-sky-300">Bilgilendirme</AlertTitle>
                <AlertDescription className="text-sky-600 dark:text-sky-400">
                  Burada girdiğiniz finansal bilgiler, size özel risk analizi ve finansal öneriler sunmak amacıyla
                  kullanılacaktır. Bilgileriniz gizli tutulur ve yalnızca uygulama içinde analiz amaçlı kullanılır.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="security">
              <div className="space-y-6">
                {/* Şifre Değiştirme */}
                <Card className="dark:bg-gray-900 dark:border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-white">
                      <Key className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      Şifre Değiştir
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400">
                      Hesabınızın güvenliği için güçlü bir şifre kullanın
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password" className="dark:text-gray-200">
                        Mevcut Şifre
                      </Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Mevcut şifrenizi girin"
                          className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="dark:text-gray-200">
                        Yeni Şifre
                      </Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Yeni şifrenizi girin"
                          className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="dark:text-gray-200">
                        Yeni Şifre (Tekrar)
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Yeni şifrenizi tekrar girin"
                          className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <Button onClick={handlePasswordChange} disabled={isChangingPassword}>
                      {isChangingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {isChangingPassword ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
                    </Button>

                    {/* Password Change Status Feedback */}
                    {passwordChangeStatus.type && (
                      <Alert
                        className={
                          passwordChangeStatus.type === "success"
                            ? "border-green-500 bg-green-50 dark:bg-green-950 dark:border-green-700"
                            : "border-red-500 bg-red-50 dark:bg-red-950 dark:border-red-700"
                        }
                      >
                        {passwordChangeStatus.type === "success" ? (
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        )}
                        <AlertDescription
                          className={
                            passwordChangeStatus.type === "success"
                              ? "text-green-800 dark:text-green-200"
                              : "text-red-800 dark:text-red-200"
                          }
                        >
                          {passwordChangeStatus.message}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Oturum Geçmişi */}
                <Card className="dark:bg-gray-900 dark:border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-white">
                      <Monitor className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      Aktif Oturumlar
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400">
                      Hesabınıza bağlı cihazları görüntüleyin ve yönetin
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingSessions ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400" />
                      </div>
                    ) : sessions.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">Aktif oturum bulunamadı</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {sessions.map((session) => (
                          <div
                            key={session.id}
                            className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700 dark:bg-gray-800/50"
                          >
                            <div className="flex items-center gap-3">
                              <Monitor className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                              <div>
                                <p className="font-medium flex items-center gap-2 dark:text-white">
                                  {session.device}
                                  {session.is_current && <Badge variant="secondary">Mevcut</Badge>}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <Location className="h-3 w-3" />
                                  {session.location}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {session.lastActive}
                                </p>
                              </div>
                            </div>
                            {!session.is_current && (
                              <Button
                                variant="outline"
                                className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 bg-transparent"
                                size="sm"
                                onClick={() => handleRevokeSession(session.id)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Sonlandır
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Hesap Silme */}
                <Card className="border-red-200 dark:border-red-700/50 dark:bg-gray-900">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                      <AlertTriangle className="h-5 w-5" />
                      Tehlikeli Bölge
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400">
                      Bu işlemler geri alınamaz. Dikkatli olun.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-700/50 rounded-lg bg-red-50 dark:bg-red-900/30">
                      <div>
                        <p className="font-medium text-red-800 dark:text-red-300">Hesabı Sil</p>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          Hesabınızı ve tüm verilerinizi kalıcı olarak silin. Bu işlem geri alınamaz.
                        </p>
                      </div>
                      <Button variant="destructive" onClick={handleAccountDeletion}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hesabı Sil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="preferences">
              <div className="space-y-6">
                {/* Görünüm Ayarları */}
                <Card className="dark:bg-gray-900 dark:border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-white">
                      <Monitor className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      Görünüm Ayarları
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400">Uygulama görünümünü özelleştirin</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium dark:text-white">Koyu Tema</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Gözlerinizi yormaması için koyu tema kullanın
                        </p>
                      </div>
                      <Switch checked={theme === "dark"} onCheckedChange={handleDarkModeToggle} />
                    </div>
                    <Separator className="dark:bg-gray-700" />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium dark:text-white">Kompakt Görünüm</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Daha fazla bilgiyi aynı alanda görün</p>
                      </div>
                      <Switch checked={compactView} onCheckedChange={handleCompactViewToggle} />
                    </div>
                    <Separator className="dark:bg-gray-700" />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium dark:text-white">Animasyonlar</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Geçiş animasyonlarını etkinleştirin</p>
                      </div>
                      <Switch checked={animationsEnabled} onCheckedChange={handleAnimationsToggle} />
                    </div>
                  </CardContent>
                </Card>

                {/* Bildirim Ayarları */}
                <Card className="dark:bg-gray-900 dark:border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-white">
                      <Bell className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      Bildirim Ayarları
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400">
                      Detaylı bildirim tercihlerinizi yönetin
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700 dark:bg-gray-800/50">
                      <div>
                        <p className="font-medium dark:text-white">Gelişmiş Bildirim Ayarları</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          E-posta hatırlatıcıları, zaman ayarları ve test fonksiyonları
                        </p>
                      </div>
                      <Button onClick={() => router.push("/uygulama/odeme-plani?tab=hatirlatici")}>
                        <Bell className="h-4 w-4 mr-2" />
                        Bildirim Ayarlarına Git
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Veri Yönetimi */}
                <Card className="dark:bg-gray-900 dark:border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-white">
                      <Download className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      Veri Yönetimi
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400">
                      Verilerinizi yönetin ve dışa aktarın
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700 dark:bg-gray-800/50">
                      <div className="flex-1">
                        <p className="font-medium dark:text-white flex items-center gap-2">
                          <Download className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          Verilerimi Dışa Aktar
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Tüm kredilerinizi, kredi kartlarınızı, hesaplarınızı, ödeme geçmişinizi, risk
                          analizlerinizi ve profil bilgilerinizi JSON formatında yedekleyin
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded">
                            Krediler
                          </span>
                          <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded">
                            Kredi Kartları
                          </span>
                          <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded">
                            Hesaplar
                          </span>
                          <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded">
                            Ödeme Geçmişi
                          </span>
                          <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded">
                            Risk Analizleri
                          </span>
                        </div>
                      </div>
                      <Button onClick={handleDataExport} className="ml-4">
                        <Download className="h-4 w-4 mr-2" />
                        Dışa Aktar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
