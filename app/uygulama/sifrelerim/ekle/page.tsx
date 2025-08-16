"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Eye, EyeOff, Shield, Loader2, Plus, Shuffle, AlertCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { createBankingCredential } from "@/lib/api/banking-credentials"
import { supabase } from "@/lib/supabase"

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

  const [banks, setBanks] = useState<Bank[]>([])
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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

  useEffect(() => {
    loadBanks()
  }, [])

  const loadBanks = async () => {
    try {
      const { data, error } = await supabase.from("banks").select("id, name, logo_url").order("name")

      if (error) throw error
      setBanks(data || [])
    } catch (error) {
      console.error("Banks loading error:", error)
      toast({
        title: "Hata",
        description: "Bankalar yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

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
      const selectedBank = banks.find((b) => b.id === formData.bankId)

      await createBankingCredential(user.id, {
        credential_name: formData.credentialName,
        bank_id: formData.bankId,
        bank_name: selectedBank?.name || "",
        bank_logo_url: selectedBank?.logo_url || null,
        credential_type: formData.credentialType as "internet_banking" | "mobile_banking" | "phone_banking" | "other",
        username: formData.username || null,
        password: formData.password,
        notes: formData.notes || null,
        password_change_frequency_days: formData.passwordChangeFrequency,
        last_password_change_date: new Date().toISOString(),
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
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yeni Şifre Ekle</h1>
          <p className="text-gray-600">Bankacılık şifrenizi güvenli bir şekilde kaydedin</p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Şifre Bilgileri
          </CardTitle>
          <CardDescription>Tüm bilgiler güvenli bir şekilde şifrelenerek saklanacaktır.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Şifre Adı */}
            <div className="space-y-2">
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
              {errors.credentialName && <p className="text-sm text-red-500">{errors.credentialName}</p>}
            </div>

            {/* Banka Seçimi */}
            <div className="space-y-2">
              <Label htmlFor="bankId">
                Banka <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.bankId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, bankId: value }))}
              >
                <SelectTrigger className={`h-10 ${errors.bankId ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="Banka seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.bankId && <p className="text-sm text-red-500">{errors.bankId}</p>}
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
              {errors.credentialType && <p className="text-sm text-red-500">{errors.credentialType}</p>}
            </div>

            {/* Kullanıcı Adı ve Şifre */}
            <div className="space-y-6">
              {/* Kullanıcı Adı */}
              <div className="space-y-2">
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
              <div className="space-y-2">
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
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>
            </div>

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
            <div className="space-y-2">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                placeholder="Ek notlarınız (opsiyonel)"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Güvenlik Uyarısı */}
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                Şifreleriniz güvenli bir şekilde şifrelenerek saklanacaktır. Güçlü şifreler kullanın ve düzenli olarak
                değiştirin.
              </AlertDescription>
            </Alert>

            {/* Form Butonları */}
            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading} className="h-10">
                İptal
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-10 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              >
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
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
