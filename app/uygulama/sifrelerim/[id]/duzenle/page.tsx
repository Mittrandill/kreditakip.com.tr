"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Loader2, Building2, Info, AlertTriangle, Edit } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { BankSelector, type Bank } from "@/components/bank-selector"
import {
  getBankingCredential,
  updateBankingCredential,
  type BankingCredential,
  type BankingCredentialInput,
} from "@/lib/api/banking-credentials"

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !credential) return

    if (!formData.bank_id || !formData.credential_name) {
      toast({
        title: "Hata",
        description: "Lütfen gerekli alanları doldurun.",
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
    <div className="flex flex-col gap-4 md:gap-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/uygulama/sifrelerim">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Şifre Düzenle</h1>
          <p className="text-gray-600">{credential.credential_name}</p>
        </div>
      </div>

      {/* Güvenlik Bilgisi */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          Şifre alanını boş bırakırsanız mevcut şifreniz değişmez. Sadece değiştirmek istediğiniz alanları güncelleyin.
        </AlertDescription>
      </Alert>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-600" />
            Şifre Bilgilerini Düzenle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Banka Seçimi */}
            <div className="space-y-2">
              <Label htmlFor="bank">Banka *</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between bg-transparent"
                onClick={() => setShowBankList(true)}
              >
                {selectedBank ? selectedBank.name : "Banka seçin..."}
                <Building2 className="h-4 w-4 ml-2 shrink-0 opacity-60" />
              </Button>

              {showBankList && (
                <BankSelector
                  onBankSelect={(bank) => {
                    setSelectedBank(bank)
                    setFormData((prev) => ({ ...prev, bank_id: bank.id }))
                    setShowBankList(false)
                  }}
                  onSkip={() => setShowBankList(false)}
                />
              )}
            </div>

            {/* Şifre Adı */}
            <div className="space-y-2">
              <Label htmlFor="credential_name">Şifre Adı *</Label>
              <Input
                id="credential_name"
                value={formData.credential_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, credential_name: e.target.value }))}
                placeholder="Örn: İş Bankası İnternet Şifresi"
                required
              />
            </div>

            {/* Şifre Türü */}
            <div className="space-y-2">
              <Label htmlFor="credential_type">Şifre Türü</Label>
              <Select
                value={formData.credential_type}
                onValueChange={(value: any) => setFormData((prev) => ({ ...prev, credential_type: value }))}
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

            {/* Kullanıcı Adı */}
            <div className="space-y-2">
              <Label htmlFor="username">Kullanıcı Adı</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                placeholder="Kullanıcı adı veya müşteri numarası"
              />
            </div>

            {/* Şifre */}
            <div className="space-y-2">
              <Label htmlFor="password">Yeni Şifre (Değiştirmek için girin)</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Yeni şifre (boş bırakılırsa değişmez)"
              />
            </div>

            {/* Şifre Değişim Sıklığı */}
            <div className="space-y-2">
              <Label htmlFor="password_frequency">Şifre Değişim Sıklığı (İsteğe Bağlı)</Label>
              <Select
                value={formData.password_change_frequency_days?.toString() || "0"}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    password_change_frequency_days: value ? Number.parseInt(value) : undefined,
                  }))
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
              <p className="text-sm text-gray-500">Seçilen süre sonunda şifre değiştirme hatırlatması alırsınız.</p>
            </div>

            {/* Notlar */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Ek bilgiler, hatırlatmalar..."
                rows={3}
              />
            </div>

            {/* Uyarı */}
            <Alert className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                Şifre değiştirirseniz son değiştirme tarihi otomatik olarak güncellenecektir.
              </AlertDescription>
            </Alert>

            {/* Butonlar */}
            <div className="flex gap-4 pt-4">
              <Link href="/uygulama/sifrelerim" className="flex-1">
                <Button type="button" variant="outline" className="w-full bg-transparent">
                  İptal
                </Button>
              </Link>
              <Button type="submit" disabled={formLoading} className="flex-1">
                {formLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit className="mr-2 h-4 w-4" />}
                {formLoading ? "Güncelleniyor..." : "Güncelle"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
