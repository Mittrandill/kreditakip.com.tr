"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Loader2, Building2, Info, AlertTriangle, Edit, Shield, Zap, Clock } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { BankSelector, type Bank } from "@/components/bank-selector"
import {
  getBankingCredential,
  updateBankingCredential,
  type BankingCredential,
  type BankingCredentialInput,
} from "@/lib/api/banking-credentials"
import { supabase } from "@/lib/supabase"

const credentialTypeLabels = {
  internet_banking: "İnternet Bankacılığı",
  mobile_banking: "Mobil Bankacılık",
  phone_banking: "Telefon Bankacılığı",
  other: "Diğer",
}

const frequencyOptions = [
  { value: 30, label: "30 gün" },
  { value: 60, label: "60 gün" },
  { value: 90, label: "90 gün" },
  { value: 180, label: "6 ay" },
  { value: 365, label: "1 yıl" },
]

export default function SifreDuzenlePage() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const credentialId = params.id as string

  const [credential, setCredential] = useState<BankingCredential | null>(null)
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null)
  const [showBankList, setShowBankList] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [banks, setBanks] = useState<any[]>([])

  // Form state
  const [formData, setFormData] = useState<Partial<BankingCredentialInput>>({
    bank_id: "",
    credential_name: "",
    username: "",
    password: "",
    credential_type: "internet_banking",
    notes: "",
    password_change_frequency_days: undefined,
  })

  // Load banks on component mount
  useEffect(() => {
    const loadBanks = async () => {
      try {
        const { data } = await supabase.from("banks").select("id, name, category, logo_url").order("name")
        if (data) setBanks(data)
      } catch (error) {
        console.error("Error loading banks:", error)
      }
    }
    loadBanks()
  }, [])

  useEffect(() => {
    if (user && !authLoading && credentialId) {
      loadCredential()
    }
  }, [user, authLoading, credentialId])

  const loadCredential = async () => {
    if (!user) return

    try {
      setLoading(true)
      const data = await getBankingCredential(user.id, credentialId)

      if (!data) {
        toast({
          title: "Hata",
          description: "Şifre bilgisi bulunamadı.",
          variant: "destructive",
        })
        router.push("/uygulama/sifrelerim")
        return
      }

      setCredential(data)
      setFormData({
        bank_id: data.bank_id,
        credential_name: data.credential_name,
        username: data.username || "",
        password: "", // Güvenlik için şifreyi boş bırak
        credential_type: data.credential_type,
        notes: data.notes || "",
        password_change_frequency_days: data.password_change_frequency_days || undefined,
      })

      if (data.bank_name) {
        setSelectedBank({
          id: data.bank_id,
          name: data.bank_name,
          logo_url: data.bank_logo_url,
          category: "",
          is_active: true,
          created_at: "",
          updated_at: "",
        })
      }
    } catch (error: any) {
      console.error("Credential loading error:", error)
      toast({
        title: "Hata",
        description: "Şifre bilgisi yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
      router.push("/uygulama/sifrelerim")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof BankingCredentialInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.bank_id) newErrors.bank_id = "Banka seçimi zorunludur"
    if (!formData.credential_name?.trim()) newErrors.credential_name = "Şifre adı zorunludur"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleBankSelect = (bank: Bank) => {
    setSelectedBank(bank)
    handleInputChange("bank_id", bank.id)
    setShowBankList(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !credential) return

    if (!validateForm()) {
      toast({
        title: "Form Hatası",
        description: "Lütfen tüm zorunlu alanları doğru şekilde doldurunuz",
        variant: "destructive",
      })
      return
    }

    try {
      setFormLoading(true)

      await updateBankingCredential(user.id, credential.id, formData)

      toast({
        title: "Başarılı",
        description: "Şifre bilgisi güncellendi.",
      })

      router.push("/uygulama/sifrelerim")
    } catch (error: any) {
      console.error("Form submission error:", error)
      toast({
        title: "Hata",
        description: error.message || "İşlem sırasında bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex flex-col gap-4 md:gap-6 items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
        <p className="text-lg text-gray-600">Yükleniyor...</p>
      </div>
    )
  }

  if (!user) {
    router.push("/giris")
    return null
  }

  if (!credential) {
    return null
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
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Şifre Düzenle</h1>
                <p className="text-emerald-100 text-lg">{credential.credential_name}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-100">
                  <Shield className="h-5 w-5" />
                  <span>Güvenli Düzenleme</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-100">
                  <Zap className="h-5 w-5" />
                  <span>Hızlı Güncelleme</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-100">
                  <Clock className="h-5 w-5" />
                  <span>Otomatik Kayıt</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Güvenlik Bilgisi */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          Şifre alanını boş bırakırsanız mevcut şifreniz değişmez. Sadece değiştirmek istediğiniz alanları güncelleyin.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Temel Bilgiler */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-emerald-600" />
                  Temel Şifre Bilgileri
                </CardTitle>
                <CardDescription>Şifre bilgilerinizin temel detaylarını güncelleyin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Banka *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between h-10 bg-transparent"
                      onClick={() => setShowBankList(true)}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{selectedBank ? selectedBank.name : "Banka seçin..."}</span>
                      </div>
                    </Button>
                    {errors.bank_id && <p className="text-sm text-red-600">{errors.bank_id}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="credential_type">Şifre Türü</Label>
                    <Select
                      value={formData.credential_type}
                      onValueChange={(value: any) => handleInputChange("credential_type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(credentialTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="credential_name">Şifre Adı *</Label>
                    <Input
                      id="credential_name"
                      value={formData.credential_name}
                      onChange={(e) => handleInputChange("credential_name", e.target.value)}
                      placeholder="Örn: İş Bankası İnternet Şifresi"
                    />
                    {errors.credential_name && <p className="text-sm text-red-600">{errors.credential_name}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Giriş Bilgileri */}
            <Card>
              <CardHeader>
                <CardTitle>Giriş Bilgileri</CardTitle>
                <CardDescription>Kullanıcı adı ve şifre bilgileriniz</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Kullanıcı Adı</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => handleInputChange("username", e.target.value)}
                      placeholder="Kullanıcı adı veya müşteri numarası"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Yeni Şifre (Değiştirmek için girin)</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      placeholder="Yeni şifre (boş bırakılırsa değişmez)"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ek Bilgiler */}
            <Card>
              <CardHeader>
                <CardTitle>Ek Bilgiler</CardTitle>
                <CardDescription>İsteğe bağlı ek şifre bilgileri</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password_frequency">Şifre Değişim Sıklığı (İsteğe Bağlı)</Label>
                    <Select
                      value={formData.password_change_frequency_days?.toString() || "0"}
                      onValueChange={(value) =>
                        handleInputChange("password_change_frequency_days", value ? Number.parseInt(value) : undefined)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Şifre değişim sıklığı seçin..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Belirtilmemiş</SelectItem>
                        {frequencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500">
                      Seçilen süre sonunda şifre değiştirme hatırlatması alırsınız.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notlar</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      placeholder="Ek bilgiler, hatırlatmalar..."
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Uyarı */}
            <Alert className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                Şifre değiştirirseniz son değiştirme tarihi otomatik olarak güncellenecektir.
              </AlertDescription>
            </Alert>
          </div>

          {/* Özet Kartı */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Şifre Özeti</CardTitle>
                <CardDescription>Güncellenecek bilgilerin özeti</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Banka:</span>
                    <span className="font-medium">{selectedBank?.name || "Seçilmedi"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Şifre Türü:</span>
                    <span className="font-medium">
                      {credentialTypeLabels[formData.credential_type || "internet_banking"]}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Şifre Adı:</span>
                    <span className="font-medium">{formData.credential_name || "Girilmedi"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Kullanıcı Adı:</span>
                    <span className="font-medium">{formData.username || "Girilmedi"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Yeni Şifre:</span>
                    <span className="font-medium">{formData.password ? "••••••••" : "Değişmeyecek"}</span>
                  </div>
                  {formData.password_change_frequency_days && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Değişim Sıklığı:</span>
                      <span className="font-medium">
                        {frequencyOptions.find((opt) => opt.value === formData.password_change_frequency_days)?.label}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-4 space-y-3">
                  <Button type="submit" className="w-full" disabled={formLoading}>
                    {formLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Güncelleniyor...
                      </>
                    ) : (
                      <>
                        <Edit className="mr-2 h-4 w-4" />
                        Güncelle
                      </>
                    )}
                  </Button>

                  <Link href="/uygulama/sifrelerim" className="block">
                    <Button type="button" variant="outline" className="w-full bg-transparent">
                      İptal
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Modals */}
      {showBankList && (
        <BankSelector banks={banks} onBankSelect={handleBankSelect} onSkip={() => setShowBankList(false)} />
      )}
    </div>
  )
}
