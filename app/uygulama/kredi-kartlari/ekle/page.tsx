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
import { ArrowLeft, Plus, CreditCard, Building2, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { createCreditCard } from "@/lib/api/credit-cards"
import { toast } from "sonner"
import BankSelector from "@/components/bank-selector"
import { DatePickerModal } from "@/components/date-picker-modal"

export default function KrediKartiEklePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showBankSelector, setShowBankSelector] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const [formData, setFormData] = useState({
    card_name: "",
    bank_name: "",
    card_type: "Classic",
    credit_limit: "",
    current_balance: "",
    due_date: "",
    annual_fee: "",
    interest_rate: "",
    status: "aktif",
    description: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.card_name.trim()) {
      newErrors.card_name = "Kart adı gereklidir"
    }

    if (!formData.bank_name.trim()) {
      newErrors.bank_name = "Banka adı gereklidir"
    }

    if (!formData.credit_limit || isNaN(Number(formData.credit_limit)) || Number(formData.credit_limit) <= 0) {
      newErrors.credit_limit = "Geçerli bir kredi limiti giriniz"
    }

    if (formData.current_balance && isNaN(Number(formData.current_balance))) {
      newErrors.current_balance = "Geçerli bir borç tutarı giriniz"
    }

    if (
      formData.due_date &&
      (isNaN(Number(formData.due_date)) || Number(formData.due_date) < 1 || Number(formData.due_date) > 31)
    ) {
      newErrors.due_date = "Son ödeme günü 1-31 arasında olmalıdır"
    }

    if (formData.annual_fee && isNaN(Number(formData.annual_fee))) {
      newErrors.annual_fee = "Geçerli bir yıllık aidat giriniz"
    }

    if (
      formData.interest_rate &&
      (isNaN(Number(formData.interest_rate)) ||
        Number(formData.interest_rate) < 0 ||
        Number(formData.interest_rate) > 100)
    ) {
      newErrors.interest_rate = "Faiz oranı 0-100 arasında olmalıdır"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !validateForm()) return

    setIsSubmitting(true)
    try {
      const cardData = {
        card_name: formData.card_name.trim(),
        bank_name: formData.bank_name.trim(),
        card_type: formData.card_type,
        credit_limit: Number(formData.credit_limit),
        current_balance: Number(formData.current_balance) || 0,
        due_date: formData.due_date ? Number(formData.due_date) : null,
        annual_fee: Number(formData.annual_fee) || 0,
        interest_rate: Number(formData.interest_rate) || 0,
        status: formData.status,
        description: formData.description.trim(),
      }

      await createCreditCard(user.id, cardData)
      toast.success("Kredi kartı başarıyla eklendi!")
      router.push("/uygulama/kredi-kartlari")
    } catch (error: any) {
      console.error("Kredi kartı ekleme hatası:", error)
      toast.error("Kredi kartı eklenirken bir hata oluştu")
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
          <h1 className="text-2xl font-bold text-gray-900">Yeni Kredi Kartı Ekle</h1>
          <p className="text-gray-600">Kredi kartınızı sisteme ekleyin</p>
        </div>
      </div>

      {/* Main Form */}
      <div className="max-w-2xl">
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-white/20 rounded-lg">
                <CreditCard className="h-6 w-6" />
              </div>
              Kredi Kartı Bilgileri
            </CardTitle>
            <CardDescription className="text-purple-100">Kart detaylarını eksiksiz doldurun</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Kart Adı ve Banka */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="card_name" className="text-sm font-medium text-gray-700">
                    Kart Adı *
                  </Label>
                  <Input
                    id="card_name"
                    value={formData.card_name}
                    onChange={(e) => handleInputChange("card_name", e.target.value)}
                    placeholder="Ana Kredi Kartım"
                    className={`h-12 ${errors.card_name ? "border-red-500" : ""}`}
                  />
                  {errors.card_name && <p className="text-sm text-red-600">{errors.card_name}</p>}
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

              {/* Kart Türü ve Durum */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="card_type" className="text-sm font-medium text-gray-700">
                    Kart Türü
                  </Label>
                  <Select value={formData.card_type} onValueChange={(value) => handleInputChange("card_type", value)}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Classic">Classic</SelectItem>
                      <SelectItem value="Gold">Gold</SelectItem>
                      <SelectItem value="Platinum">Platinum</SelectItem>
                      <SelectItem value="World">World</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                    Durum
                  </Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aktif">Aktif</SelectItem>
                      <SelectItem value="pasif">Pasif</SelectItem>
                      <SelectItem value="blokeli">Blokeli</SelectItem>
                      <SelectItem value="iptal">İptal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Kredi Limiti ve Mevcut Borç */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="credit_limit" className="text-sm font-medium text-gray-700">
                    Kredi Limiti *
                  </Label>
                  <Input
                    id="credit_limit"
                    type="number"
                    step="0.01"
                    value={formData.credit_limit}
                    onChange={(e) => handleInputChange("credit_limit", e.target.value)}
                    placeholder="50000.00"
                    className={`h-12 ${errors.credit_limit ? "border-red-500" : ""}`}
                  />
                  {errors.credit_limit && <p className="text-sm text-red-600">{errors.credit_limit}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current_balance" className="text-sm font-medium text-gray-700">
                    Mevcut Borç
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
              </div>

              {/* Son Ödeme Günü ve Yıllık Aidat */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="due_date" className="text-sm font-medium text-gray-700">
                    Son Ödeme Günü
                  </Label>
                  <Input
                    id="due_date"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.due_date}
                    onChange={(e) => handleInputChange("due_date", e.target.value)}
                    placeholder="15"
                    className={`h-12 ${errors.due_date ? "border-red-500" : ""}`}
                  />
                  {errors.due_date && <p className="text-sm text-red-600">{errors.due_date}</p>}
                  <p className="text-xs text-gray-500">Ayın hangi günü son ödeme tarihi (1-31)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="annual_fee" className="text-sm font-medium text-gray-700">
                    Yıllık Aidat
                  </Label>
                  <Input
                    id="annual_fee"
                    type="number"
                    step="0.01"
                    value={formData.annual_fee}
                    onChange={(e) => handleInputChange("annual_fee", e.target.value)}
                    placeholder="0.00"
                    className={`h-12 ${errors.annual_fee ? "border-red-500" : ""}`}
                  />
                  {errors.annual_fee && <p className="text-sm text-red-600">{errors.annual_fee}</p>}
                </div>
              </div>

              {/* Faiz Oranı */}
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
                    placeholder="2.50"
                    className={`h-12 ${errors.interest_rate ? "border-red-500" : ""}`}
                  />
                  {errors.interest_rate && <p className="text-sm text-red-600">{errors.interest_rate}</p>}
                </div>
              </div>

              {/* Açıklama */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Açıklama
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Kart hakkında notlar..."
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
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Ekleniyor...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Kart Ekle
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

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DatePickerModal
          onDateSelect={(date) => {
            setFormData({ ...formData, due_date: date.getDate().toString() })
            setShowDatePicker(false)
          }}
          onClose={() => setShowDatePicker(false)}
          title="Son Ödeme Günü Seçin"
        />
      )}
    </div>
  )
}
