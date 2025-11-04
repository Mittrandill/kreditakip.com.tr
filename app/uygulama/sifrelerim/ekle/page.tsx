"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Eye, EyeOff, Shield, Loader2, Plus, Shuffle, AlertCircle, Lock, Clock, Zap } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { createBankingCredential } from "@/app/actions/banking-credentials"
import BankSelector from "@/components/bank-selector"
import Link from "next/link"

interface Bank {
  id: string
  name: string
  logo_url?: string
}

const credentialTypes = [
  { value: "internet_banking", label: "İnternet Bankacılığı" },
  { value: "mobile_banking", label: "Mobil Bankacılık" },
  { value: "phone_banking", label: "Telefon Bankacılığı" },
  { value: "other", label: "Diğer" },
]

const passwordChangeFrequencies = [
  { value: 30, label: "30 gün" },
  { value: 60, label: "60 gün" },
  { value: 90, label: "90 gün" },
  { value: 180, label: "6 ay" },
  { value: 365, label: "1 yıl" },
]

export default function SifreEklePage() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showBankSelector, setShowBankSelector] = useState(false)
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null)

  const [formData, setFormData] = useState({
    credentialName: "",
    bankId: "",
    credentialType: "",
    username: "",
    password: "",
    notes: "",
    passwordChangeFrequency: 90,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData((prev) => ({ ...prev, password }))
    setShowPassword(true)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.credentialName.trim()) {
      newErrors.credentialName = "Şifre adı gereklidir"
    }

    if (!formData.bankId) {
      newErrors.bankId = "Banka seçimi gereklidir"
    }

    if (!formData.credentialType) {
      newErrors.credentialType = "Şifre türü seçimi gereklidir"
    }

    if (!formData.password.trim()) {
      newErrors.password = "Şifre gereklidir"
    } else if (formData.password.length < 4) {
      newErrors.password = "Şifre en az 4 karakter olmalıdır"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Hata",
        description: "Lütfen giriş yapınız.",
        variant: "destructive",
      })
      return
    }

    if (!validateForm()) {
      toast({
        title: "Hata",
        description: "Lütfen tüm gerekli alanları doldurunuz.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      await createBankingCredential(user.id, {
        credential_name: formData.credentialName,
        bank_id: formData.bankId,
        credential_type: formData.credentialType as "internet_banking" | "mobile_banking" | "phone_banking" | "other",
        username: formData.username || undefined,
        password: formData.password,
        notes: formData.notes || undefined,
        password_change_frequency_days: formData.passwordChangeFrequency,
      })

      toast({
        title: "Başarılı",
        description: "Şifre başarıyla eklendi.",
      })

      router.push("/uygulama/sifrelerim")
    } catch (error: any) {
      console.error("Credential creation error:", error)
      toast({
        title: "Hata",
        description: error.message || "Şifre eklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex flex-col gap-4 md:gap-6 items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
        <p className="text-lg text-gray-600">Yükleniyor...</p>
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
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="overflow-hidden border-0 shadow-xl rounded-2xl">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-8 text-white relative">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mt-32 -mr-32"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white opacity-5 rounded-full -mb-20 -ml-20"></div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <Link href="/uygulama/sifrelerim">
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Yeni Şifre Ekle</h1>
                <p className="text-emerald-100 text-lg">
                  Bankacılık şifrelerinizi güvenli bir şekilde kaydedin ve yönetin
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-100">
                  <Shield className="h-5 w-5" />
                  <span>Güvenli Şifreleme</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-100">
                  <Zap className="h-5 w-5" />
                  <span>Kolay Yönetim</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-100">
                  <Clock className="h-5 w-5" />
                  <span>Otomatik Hatırlatma</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Temel Bilgiler */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-emerald-600" />
                  Temel Şifre Bilgileri
                </CardTitle>
                <CardDescription>Şifrenizin temel bilgilerini giriniz</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Şifre Adı */}
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="credentialName">
                      Şifre Adı <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="credentialName"
                      placeholder="Örn: QNB Finansbank İnternet Bankacılığı"
                      value={formData.credentialName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, credentialName: e.target.value }))}
                      className={`h-10 ${errors.credentialName ? "border-red-500" : ""}`}
                    />
                    {errors.credentialName && <p className="text-sm text-red-600">{errors.credentialName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bankId">
                      Banka <span className="text-red-500">*</span>
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowBankSelector(true)}
                      className={`w-full h-10 justify-start text-left font-normal ${errors.bankId ? "border-red-500" : ""}`}
                    >
                      {selectedBank ? selectedBank.name : "Banka seçiniz"}
                    </Button>
                    {errors.bankId && <p className="text-sm text-red-600">{errors.bankId}</p>}
                  </div>

                  {/* Şifre Türü */}
                  <div className="space-y-2">
                    <Label htmlFor="credentialType">
                      Şifre Türü <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.credentialType}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, credentialType: value }))}
                    >
                      <SelectTrigger className={`h-10 ${errors.credentialType ? "border-red-500" : ""}`}>
                        <SelectValue placeholder="Şifre türü seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        {credentialTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.credentialType && <p className="text-sm text-red-600">{errors.credentialType}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Giriş Bilgileri */}
            <Card>
              <CardHeader>
                <CardTitle>Giriş Bilgileri</CardTitle>
                <CardDescription>Kullanıcı adı ve şifre bilgileri</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Kullanıcı Adı */}
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="username">Kullanıcı Adı</Label>
                    <Input
                      id="username"
                      placeholder="Kullanıcı adınız (opsiyonel)"
                      value={formData.username}
                      onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                      className="h-10"
                    />
                  </div>

                  {/* Şifre */}
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="password">
                      Şifre <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Şifrenizi girin"
                          value={formData.password}
                          onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                          className={`h-10 pr-10 ${errors.password ? "border-red-500" : ""}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-10 w-10 p-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateRandomPassword}
                        className="h-10 px-3 bg-transparent"
                        title="Rastgele şifre oluştur"
                      >
                        <Shuffle className="h-4 w-4" />
                      </Button>
                    </div>
                    {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ek Ayarlar */}
            <Card>
              <CardHeader>
                <CardTitle>Ek Ayarlar</CardTitle>
                <CardDescription>Şifre yönetimi ve güvenlik ayarları</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Şifre Değişim Sıklığı */}
                  <div className="space-y-2">
                    <Label htmlFor="passwordChangeFrequency">Şifre Değişim Sıklığı</Label>
                    <Select
                      value={formData.passwordChangeFrequency.toString()}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, passwordChangeFrequency: Number.parseInt(value) }))
                      }
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {passwordChangeFrequencies.map((freq) => (
                          <SelectItem key={freq.value} value={freq.value.toString()}>
                            {freq.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Notlar */}
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="notes">Notlar</Label>
                    <Textarea
                      id="notes"
                      placeholder="Ek notlarınız (opsiyonel)"
                      value={formData.notes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Güvenlik Bilgileri</CardTitle>
                <CardDescription>Şifre güvenliği ve yönetimi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <Shield className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Mevcut şifrelerinizi güvenli bir şekilde saklayın</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <Lock className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Sayısal şifreler de desteklenmektedir</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <Clock className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Otomatik hatırlatmalar ile şifre yönetimi</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Şifrelerinizi düzenli olarak güncelleyin</span>
                  </div>
                </div>

                <Alert className="bg-emerald-50 border-emerald-200">
                  <Shield className="h-4 w-4 text-emerald-600" />
                  <AlertDescription className="text-emerald-700">
                    Tüm şifreleriniz AES-256 şifreleme ile güvenli bir şekilde saklanmaktadır.
                  </AlertDescription>
                </Alert>

                <div className="pt-4 space-y-3">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Şifreyi Kaydet
                      </>
                    )}
                  </Button>

                  <Link href="/uygulama/sifrelerim" className="block">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-transparent border-white/20 hover:bg-white/10 hover:border-white/30"
                    >
                      İptal
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {showBankSelector && (
        <BankSelector
          onBankSelect={(bank) => {
            setSelectedBank(bank)
            setFormData((prev) => ({ ...prev, bankId: bank.id }))
            setShowBankSelector(false)
          }}
          onSkip={() => setShowBankSelector(false)}
        />
      )}
    </div>
  )
}
