"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Wallet, Building2, Loader2, AlertCircle, CheckCircle, Shield, Zap, Clock } from "lucide-react"

import { useAuth } from "@/hooks/use-auth"
import { getAccount, updateAccount, getBankIdByName, type Account } from "@/lib/api/accounts"
import { useToast } from "@/hooks/use-toast"
import BankSelector from "@/components/bank-selector"
import { AccountTypeSelector } from "@/components/account-type-selector"

export default function HesapDuzenlePage() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const accountId = params.id as string

  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showBankSelector, setShowBankSelector] = useState(false)
  const [showAccountTypeSelector, setShowAccountTypeSelector] = useState(false)
  const [selectedAccountType, setSelectedAccountType] = useState<any>(null)

  const [formData, setFormData] = useState({
    account_name: "",
    bank_name: "",
    account_number: "",
    iban: "",
    account_type: "",
    current_balance: "",
    currency: "TRY",
    overdraft_limit: "",
    overdraft_interest_rate: "",
    interest_rate: "",
    notes: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (accountId) {
      fetchAccount()
    }
  }, [accountId])

  const fetchAccount = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAccount(accountId)
      if (data) {
        setAccount(data)
        setFormData({
          account_name: data.account_name || "",
          bank_name: (data as any).banks?.name || "",
          account_number: data.account_number || "",
          iban: data.iban || "",
          account_type: data.account_type || "",
          current_balance: data.current_balance?.toString() || "0",
          currency: data.currency || "TRY",
          overdraft_limit: data.overdraft_limit?.toString() || "0",
          overdraft_interest_rate: data.overdraft_interest_rate?.toString() || "0",
          interest_rate: data.interest_rate?.toString() || "0",
          notes: data.notes || "",
        })
        setSelectedAccountType({
          name: data.account_type,
          category: "Bireysel Mevduat", // Default category
        })
      }
    } catch (err: any) {
      setError("Hesap bilgileri yüklenirken bir sorun oluştu.")
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.account_name.trim()) {
      newErrors.account_name = "Hesap adı gereklidir"
    }

    if (!formData.bank_name.trim()) {
      newErrors.bank_name = "Banka adı gereklidir"
    }

    if (!formData.account_type) {
      newErrors.account_type = "Hesap türü seçilmelidir"
    }

    if (formData.current_balance && isNaN(Number(formData.current_balance))) {
      newErrors.current_balance = "Geçerli bir bakiye giriniz"
    }

    if (formData.overdraft_limit && isNaN(Number(formData.overdraft_limit))) {
      newErrors.overdraft_limit = "Geçerli bir limit giriniz"
    }

    if (
      formData.overdraft_interest_rate &&
      (isNaN(Number(formData.overdraft_interest_rate)) ||
        Number(formData.overdraft_interest_rate) < 0 ||
        Number(formData.overdraft_interest_rate) > 100)
    ) {
      newErrors.overdraft_interest_rate = "0-100 arası faiz oranı giriniz"
    }

    if (
      formData.interest_rate &&
      (isNaN(Number(formData.interest_rate)) ||
        Number(formData.interest_rate) < 0 ||
        Number(formData.interest_rate) > 100)
    ) {
      newErrors.interest_rate = "0-100 arası faiz oranı giriniz"
    }

    // IBAN validation (basic)
    if (formData.iban && formData.iban.length > 0) {
      const ibanRegex = /^TR\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{2}$/
      if (!ibanRegex.test(formData.iban.replace(/\s/g, ""))) {
        newErrors.iban = "Geçerli bir IBAN giriniz (TR ile başlamalı)"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.id || !account || !validateForm()) return

    setIsSubmitting(true)

    try {
      // Banka ID'sini bul
      const bankId = await getBankIdByName(formData.bank_name)
      if (!bankId) {
        toast({ title: "Hata", description: "Seçilen banka bulunamadı", variant: "destructive" })
        setIsSubmitting(false)
        return
      }

      const updateData = {
        bank_id: bankId,
        account_name: formData.account_name.trim(),
        account_number: formData.account_number.trim() || null,
        iban: formData.iban.trim() || null,
        account_type: formData.account_type as "vadesiz" | "vadeli" | "tasarruf" | "yatirim" | "diger",
        current_balance: Number(formData.current_balance) || 0,
        currency: formData.currency as "TRY" | "USD" | "EUR" | "GBP",
        overdraft_limit: Number(formData.overdraft_limit) || 0,
        overdraft_interest_rate: Number(formData.overdraft_interest_rate) || 0,
        interest_rate: Number(formData.interest_rate) || 0,
        notes: formData.notes.trim() || null,
        last_balance_update: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }


      await updateAccount(account.id, updateData)
      toast({ title: "Başarılı", description: "Hesap başarıyla güncellendi!" })
      router.push(`/uygulama/hesaplar/${account.id}`)
    } catch (error: any) {

      let errorMessage = "Hesap güncellenirken bir hata oluştu"
      if (error?.message?.includes("check constraint")) {
        errorMessage = "Seçilen hesap türü geçerli değil. Lütfen farklı bir hesap türü seçin."
      } else if (error?.message) {
        errorMessage = error.message
      }

      toast({ title: "Hata", description: errorMessage, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBankSelect = (bank: { name: string; id: string }) => {
    setFormData({ ...formData, bank_name: bank.name })
    setShowBankSelector(false)
    if (errors.bank_name) {
      setErrors({ ...errors, bank_name: "" })
    }
  }

  const handleAccountTypeSelect = (accountType: any) => {
    setSelectedAccountType(accountType)
    setFormData({
      ...formData,
      account_type: accountType.name,
    })
    setShowAccountTypeSelector(false)
    if (errors.account_type) {
      setErrors({ ...errors, account_type: "" })
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }
  }

  const formatIBAN = (value: string) => {
    const cleaned = value.replace(/\s/g, "").toUpperCase()
    return cleaned.replace(/(.{4})/g, "$1 ").trim()
  }

  const handleIBANChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatIBAN(e.target.value)
    handleInputChange("iban", formatted)
  }

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case "TRY":
        return "₺"
      case "USD":
        return "$"
      case "EUR":
        return "€"
      case "GBP":
        return "£"
      case "GOLD":
        return "gr"
      default:
        return ""
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex flex-col gap-4 md:gap-6 items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
        <p className="text-lg text-gray-600">Hesap bilgileri yükleniyor...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg text-red-600">Bu sayfayı görüntülemek için lütfen giriş yapın.</p>
        <Button
          onClick={() => router.push("/giris")}
          className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white"
        >
          Giriş Yap
        </Button>
      </div>
    )
  }

  if (error || !account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg text-red-600">{error || "Hesap bulunamadı."}</p>
        <Button onClick={() => router.back()} className="mt-4">
          Geri Dön
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
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.back()}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Hesap Düzenle</h1>
                <p className="text-emerald-100 text-lg">{account.account_name} hesabını düzenleyin</p>
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
                  <span>Anında Kayıt</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ana Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Temel Bilgiler */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Temel Hesap Bilgileri
                </CardTitle>
                <CardDescription>Hesabınızın temel bilgilerini düzenleyin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Banka *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between h-10 bg-transparent"
                      onClick={() => setShowBankSelector(true)}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{formData.bank_name || "Banka seçiniz"}</span>
                      </div>
                    </Button>
                    {errors.bank_name && <p className="text-sm text-red-600">{errors.bank_name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Hesap Türü *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between h-10 bg-transparent"
                      onClick={() => setShowAccountTypeSelector(true)}
                    >
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        <span>{selectedAccountType ? selectedAccountType.name : "Hesap türü seçiniz"}</span>
                      </div>
                    </Button>
                    {errors.account_type && <p className="text-sm text-red-600">{errors.account_type}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_name">Hesap Adı *</Label>
                    <Input
                      id="account_name"
                      value={formData.account_name}
                      onChange={(e) => handleInputChange("account_name", e.target.value)}
                      placeholder="Ana Hesabım"
                      className={errors.account_name ? "border-red-500" : ""}
                    />
                    {errors.account_name && <p className="text-sm text-red-600">{errors.account_name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Para Birimi</Label>
                    <Select value={formData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRY">TRY - Türk Lirası</SelectItem>
                        <SelectItem value="USD">USD - Amerikan Doları</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - İngiliz Sterlini</SelectItem>
                        <SelectItem value="GOLD">GOLD - Altın (gram)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hesap Detayları */}
            <Card>
              <CardHeader>
                <CardTitle>Hesap Detayları</CardTitle>
                <CardDescription>Hesap numarası ve IBAN bilgileri</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="account_number">Hesap Numarası</Label>
                    <Input
                      id="account_number"
                      value={formData.account_number}
                      onChange={(e) => handleInputChange("account_number", e.target.value)}
                      placeholder="1234567890"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="iban">IBAN</Label>
                    <Input
                      id="iban"
                      value={formData.iban}
                      onChange={handleIBANChange}
                      placeholder="TR12 3456 7890 1234 5678 9012 34"
                      maxLength={32}
                      className={errors.iban ? "border-red-500" : ""}
                    />
                    {errors.iban && <p className="text-sm text-red-600">{errors.iban}</p>}
                    <p className="text-xs text-gray-500">IBAN otomatik olarak formatlanacaktır</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Finansal Bilgiler */}
            <Card>
              <CardHeader>
                <CardTitle>Finansal Bilgiler</CardTitle>
                <CardDescription>Bakiye ve faiz oranı bilgileri</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_balance">Mevcut Bakiye ({getCurrencySymbol(formData.currency)})</Label>
                    <Input
                      id="current_balance"
                      type="number"
                      step="0.01"
                      value={formData.current_balance}
                      onChange={(e) => handleInputChange("current_balance", e.target.value)}
                      placeholder="0.00"
                      className={errors.current_balance ? "border-red-500" : ""}
                    />
                    {errors.current_balance && <p className="text-sm text-red-600">{errors.current_balance}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interest_rate">Faiz Oranı (%)</Label>
                    <Input
                      id="interest_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.interest_rate}
                      onChange={(e) => handleInputChange("interest_rate", e.target.value)}
                      placeholder="0.00"
                      className={errors.interest_rate ? "border-red-500" : ""}
                    />
                    {errors.interest_rate && <p className="text-sm text-red-600">{errors.interest_rate}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="overdraft_limit">
                      Kredili Mevduat Limiti ({getCurrencySymbol(formData.currency)})
                    </Label>
                    <Input
                      id="overdraft_limit"
                      type="number"
                      step="0.01"
                      value={formData.overdraft_limit}
                      onChange={(e) => handleInputChange("overdraft_limit", e.target.value)}
                      placeholder="0.00"
                      className={errors.overdraft_limit ? "border-red-500" : ""}
                    />
                    {errors.overdraft_limit && <p className="text-sm text-red-600">{errors.overdraft_limit}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="overdraft_interest_rate">Kredili Mevduat Faiz Oranı (%)</Label>
                    <Input
                      id="overdraft_interest_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.overdraft_interest_rate}
                      onChange={(e) => handleInputChange("overdraft_interest_rate", e.target.value)}
                      placeholder="0.00"
                      className={errors.overdraft_interest_rate ? "border-red-500" : ""}
                    />
                    {errors.overdraft_interest_rate && (
                      <p className="text-sm text-red-600">{errors.overdraft_interest_rate}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notlar */}
            <Card>
              <CardHeader>
                <CardTitle>Ek Bilgiler</CardTitle>
                <CardDescription>İsteğe bağlı notlar ve açıklamalar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Notlar</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Hesap hakkında notlar..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Özet Kartı */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Hesap Özeti</CardTitle>
                <CardDescription>Mevcut hesap bilgileri</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Hesap Adı:</span>
                    <span className="font-medium">{formData.account_name || "-"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Banka:</span>
                    <span className="font-medium">{formData.bank_name || "-"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Hesap Türü:</span>
                    <span className="font-medium">{selectedAccountType?.name || "-"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Para Birimi:</span>
                    <span className="font-medium">{formData.currency}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Mevcut Bakiye:</span>
                      <span className="text-emerald-600">
                        {formData.current_balance
                          ? `${Number(formData.current_balance).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${getCurrencySymbol(formData.currency)}`
                          : `0.00 ${getCurrencySymbol(formData.currency)}`}
                      </span>
                    </div>
                  </div>
                  {Number(formData.overdraft_limit) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Kredili Mevduat:</span>
                      <span className="font-medium text-orange-600">
                        {Number(formData.overdraft_limit).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}{" "}
                        {getCurrencySymbol(formData.currency)}
                      </span>
                    </div>
                  )}
                  {Number(formData.interest_rate) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Faiz Oranı:</span>
                      <span className="font-medium text-green-600">%{formData.interest_rate}</span>
                    </div>
                  )}
                  {formData.iban && (
                    <div className="flex flex-col text-sm">
                      <span className="text-gray-600 mb-1">IBAN:</span>
                      <span className="font-mono text-xs bg-gray-50 p-2 rounded border break-all">{formData.iban}</span>
                    </div>
                  )}
                  {account && (
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Durum:</span>
                        <Badge className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-transparent">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          {account.is_active ? "Aktif" : "Pasif"}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 space-y-3">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Güncelleniyor...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Değişiklikleri Kaydet
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => router.back()}
                  >
                    İptal
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Bank Selector Modal */}
      {showBankSelector && <BankSelector onBankSelect={handleBankSelect} onSkip={() => setShowBankSelector(false)} />}

      {/* Account Type Selector Modal */}
      {showAccountTypeSelector && (
        <AccountTypeSelector
          open={showAccountTypeSelector}
          onOpenChange={setShowAccountTypeSelector}
          onSelect={handleAccountTypeSelect}
          selectedAccountType={selectedAccountType}
        />
      )}
    </div>
  )
}
