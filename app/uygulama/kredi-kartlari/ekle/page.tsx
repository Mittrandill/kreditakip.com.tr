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
import { ArrowLeft, Plus, CreditCard, Building2, Loader2, Shield, Zap, TrendingUp } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { createCreditCard } from "@/lib/api/credit-cards"
import { toast } from "sonner"
import BankSelector from "@/components/bank-selector"
import CreditCardTypeSelector from "@/components/credit-card-type-selector"
import Link from "next/link"

export default function KrediKartiEklePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showBankSelector, setShowBankSelector] = useState(false)
  const [showCreditCardTypeSelector, setShowCreditCardTypeSelector] = useState(false)
  const [selectedCreditCardType, setSelectedCreditCardType] = useState<any>(null)

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

  const handleCreditCardTypeSelect = (creditCardType: any) => {
    setSelectedCreditCardType(creditCardType)
    setFormData({
      ...formData,
      card_type: creditCardType.segment || "Classic",
      bank_name: creditCardType.bank_name || formData.bank_name,
    })
    setShowCreditCardTypeSelector(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }
  }

  const availableCredit = Number(formData.credit_limit) - Number(formData.current_balance || 0)
  const utilizationRate =
    Number(formData.credit_limit) > 0
      ? (Number(formData.current_balance || 0) / Number(formData.credit_limit)) * 100
      : 0

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="overflow-hidden border-0 shadow-xl rounded-2xl">
        <div className="bg-gradient-to-r from-purple-600 to-pink-700 p-8 text-white relative">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mt-32 -mr-32"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white opacity-5 rounded-full -mb-20 -ml-20"></div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <Link href="/uygulama/kredi-kartlari">
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Yeni Kredi Kartı Ekle</h1>
                <p className="text-purple-100 text-lg">
                  Kredi kartınızı manuel olarak ekleyerek portföyünüzü genişletin
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <div className="flex items-center gap-2 text-purple-100">
                  <Shield className="h-5 w-5" />
                  <span>Güvenli Veri</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <div className="flex items-center gap-2 text-purple-100">
                  <Zap className="h-5 w-5" />
                  <span>Hızlı Ekleme</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <div className="flex items-center gap-2 text-purple-100">
                  <TrendingUp className="h-5 w-5" />
                  <span>Anında Hesaplama</span>
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
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  Temel Kart Bilgileri
                </CardTitle>
                <CardDescription>Kredi kartınızın temel bilgilerini giriniz</CardDescription>
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
                    <Label htmlFor="card_name">Kart Adı *</Label>
                    <Input
                      id="card_name"
                      value={formData.card_name}
                      onChange={(e) => handleInputChange("card_name", e.target.value)}
                      placeholder="Ana Kredi Kartım"
                      className={errors.card_name ? "border-red-500" : ""}
                    />
                    {errors.card_name && <p className="text-sm text-red-600">{errors.card_name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Kart Türü (İsteğe Bağlı)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreditCardTypeSelector(true)}
                      className="w-full justify-start h-auto p-3 bg-transparent"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                        <div className="text-left flex-1">
                          {selectedCreditCardType ? (
                            <div>
                              <div className="font-medium text-sm">{selectedCreditCardType.name}</div>
                              <div className="text-xs text-gray-500">{selectedCreditCardType.bank_name}</div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium text-sm">Kredi kartı türünü seçin</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Button>
                    {selectedCreditCardType && (
                      <div className="text-xs text-gray-500 px-2">{selectedCreditCardType.description}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Durum</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                      <SelectTrigger>
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
              </CardContent>
            </Card>

            {/* Finansal Bilgiler */}
            <Card>
              <CardHeader>
                <CardTitle>Finansal Bilgiler</CardTitle>
                <CardDescription>Kredi limiti ve borç bilgileri</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="credit_limit">Kredi Limiti (₺) *</Label>
                    <Input
                      id="credit_limit"
                      type="number"
                      step="0.01"
                      value={formData.credit_limit}
                      onChange={(e) => handleInputChange("credit_limit", e.target.value)}
                      placeholder="50000.00"
                      className={errors.credit_limit ? "border-red-500" : ""}
                    />
                    {errors.credit_limit && <p className="text-sm text-red-600">{errors.credit_limit}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="current_balance">Mevcut Borç (₺)</Label>
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
                      placeholder="2.50"
                      className={errors.interest_rate ? "border-red-500" : ""}
                    />
                    {errors.interest_rate && <p className="text-sm text-red-600">{errors.interest_rate}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="annual_fee">Yıllık Aidat (₺)</Label>
                    <Input
                      id="annual_fee"
                      type="number"
                      step="0.01"
                      value={formData.annual_fee}
                      onChange={(e) => handleInputChange("annual_fee", e.target.value)}
                      placeholder="0.00"
                      className={errors.annual_fee ? "border-red-500" : ""}
                    />
                    {errors.annual_fee && <p className="text-sm text-red-600">{errors.annual_fee}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ödeme Bilgileri */}
            <Card>
              <CardHeader>
                <CardTitle>Ödeme Bilgileri</CardTitle>
                <CardDescription>Son ödeme tarihi bilgileri</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Son Ödeme Günü</Label>
                    <Input
                      id="due_date"
                      type="number"
                      min="1"
                      max="31"
                      value={formData.due_date}
                      onChange={(e) => handleInputChange("due_date", e.target.value)}
                      placeholder="15"
                      className={errors.due_date ? "border-red-500" : ""}
                    />
                    {errors.due_date && <p className="text-sm text-red-600">{errors.due_date}</p>}
                    <p className="text-xs text-gray-500">Ayın hangi günü son ödeme tarihi (1-31)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notlar */}
            <Card>
              <CardHeader>
                <CardTitle>Ek Bilgiler</CardTitle>
                <CardDescription>İsteğe bağlı ek kart bilgileri</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Açıklama</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Kart hakkında notlar..."
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
                <CardTitle>Kart Özeti</CardTitle>
                <CardDescription>Girilen bilgilerin özeti</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Kart Adı:</span>
                    <span className="font-medium">{formData.card_name || "-"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Banka:</span>
                    <span className="font-medium">{formData.bank_name || "-"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Kart Türü:</span>
                    <span className="font-medium">{selectedCreditCardType?.name || formData.card_type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Durum:</span>
                    <span className="font-medium capitalize">{formData.status}</span>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Kredi Limiti:</span>
                      <span className="text-blue-600">{Number(formData.credit_limit) || 0} ₺</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Mevcut Borç:</span>
                    <span className="font-medium text-red-600">{Number(formData.current_balance) || 0} ₺</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Kullanılabilir Limit:</span>
                    <span className="font-medium text-green-600">{availableCredit} ₺</span>
                  </div>

                  {Number(formData.credit_limit) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Kullanım Oranı:</span>
                      <span className="font-medium">{utilizationRate.toFixed(1)}%</span>
                    </div>
                  )}

                  {Number(formData.interest_rate) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Faiz Oranı:</span>
                      <span className="font-medium">%{formData.interest_rate}</span>
                    </div>
                  )}

                  {Number(formData.annual_fee) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Yıllık Aidat:</span>
                      <span className="font-medium">{Number(formData.annual_fee)} ₺</span>
                    </div>
                  )}

                  {formData.due_date && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Son Ödeme Günü:</span>
                      <span className="font-medium">Her ayın {formData.due_date}. günü</span>
                    </div>
                  )}

                  {/* Seçilen Kart Türü Detayları */}
                  {selectedCreditCardType && (
                    <div className="border-t pt-3">
                      <h4 className="font-medium text-gray-900 mb-2 text-sm">Seçilen Kart Türü</h4>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">{selectedCreditCardType.name}</span>
                        </div>
                        <div className="text-xs text-gray-500">{selectedCreditCardType.bank_name}</div>
                        {selectedCreditCardType.annual_fee_info && (
                          <div className="text-xs text-gray-500">{selectedCreditCardType.annual_fee_info}</div>
                        )}
                        {selectedCreditCardType.special_features &&
                          selectedCreditCardType.special_features.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {selectedCreditCardType.special_features
                                .slice(0, 2)
                                .map((feature: string, index: number) => (
                                  <span key={index} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                    {feature}
                                  </span>
                                ))}
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 space-y-3">
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Ekleniyor...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Kart Ekle
                      </>
                    )}
                  </Button>
                  <Link href="/uygulama/kredi-kartlari" className="block">
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

      {/* Bank Selector Modal */}
      {showBankSelector && <BankSelector onBankSelect={handleBankSelect} onSkip={() => setShowBankSelector(false)} />}

      {/* Credit Card Type Selector Modal */}
      {showCreditCardTypeSelector && (
        <CreditCardTypeSelector
          onCreditCardTypeSelect={handleCreditCardTypeSelect}
          onSkip={() => setShowCreditCardTypeSelector(false)}
        />
      )}
    </div>
  )
}
