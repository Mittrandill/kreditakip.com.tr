"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Shield,
  Globe,
  Smartphone,
  Phone,
  Settings,
  RefreshCw,
  Info,
  AlertTriangle,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import BankSelector from "@/components/bank-selector"
import {
  getBankingCredential,
  updateBankingCredential,
  decryptPassword,
  type BankingCredential,
  type BankingCredentialInput,
} from "@/lib/api/banking-credentials"
import { createTestPassword, validatePasswordStrength } from "@/lib/utils/encryption"

const credentialTypeOptions = [
  { value: "internet_banking", label: "İnternet Bankacılığı", icon: Globe },
  { value: "mobile_banking", label: "Mobil Bankacılık", icon: Smartphone },
  { value: "phone_banking", label: "Telefon Bankacılığı", icon: Phone },
  { value: "other", label: "Diğer", icon: Settings },
]

export default function SifreDuzenlePage() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const credentialId = params.id as string

  const [credential, setCredential] = useState<BankingCredential | null>(null)
  const [formData, setFormData] = useState<Partial<BankingCredentialInput>>({
    bank_id: "",
    credential_name: "",
    username: "",
    password: "",
    credential_type: "internet_banking",
    notes: "",
    password_change_frequency_days: 90,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [passwordChanged, setPasswordChanged] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [],
    isStrong: false,
  })

  useEffect(() => {
    if (user && credentialId) {
      loadCredential()
    }
  }, [user, credentialId])

  useEffect(() => {
    if (formData.password) {
      const strength = validatePasswordStrength(formData.password)
      setPasswordStrength(strength)
    } else {
      setPasswordStrength({ score: 0, feedback: [], isStrong: false })
    }
  }, [formData.password])

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

      // Decrypt password for editing
      let decryptedPassword = ""
      if (data.encrypted_password) {
        try {
          decryptedPassword = (await decryptPassword(data.encrypted_password)) || ""
        } catch (error) {
          console.error("Password decryption error:", error)
          toast({
            title: "Uyarı",
            description: "Mevcut şifre çözülemedi. Yeni şifre girmeniz gerekebilir.",
            variant: "destructive",
          })
        }
      }

      setFormData({
        bank_id: data.bank_id,
        credential_name: data.credential_name,
        username: data.username || "",
        password: decryptedPassword,
        credential_type: data.credential_type,
        notes: data.notes || "",
        password_change_frequency_days: data.password_change_frequency_days || 90,
      })
    } catch (error: any) {
      console.error("Load credential error:", error)
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

  const handleInputChange = (field: keyof BankingCredentialInput, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    if (field === "password") {
      setPasswordChanged(true)
    }
  }

  const generateTestPassword = () => {
    const testPassword = createTestPassword()
    setFormData((prev) => ({
      ...prev,
      password: testPassword,
    }))
    setPasswordChanged(true)
    toast({
      title: "Test Şifre Oluşturuldu",
      description: "Geliştirme için test şifresi oluşturuldu.",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !credential) {
      toast({
        title: "Hata",
        description: "Gerekli bilgiler eksik.",
        variant: "destructive",
      })
      return
    }

    if (!formData.bank_id || !formData.credential_name) {
      toast({
        title: "Hata",
        description: "Lütfen gerekli alanları doldurunuz.",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      await updateBankingCredential(user.id, credential.id, formData)

      toast({
        title: "Başarılı",
        description: "Şifre bilgisi başarıyla güncellendi.",
      })

      router.push("/uygulama/sifrelerim")
    } catch (error: any) {
      console.error("Update credential error:", error)
      toast({
        title: "Hata",
        description: "Şifre güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
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

  if (!credential) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
        <AlertTriangle className="h-12 w-12 text-orange-500 mb-4" />
        <p className="text-lg text-orange-600">Şifre bilgisi bulunamadı.</p>
        <Link href="/uygulama/sifrelerim">
          <Button className="mt-4">Şifrelerime Dön</Button>
        </Link>
      </div>
    )
  }

  const selectedType = credentialTypeOptions.find((option) => option.value === formData.credential_type)
  const TypeIcon = selectedType?.icon || Settings

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/uygulama/sifrelerim">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Şifre Düzenle</h1>
          <p className="text-gray-600">{credential.credential_name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Sol Kolon - Temel Bilgiler */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TypeIcon className="h-5 w-5" />
                Temel Bilgiler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Banka Seçimi */}
              <div className="space-y-2">
                <Label htmlFor="bank">Banka *</Label>
                <BankSelector
                  value={formData.bank_id || ""}
                  onValueChange={(value) => handleInputChange("bank_id", value)}
                  placeholder="Banka seçiniz..."
                />
              </div>

              {/* Şifre Adı */}
              <div className="space-y-2">
                <Label htmlFor="credential_name">Şifre Adı *</Label>
                <Input
                  id="credential_name"
                  value={formData.credential_name || ""}
                  onChange={(e) => handleInputChange("credential_name", e.target.value)}
                  placeholder="Örn: İş Bankası İnternet Şifresi"
                  required
                />
              </div>

              {/* Şifre Türü */}
              <div className="space-y-2">
                <Label htmlFor="credential_type">Şifre Türü</Label>
                <Select
                  value={formData.credential_type || "internet_banking"}
                  onValueChange={(value) => handleInputChange("credential_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {credentialTypeOptions.map((option) => {
                      const Icon = option.icon
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Kullanıcı Adı */}
              <div className="space-y-2">
                <Label htmlFor="username">Kullanıcı Adı</Label>
                <Input
                  id="username"
                  value={formData.username || ""}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  placeholder="Kullanıcı adınız (opsiyonel)"
                />
              </div>
            </CardContent>
          </Card>

          {/* Sağ Kolon - Şifre ve Güvenlik */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Şifre ve Güvenlik
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Şifre */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Şifre</Label>
                  {process.env.NODE_ENV === "development" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateTestPassword}
                      className="text-xs bg-transparent"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Test Şifre
                    </Button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password || ""}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="Şifrenizi girin"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Şifre Gücü Göstergesi */}
                {formData.password && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Şifre Gücü</span>
                      <span className={passwordStrength.isStrong ? "text-green-600" : "text-orange-600"}>
                        {passwordStrength.score}/5
                      </span>
                    </div>
                    <Progress value={(passwordStrength.score / 5) * 100} className="h-2" />
                    {passwordStrength.feedback.length > 0 && (
                      <div className="text-xs text-gray-600">
                        <p>Öneriler:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {passwordStrength.feedback.map((feedback, index) => (
                            <li key={index}>{feedback}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {passwordChanged && (
                  <Alert className="bg-yellow-50 border-yellow-200">
                    <Info className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      Şifre değiştirildi. Kaydettiğinizde son değiştirme tarihi güncellenecek.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Şifre Değiştirme Sıklığı */}
              <div className="space-y-2">
                <Label htmlFor="password_change_frequency">Şifre Değiştirme Sıklığı (Gün)</Label>
                <Select
                  value={formData.password_change_frequency_days?.toString() || "90"}
                  onValueChange={(value) => handleInputChange("password_change_frequency_days", Number.parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 Gün</SelectItem>
                    <SelectItem value="60">60 Gün</SelectItem>
                    <SelectItem value="90">90 Gün</SelectItem>
                    <SelectItem value="180">180 Gün</SelectItem>
                    <SelectItem value="365">1 Yıl</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Bu süre sonunda şifre değiştirme hatırlatması alacaksınız.</p>
              </div>

              {/* Notlar */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notlar</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Ek notlarınız (opsiyonel)"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Güvenlik Uyarısı */}
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Güvenlik:</strong> Şifreleriniz güçlü şifreleme ile korunmaktadır. Değişiklikler kaydedildikten
            sonra eski şifre geri alınamaz.
          </AlertDescription>
        </Alert>

        {/* Form Butonları */}
        <div className="flex gap-4 pt-4">
          <Link href="/uygulama/sifrelerim">
            <Button type="button" variant="outline" disabled={saving}>
              İptal
            </Button>
          </Link>
          <Button type="submit" disabled={saving || !formData.bank_id || !formData.credential_name}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Güncelleniyor...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Değişiklikleri Kaydet
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
