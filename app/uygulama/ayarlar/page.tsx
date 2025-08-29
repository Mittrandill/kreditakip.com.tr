"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
  User,
  DollarSign,
  Shield,
  Settings,
  Bell,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  Loader2,
  AlertCircle,
  Info,
  Eye,
  EyeOff,
  Key,
  Smartphone,
  Monitor,
  Globe,
  Download,
  Trash2,
  AlertTriangle,
  Check,
  X,
  Clock,
  LocateIcon as Location,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { getProfile, updateProfile } from "@/lib/auth"
import { getFinancialProfile, upsertFinancialProfile } from "@/lib/api/financials"
import type { Profile, FinancialProfile } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"

export default function AyarlarPage() {
  const { user, profile: initialProfile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [profileData, setProfileData] = useState<Partial<Profile>>({})
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("profile")

  // Güvenlik state'leri
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  // Tercihler state'leri
  const [darkMode, setDarkMode] = useState(false)
  const [language, setLanguage] = useState("tr")
  const [compactView, setCompactView] = useState(false)
  const [animationsEnabled, setAnimationsEnabled] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)

  // Profil fotoğrafı state'leri
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  // Oturum geçmişi (simulated)
  const [sessions] = useState([
    {
      id: "1",
      device: "Chrome - Windows",
      location: "İstanbul, Türkiye",
      lastActive: "Şimdi",
      current: true,
    },
    {
      id: "2",
      device: "Safari - iPhone",
      location: "İstanbul, Türkiye",
      lastActive: "2 saat önce",
      current: false,
    },
    {
      id: "3",
      device: "Chrome - Android",
      location: "Ankara, Türkiye",
      lastActive: "1 gün önce",
      current: false,
    },
  ])

  useEffect(() => {
    let isMounted = true
    const searchParams = new URLSearchParams(window.location.search)
    const tab = searchParams.get("tab")
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

    // Load preferences from localStorage
    if (typeof window !== "undefined") {
      const savedDarkMode = localStorage.getItem("darkMode") === "true"
      const savedLanguage = localStorage.getItem("language") || "tr"
      const savedCompactView = localStorage.getItem("compactView") === "true"
      const savedAnimations = localStorage.getItem("animationsEnabled") !== "false"

      setDarkMode(savedDarkMode)
      setLanguage(savedLanguage)
      setCompactView(savedCompactView)
      setAnimationsEnabled(savedAnimations)

      // Apply dark mode
      if (savedDarkMode) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    }

    return () => {
      isMounted = false
    }
  }, [user, initialProfile, authLoading])

  // Finansal Profil State ve Fonksiyonları
  const [financialProfileData, setFinancialProfileData] = useState<Partial<FinancialProfile>>({})
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

  // Avatar upload handler
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: "Hata", description: "Dosya boyutu 2MB'dan büyük olamaz.", variant: "destructive" })
        return
      }
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile || !user) return

    setIsUploadingAvatar(true)
    try {
      // Dosya uzantısını al
      const fileExt = avatarFile.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      // User ID ile klasör oluştur
      const filePath = `${user.id}/${fileName}`

      console.log("Uploading to path:", filePath)
      console.log("User ID:", user.id)

      const { data, error: uploadError } = await supabase.storage.from("avatars").upload(filePath, avatarFile, {
        cacheControl: "3600",
        upsert: false,
      })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        throw uploadError
      }

      console.log("Upload successful:", data)

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath)

      console.log("Public URL:", publicUrl)

      await updateProfile(user.id, { avatar_url: publicUrl })
      setProfileData((prev) => ({ ...prev, avatar_url: publicUrl }))
      setAvatarFile(null)
      setAvatarPreview(null)

      toast({ title: "Başarılı", description: "Profil fotoğrafınız güncellendi." })
    } catch (error: any) {
      console.error("Avatar upload error:", error)
      toast({
        title: "Hata",
        description: error.message || "Fotoğraf yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  // Password change handler
  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      toast({ title: "Hata", description: "Lütfen tüm alanları doldurun.", variant: "destructive" })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "Hata", description: "Yeni şifreler eşleşmiyor.", variant: "destructive" })
      return
    }

    if (newPassword.length < 6) {
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
      toast({ title: "Başarılı", description: "Şifreniz başarıyla değiştirildi." })
    } catch (error: any) {
      console.error("Password change error:", error)
      toast({ title: "Hata", description: "Şifre değiştirilirken bir hata oluştu.", variant: "destructive" })
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Preferences handlers
  const handleDarkModeToggle = (enabled: boolean) => {
    setDarkMode(enabled)
    localStorage.setItem("darkMode", enabled.toString())
    if (enabled) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    toast({ title: "Başarılı", description: `${enabled ? "Koyu" : "Açık"} tema etkinleştirildi.` })
  }

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang)
    localStorage.setItem("language", lang)
    toast({ title: "Başarılı", description: "Dil tercihiniz kaydedildi." })
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

  // Data export handler
  const handleDataExport = async () => {
    try {
      const exportData = {
        profile: profileData,
        financialProfile: financialProfileData,
        exportDate: new Date().toISOString(),
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

  const getAvatarFallbackText = () => {
    if (profileData.first_name && profileData.last_name) {
      return `${profileData.first_name[0]}${profileData.last_name[0]}`.toUpperCase()
    }
    if (profileData.email) {
      return profileData.email[0].toUpperCase()
    }
    return "KT"
  }

  if (authLoading || loadingProfile) {
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
                Hesap bilgilerinizi, güvenlik ayarlarınızı ve uygulama tercihlerinizi yönetin
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline-white" size="lg" onClick={() => router.push("/uygulama/bildirimler")}>
                <Bell className="h-5 w-5" />
                Bildirimler
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-white text-slate-600 hover:bg-slate-50 border-white"
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-gray-100 bg-gray-50/50">
            <TabsList className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 bg-transparent h-auto p-2 gap-2">
              <TabsTrigger
                value="profile"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <User className="h-4 w-4" />
                <span className="font-medium">Profil</span>
              </TabsTrigger>
              <TabsTrigger
                value="financial"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">Finansal</span>
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <Shield className="h-4 w-4" />
                <span className="font-medium">Güvenlik</span>
              </TabsTrigger>
              <TabsTrigger
                value="preferences"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <Settings className="h-4 w-4" />
                <span className="font-medium">Tercihler</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="profile">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-emerald-600" />
                      Kişisel Bilgiler
                    </CardTitle>
                    <CardDescription>Profil bilgilerinizi güncelleyin</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Profil Fotoğrafı */}
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage
                          src={
                            avatarPreview ||
                            profileData.avatar_url ||
                            "/placeholder.svg?height=80&width=80&text=User" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg"
                          }
                          alt="Profil"
                        />
                        <AvatarFallback>{getAvatarFallbackText()}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <label htmlFor="avatar-upload" className="cursor-pointer">
                              <Camera className="mr-2 h-4 w-4" />
                              Fotoğraf Seç
                            </label>
                          </Button>
                          {avatarFile && (
                            <Button size="sm" onClick={handleAvatarUpload} disabled={isUploadingAvatar}>
                              {isUploadingAvatar ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="mr-2 h-4 w-4" />
                              )}
                              {isUploadingAvatar ? "Yükleniyor..." : "Kaydet"}
                            </Button>
                          )}
                        </div>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                        <p className="text-sm text-gray-500">JPG, PNG veya GIF. Maksimum 2MB.</p>
                      </div>
                    </div>

                    {/* Form Alanları */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">Ad</Label>
                        <Input
                          id="first_name"
                          value={profileData.first_name || ""}
                          onChange={handleInputChange}
                          className="custom-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Soyad</Label>
                        <Input
                          id="last_name"
                          value={profileData.last_name || ""}
                          onChange={handleInputChange}
                          className="custom-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">E-posta</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            value={profileData.email || ""}
                            onChange={handleInputChange}
                            className="pl-10 custom-input"
                            disabled
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefon</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="phone"
                            value={profileData.phone || ""}
                            onChange={handleInputChange}
                            className="pl-10 custom-input"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Adres</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Textarea
                          id="address"
                          value={profileData.address || ""}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, address: e.target.value }))}
                          className="pl-10 custom-input min-h-[80px]"
                          placeholder="Tam adresinizi girin..."
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="financial">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                    Finansal Bilgiler
                  </CardTitle>
                  <CardDescription>Risk analizi ve finansal planlama için bilgilerinizi girin.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {loadingFinancialProfile ? (
                    <div className="flex justify-center items-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                      <p className="ml-2">Finansal bilgiler yükleniyor...</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="monthly_income">Aylık Net Gelir (₺)</Label>
                          <Input
                            id="monthly_income"
                            type="number"
                            placeholder="Örn: 25000"
                            value={financialProfileData.monthly_income ?? ""}
                            onChange={handleFinancialInputChange}
                          />
                          <p className="text-xs text-muted-foreground">Vergi sonrası aylık geliriniz</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="monthly_expenses">Aylık Ortalama Gider (₺)</Label>
                          <Input
                            id="monthly_expenses"
                            type="number"
                            placeholder="Örn: 18000"
                            value={financialProfileData.monthly_expenses ?? ""}
                            onChange={handleFinancialInputChange}
                          />
                          <p className="text-xs text-muted-foreground">Kira, market, faturalar dahil tüm giderler</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="emergency_fund">Acil Durum Fonu (₺)</Label>
                          <Input
                            id="emergency_fund"
                            type="number"
                            placeholder="Örn: 50000"
                            value={financialProfileData.emergency_fund ?? ""}
                            onChange={handleFinancialInputChange}
                          />
                          <p className="text-xs text-muted-foreground">Beklenmedik durumlar için ayrılan para</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="investment_portfolio">Yatırım Portföyü (₺)</Label>
                          <Input
                            id="investment_portfolio"
                            type="number"
                            placeholder="Örn: 75000"
                            value={financialProfileData.investment_portfolio ?? ""}
                            onChange={handleFinancialInputChange}
                          />
                          <p className="text-xs text-muted-foreground">Hisse, fon, altın vb. yatırımlar</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="real_estate_value">Gayrimenkul Değeri (₺)</Label>
                          <Input
                            id="real_estate_value"
                            type="number"
                            placeholder="Örn: 800000"
                            value={financialProfileData.real_estate_value ?? ""}
                            onChange={handleFinancialInputChange}
                          />
                          <p className="text-xs text-muted-foreground">Sahip olduğunuz ev/arsa değeri</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vehicle_value">Araç Değeri (₺)</Label>
                          <Input
                            id="vehicle_value"
                            type="number"
                            placeholder="Örn: 150000"
                            value={financialProfileData.vehicle_value ?? ""}
                            onChange={handleFinancialInputChange}
                          />
                          <p className="text-xs text-muted-foreground">Sahip olduğunuz araçların piyasa değeri</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="credit_card_debt">Kredi Kartı Borcu (₺)</Label>
                          <Input
                            id="credit_card_debt"
                            type="number"
                            placeholder="Örn: 12000"
                            value={financialProfileData.credit_card_debt ?? ""}
                            onChange={handleFinancialInputChange}
                          />
                          <p className="text-xs text-muted-foreground">Toplam kredi kartı borcunuz</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="other_monthly_obligations">Diğer Aylık Yükümlülükler (₺)</Label>
                          <Input
                            id="other_monthly_obligations"
                            type="number"
                            placeholder="Örn: 2500"
                            value={financialProfileData.other_monthly_obligations ?? ""}
                            onChange={handleFinancialInputChange}
                          />
                          <p className="text-xs text-muted-foreground">Nafaka, öğrenim kredisi vb.</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="employment_duration_months">Mevcut İşteki Çalışma Süresi (Ay)</Label>
                          <Input
                            id="employment_duration_months"
                            type="number"
                            placeholder="Örn: 36"
                            value={financialProfileData.employment_duration_months ?? ""}
                            onChange={handleFinancialInputChange}
                          />
                          <p className="text-xs text-muted-foreground">Mevcut işyerindeki deneyim süresi</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dependents_count">Bakmakla Yükümlü Kişi Sayısı</Label>
                          <Input
                            id="dependents_count"
                            type="number"
                            placeholder="Örn: 2"
                            value={financialProfileData.dependents_count ?? ""}
                            onChange={handleFinancialInputChange}
                          />
                          <p className="text-xs text-muted-foreground">Çocuk, yaşlı ebeveyn vb.</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="employment_status">Çalışma Durumu</Label>
                          <Select
                            value={financialProfileData.employment_status || ""}
                            onValueChange={(value) => handleSelectChange("employment_status", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seçiniz..." />
                            </SelectTrigger>
                            <SelectContent>
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
                          <Label htmlFor="housing_status">Konut Durumu</Label>
                          <Select
                            value={financialProfileData.housing_status || ""}
                            onValueChange={(value) => handleSelectChange("housing_status", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seçiniz..." />
                            </SelectTrigger>
                            <SelectContent>
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
                        <Label htmlFor="other_debt_obligations">Diğer Borç Yükümlülükleri</Label>
                        <Textarea
                          id="other_debt_obligations"
                          placeholder="Örn: Kredi kartı borcu, öğrenim kredisi"
                          value={financialProfileData.other_debt_obligations || ""}
                          onChange={handleFinancialInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="savings_goals">Tasarruf Hedefleri</Label>
                        <Textarea
                          id="savings_goals"
                          placeholder="Örn: Ev almak, araba almak, emeklilik"
                          value={financialProfileData.savings_goals || ""}
                          onChange={handleFinancialInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="risk_tolerance">Risk Toleransı</Label>
                        <Select
                          value={financialProfileData.risk_tolerance || ""}
                          onValueChange={(value) => handleSelectChange("risk_tolerance", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seçiniz..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dusuk">Düşük</SelectItem>
                            <SelectItem value="orta">Orta</SelectItem>
                            <SelectItem value="yuksek">Yüksek</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="pt-4">
                        <Button onClick={handleSaveFinancialProfile} disabled={isSavingFinancial}>
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5 text-emerald-600" />
                      Şifre Değiştir
                    </CardTitle>
                    <CardDescription>Hesabınızın güvenliği için güçlü bir şifre kullanın</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Mevcut Şifre</Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Mevcut şifrenizi girin"
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
                      <Label htmlFor="new-password">Yeni Şifre</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Yeni şifrenizi girin"
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
                      <Label htmlFor="confirm-password">Yeni Şifre (Tekrar)</Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Yeni şifrenizi tekrar girin"
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
                  </CardContent>
                </Card>

                {/* İki Faktörlü Doğrulama */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-emerald-600" />
                      İki Faktörlü Doğrulama (2FA)
                    </CardTitle>
                    <CardDescription>Hesabınıza ek güvenlik katmanı ekleyin</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">2FA Durumu</p>
                        <p className="text-sm text-gray-500">
                          {twoFactorEnabled ? "İki faktörlü doğrulama etkin" : "İki faktörlü doğrulama devre dışı"}
                        </p>
                      </div>
                      <Switch
                        checked={twoFactorEnabled}
                        onCheckedChange={(checked) => {
                          setTwoFactorEnabled(checked)
                          toast({
                            title: "Başarılı",
                            description: `2FA ${checked ? "etkinleştirildi" : "devre dışı bırakıldı"}.`,
                          })
                        }}
                      />
                    </div>
                    {twoFactorEnabled && (
                      <Alert>
                        <Smartphone className="h-4 w-4" />
                        <AlertTitle>2FA Etkin</AlertTitle>
                        <AlertDescription>
                          İki faktörlü doğrulama etkinleştirildi. Giriş yaparken telefonunuzdaki doğrulama kodunu
                          kullanmanız gerekecek.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Oturum Geçmişi */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-emerald-600" />
                      Aktif Oturumlar
                    </CardTitle>
                    <CardDescription>Hesabınıza bağlı cihazları görüntüleyin ve yönetin</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Monitor className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="font-medium flex items-center gap-2">
                                {session.device}
                                {session.current && <Badge variant="secondary">Mevcut</Badge>}
                              </p>
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <Location className="h-3 w-3" />
                                {session.location}
                              </p>
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {session.lastActive}
                              </p>
                            </div>
                          </div>
                          {!session.current && (
                            <Button variant="outline" size="sm">
                              <X className="h-4 w-4 mr-1" />
                              Sonlandır
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Hesap Silme */}
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                      Tehlikeli Bölge
                    </CardTitle>
                    <CardDescription>Bu işlemler geri alınamaz. Dikkatli olun.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                      <div>
                        <p className="font-medium text-red-800">Hesabı Sil</p>
                        <p className="text-sm text-red-600">
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-emerald-600" />
                      Görünüm Ayarları
                    </CardTitle>
                    <CardDescription>Uygulama görünümünü özelleştirin</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Koyu Tema</p>
                        <p className="text-sm text-gray-500">Gözlerinizi yormaması için koyu tema kullanın</p>
                      </div>
                      <Switch checked={darkMode} onCheckedChange={handleDarkModeToggle} />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Kompakt Görünüm</p>
                        <p className="text-sm text-gray-500">Daha fazla bilgiyi aynı alanda görün</p>
                      </div>
                      <Switch checked={compactView} onCheckedChange={handleCompactViewToggle} />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Animasyonlar</p>
                        <p className="text-sm text-gray-500">Geçiş animasyonlarını etkinleştirin</p>
                      </div>
                      <Switch checked={animationsEnabled} onCheckedChange={handleAnimationsToggle} />
                    </div>
                  </CardContent>
                </Card>

                {/* Dil ve Bölge */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-emerald-600" />
                      Dil ve Bölge
                    </CardTitle>
                    <CardDescription>Dil ve para birimi tercihlerinizi ayarlayın</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Dil</Label>
                      <Select value={language} onValueChange={handleLanguageChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tr">Türkçe</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Para Birimi</Label>
                      <Select defaultValue="try">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="try">Türk Lirası (₺)</SelectItem>
                          <SelectItem value="usd">US Dollar ($)</SelectItem>
                          <SelectItem value="eur">Euro (€)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-emerald-600" />
                      Bildirim Ayarları
                    </CardTitle>
                    <CardDescription>Detaylı bildirim tercihlerinizi yönetin</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-900">Gelişmiş Bildirim Ayarları</p>
                          <p className="text-sm text-blue-700 mt-1">
                            E-posta hatırlatıcıları, zaman ayarları ve test fonksiyonları için ödeme planı sayfasındaki
                            hatırlatıcı sekmesini kullanın.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 border-blue-300 text-blue-700 hover:bg-blue-100 bg-transparent"
                            onClick={() => router.push("/uygulama/odeme-plani?tab=hatirlatici")}
                          >
                            <Bell className="h-4 w-4 mr-2" />
                            Bildirim Ayarlarına Git
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Veri Yönetimi */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5 text-emerald-600" />
                      Veri Yönetimi
                    </CardTitle>
                    <CardDescription>Verilerinizi yönetin ve dışa aktarın</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Verilerimi Dışa Aktar</p>
                        <p className="text-sm text-gray-500">Tüm verilerinizi JSON formatında indirin</p>
                      </div>
                      <Button variant="outline" onClick={handleDataExport}>
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
