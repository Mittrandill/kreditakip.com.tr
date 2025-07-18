"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Key, Building2, Shield, Zap, Clock, Plus } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { BankSelector } from "@/components/bank-selector"
import { createBankingCredential, type BankingCredentialInput } from "@/lib/api/banking-credentials"
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

export default function SifreEklePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showBankModal, setShowBankModal] = useState(false)
  const [banks, setBanks] = useState<any[]>([])

  // Form state
  const [formData, setFormData] = useState<BankingCredentialInput>({
    bank_id: "",
    credential_name: "",
    username: "",
    password: "",
    credential_type: "internet_banking",
    notes: "",
    password_change_frequency_days: undefined,
  })

  const [selectedBankName, setSelectedBankName] = useState("")

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
    if (!formData.credential_name.trim()) newErrors.credential_name = "Şifre adı zorunludur"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleBankSelect = (bankName: string) => {
    const selectedBank = banks.find((bank) => bank.name === bankName)
    if (selectedBank) {
      handleInputChange("bank_id", selectedBank.id)
      setSelectedBankName(selectedBank.name)
    }
    setShowBankModal(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Hata",
        description: "Kullanıcı oturumu bulunamadı",
        variant: "destructive",
      })
      return
    }

    if (!validateForm()) {
      toast({
        title: "Form Hatası",
        description: "Lütfen tüm zorunlu alanları doğru şekilde doldurunuz",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await createBankingCredential(user.id, formData)

      toast({
        title: "Başarılı",
        description: "Şifre bilgisi başarıyla eklendi",
      })

      router.push("/uygulama/sifrelerim")
    } catch (error: any) {
      console.error("Error creating credential:", error)
      toast({
        title: "Hata",
        description: `Şifre eklenirken bir hata oluştu: ${error.message || "Bilinmeyen hata"}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="overflow-hidden border-0 shadow-xl rounded-2xl">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white relative">
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
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Yeni Şifre Ekle</h1>
                <p className="text-blue-100 text-lg">Bankacılık şifre bilgilerinizi güvenli bir şekilde kaydedin</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <div className="flex items-center gap-2 text-blue-100">
                  <Shield className="h-5 w-5" />
                  <span>Güvenli Veri</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <div className="flex items-center gap-2 text-blue-100">
                  <Zap className="h-5 w-5" />
                  <span>Hızlı Ekleme</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <div className="flex items-center gap-2 text-blue-100">
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
          {/* Temel Bilgiler */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-blue-600" />
                  Temel Şifre Bilgileri
                </CardTitle>
                <CardDescription>Şifre bilgilerinizin temel detaylarını giriniz</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Banka *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between h-10 bg-transparent"
                      onClick={() => setShowBankModal(true)}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{selectedBankName || "Banka seçiniz"}</span>
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
                    <Label htmlFor="password">Şifre</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      placeholder="Şifrenizi girin"
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
          </div>

          {/* Özet Kartı */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Şifre Özeti</CardTitle>
                <CardDescription>Girilen bilgilerin özeti</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Banka:</span>
                    <span className="font-medium">{selectedBankName || "Seçilmedi"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Şifre Türü:</span>
                    <span className="font-medium">{credentialTypeLabels[formData.credential_type]}</span>
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
                    <span className="text-gray-600">Şifre:</span>
                    <span className="font-medium">{formData.password ? "••••••••" : "Girilmedi"}</span>
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
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Ekleniyor...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Şifre Ekle
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
      {showBankModal && (
        <BankSelector banks={banks} onBankSelect={handleBankSelect} onSkip={() => setShowBankModal(false)} />
      )}
    </div>
  )
}
