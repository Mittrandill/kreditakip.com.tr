"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, Wallet, Building2, Loader2, CheckCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { createAccount, getBankIdByName } from "@/lib/api/accounts"
import { toast } from "sonner"
import BankSelector from "@/components/bank-selector"

export default function HesapEklePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showBankSelector, setShowBankSelector] = useState(false)

  const [formData, setFormData] = useState({
    account_name: "",
    bank_name: "",
    account_type: "",
    current_balance: "",
    currency: "TRY",
    overdraft_limit: "",
    overdraft_interest_rate: "",
    interest_rate: "",
    notes: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !validateForm()) return

    setIsSubmitting(true)
    try {
      // Banka ID'sini bul
      const bankId = await getBankIdByName(formData.bank_name)
      if (!bankId) {
        toast.error("Seçilen banka bulunamadı")
        setIsSubmitting(false)
        return
      }

      const accountData = {
        user_id: user.id,
        bank_id: bankId,
        account_name: formData.account_name.trim(),
        account_type: formData.account_type as "vadesiz" | "vadeli" | "tasarruf" | "yatirim" | "diger",
        current_balance: Number(formData.current_balance) || 0,
        currency: formData.currency as "TRY" | "USD" | "EUR" | "GBP",
        overdraft_limit: Number(formData.overdraft_limit) || 0,
        overdraft_interest_rate: Number(formData.overdraft_interest_rate) || 0,
        interest_rate: Number(formData.interest_rate) || 0,
        notes: formData.notes.trim() || null,
        is_active: true,
        last_balance_update: new Date().toISOString(),
      }

      await createAccount(accountData)
      toast.success("Hesap başarıyla eklendi!")
      router.push("/uygulama/hesaplar")
    } catch (error: any) {
      console.error("Hesap ekleme hatası:", error)
      toast.error("Hesap eklenirken bir hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBankSelect = (bankName: string) => {
    setFormData({ ...formData, bank_name: bankName })
    setShowBankSelector(false)
    if (errors.bank_name) {
      setErrors({ ...errors, bank_name: "" })
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yeni Hesap Ekle</h1>
          <p className="text-gray-600">Banka hesabınızı sisteme ekleyin</p>
        </div>
      </div>

      {/* Main Form */}
      <div className="max-w-2xl">
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-white/20 rounded-lg">
                <Wallet className="h-6 w-6" />
              </div>
              Hesap Bilgileri
            </CardTitle>
            <CardDescription className="text-blue-100">Hesap detaylarını eksiksiz doldurun</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Hesap Adı ve Banka */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="account_name" className="text-sm font-medium text-gray-700">
                    Hesap Adı *
                  </Label>
                  <Input
                    id="account_name"
                    value={formData.account_name}
                    onChange={(e) => handleInputChange("account_name", e.target.value)}
                    placeholder="Ana Hesabım"
                    className={`h-12 ${errors.account_name ? "border-red-500" : ""}`}
                  />
                  {errors.account_name && <p className="text-sm text-red-600">{errors.account_name}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Banka *</Label>
                  <div className="relative">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowBankSelector(true)}
                      className={`w-full h-12 justify-start text-left font-normal ${
                        !formData.bank_name ? "text-gray-500" : ""
                      } ${errors.bank_name ? "border-red-500" : ""}`}
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      {formData.bank_name || "Banka seçiniz"}
                    </Button>
                  </div>
                  {errors.bank_name && <p className="text-sm text-red-600">{errors.bank_name}</p>}
                </div>
              </div>

              {/* Hesap Türü ve Para Birimi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="account_type" className="text-sm font-medium text-gray-700">
                    Hesap Türü *
                  </Label>
                  <Select
                    value={formData.account_type}
                    onValueChange={(value) => handleInputChange("account_type", value)}
                  >
                    <SelectTrigger className={`h-12 ${errors.account_type ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="Hesap türü seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vadesiz">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          Vadesiz Hesap
                        </div>
                      </SelectItem>
                      <SelectItem value="vadeli">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Vadeli Hesap
                        </div>
                      </SelectItem>
                      <SelectItem value="yatirim">
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Yatırım Hesabı
                        </div>
                      </SelectItem>
                      <SelectItem value="tasarruf">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Tasarruf Hesabı
                        </div>
                      </SelectItem>
                      <SelectItem value="diger">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          Diğer
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.account_type && <p className="text-sm text-red-600">{errors.account_type}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-sm font-medium text-gray-700">
                    Para Birimi
                  </Label>
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRY">TRY - Türk Lirası</SelectItem>
                      <SelectItem value="USD">USD - Amerikan Doları</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - İngiliz Sterlini</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bakiye ve Kredili Mevduat Limiti */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="current_balance" className="text-sm font-medium text-gray-700">
                    Mevcut Bakiye
                  </Label>
                  <Input
                    id="current_balance"
                    type="number"
                    step="0.01"
                    value={formData.current_balance}
                    onChange={(e) => handleInputChange("current_balance", e.target.value)}
                    placeholder="0.00"
                    className={`h-12 ${errors.current_balance ? "border-red-500" : ""}`}
                  />
                  {errors.current_balance && <p className="text-sm text-red-600">{errors.current_balance}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="overdraft_limit" className="text-sm font-medium text-gray-700">
                    Kredili Mevduat Limiti
                  </Label>
                  <Input
                    id="overdraft_limit"
                    type="number"
                    step="0.01"
                    value={formData.overdraft_limit}
                    onChange={(e) => handleInputChange("overdraft_limit", e.target.value)}
                    placeholder="0.00"
                    className={`h-12 ${errors.overdraft_limit ? "border-red-500" : ""}`}
                  />
                  {errors.overdraft_limit && <p className="text-sm text-red-600">{errors.overdraft_limit}</p>}
                </div>
              </div>

              {/* Faiz Oranları */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="interest_rate" className="text-sm font-medium text-gray-700">
                    Faiz Oranı (%)
                  </Label>
                  <Input
                    id="interest_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.interest_rate}
                    onChange={(e) => handleInputChange("interest_rate", e.target.value)}
                    placeholder="0.00"
                    className={`h-12 ${errors.interest_rate ? "border-red-500" : ""}`}
                  />
                  {errors.interest_rate && <p className="text-sm text-red-600">{errors.interest_rate}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="overdraft_interest_rate" className="text-sm font-medium text-gray-700">
                    Kredili Mevduat Faiz Oranı (%)
                  </Label>
                  <Input
                    id="overdraft_interest_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.overdraft_interest_rate}
                    onChange={(e) => handleInputChange("overdraft_interest_rate", e.target.value)}
                    placeholder="0.00"
                    className={`h-12 ${errors.overdraft_interest_rate ? "border-red-500" : ""}`}
                  />
                  {errors.overdraft_interest_rate && (
                    <p className="text-sm text-red-600">{errors.overdraft_interest_rate}</p>
                  )}
                </div>
              </div>

              {/* Notlar */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                  Notlar
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Hesap hakkında notlar..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Ekleniyor...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Hesap Ekle
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Bank Selector Modal */}
      {showBankSelector && <BankSelector onBankSelect={handleBankSelect} onSkip={() => setShowBankSelector(false)} />}
    </div>
  )
}
