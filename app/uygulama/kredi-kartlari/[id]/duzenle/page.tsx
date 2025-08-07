"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, CreditCard, Building2, Loader2, Shield, Zap, TrendingUp, User } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { getCreditCard, updateCreditCard } from "@/lib/api/credit-cards"
import { toast } from "sonner"
import BankSelector from "@/components/bank-selector"
import { CreditCardTypeSelector } from "@/components/credit-card-type-selector"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { validateCardNumber, formatCardNumber, validateExpiryDate } from "@/lib/utils/encryption"

interface CreditCardData {
  id: string
  user_id: string
  bank_id: string
  card_name: string
  card_type: "kredi" | "bankakarti" | "prepaid"
  card_number: string | null
  cardholder_name: string | null
  expiry_month: number | null
  expiry_year: number | null
  cvv: string | null
  credit_limit: number
  current_debt: number
  current_balance: number
  available_limit: number
  minimum_payment_rate: number
  interest_rate: number
  late_payment_fee: number
  annual_fee: number
  statement_day: number | null
  due_day: number | null
  due_date: number | null
  next_statement_date: string | null
  next_due_date: string | null
  is_active: boolean
  status: string
  notes: string | null
  description: string | null
  created_at: string
  updated_at: string
  banks: {
    id: string
    name: string
    logo_url: string | null
  }
  bank_name?: string
}

export default function KrediKartiDuzenlePage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [creditCard, setCreditCard] = useState<CreditCardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showBankSelector, setShowBankSelector] = useState(false)
  const [showCreditCardTypeSelector, setShowCreditCardTypeSelector] = useState(false)
  const [selectedCreditCardType, setSelectedCreditCardType] = useState<any>(null)
  const [registeredBanks, setRegisteredBanks] = useState<Array<{ id: string; name: string; logo_url?: string }>>([])

  const [formData, setFormData] = useState({
    card_name: "",
    bank_name: "",
    card_type: "Classic",
    cardholder_name: "",
    card_number: "",
    expiry_month: "",
    expiry_year: "",
    cvv: "",
    credit_limit: "",
    current_balance: "",
    due_date: "",
    annual_fee: "",
    interest_rate: "",
    minimum_payment_rate: "",
    late_payment_fee: "",
    status: "aktif",
    description: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Kayıtlı bankaları yükle
  useEffect(() => {
    async function fetchRegisteredBanks() {
      try {
        const { data, error } = await supabase
          .from("banks")
          .select("id, name, logo_url")
          .eq("is_active", true)
          .order("name")

        if (error) {
          } else {
          setRegisteredBanks(data || [])
        }
      } catch (error) {
      }
    }

    fetchRegisteredBanks()
  }, [])

  // Kredi kartı verilerini yükle
  useEffect(() => {
    if (params.id && user?.id) {
      fetchCreditCard()
    }
  }, [params.id, user?.id])

  const fetchCreditCard = async () => {
    try {
      setLoading(true)
      const data = await getCreditCard(params.id as string)
      setCreditCard(data as any)

      // Form verilerini doldur
      if (data) {
        setFormData({
          card_name: data.card_name || "",
        bank_name: data.banks?.name || data.bank_name || "",
        card_type: data.card_type || "Classic",
        cardholder_name: data.cardholder_name || "",
        card_number: data.card_number || "",
        expiry_month: data.expiry_month?.toString() || "",
        expiry_year: data.expiry_year?.toString() || "",
        cvv: data.cvv || "",
        credit_limit: data.credit_limit?.toString() || "",
        current_balance: data.current_debt?.toString() || "",
        due_date: "",
        annual_fee: data.annual_fee?.toString() || "",
        interest_rate: data.interest_rate?.toString() || "",
        minimum_payment_rate: data.minimum_payment_rate?.toString() || "",
        late_payment_fee: "",
        status: data.is_active ? "aktif" : "pasif",
        description: "",
      })
      }
    } catch (error) {
      toast.error("Kredi kartı bilgileri yüklenirken hata oluştu")
      router.push("/uygulama/kredi-kartlari")
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.card_name.trim()) {
      newErrors.card_name = "Kart adı gereklidir"
    }

    if (!formData.bank_name.trim()) {
      newErrors.bank_name = "Banka adı gereklidir"
    }

    // Only validate card number if it's provided and not empty
    if (formData.card_number && formData.card_number.trim() !== "") {
      const isValidCard = validateCardNumber(formData.card_number)

      if (!isValidCard) {
        newErrors.card_number = "Geçersiz kart numarası"
      }
    }

    if (formData.expiry_month && formData.expiry_year) {
      if (!validateExpiryDate(formData.expiry_month, formData.expiry_year)) {
        newErrors.expiry_date = "Geçersiz son kullanma tarihi"
      }
    }

    if (formData.cvv && (formData.cvv.length < 3 || formData.cvv.length > 4)) {
      newErrors.cvv = "CVV 3 veya 4 haneli olmalıdır"
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

    if (
      formData.minimum_payment_rate &&
      (isNaN(Number(formData.minimum_payment_rate)) ||
        Number(formData.minimum_payment_rate) < 0 ||
        Number(formData.minimum_payment_rate) > 100)
    ) {
      newErrors.minimum_payment_rate = "Min. ödeme oranı 0-100 arasında olmalıdır"
    }

    if (formData.late_payment_fee && isNaN(Number(formData.late_payment_fee))) {
      newErrors.late_payment_fee = "Geçerli bir gecikme ücreti giriniz"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.id || !creditCard?.id || !validateForm()) return

    setIsSubmitting(true)

    try {
      const updateData = {
        card_name: formData.card_name.trim(),
        bank_name: formData.bank_name.trim(),
        card_type: formData.card_type,
        cardholder_name: formData.cardholder_name.trim() || undefined,
        card_number: formData.card_number.replace(/\s/g, "") || undefined,
        expiry_month: formData.expiry_month ? Number(formData.expiry_month) : undefined,
        expiry_year: formData.expiry_year ? Number(formData.expiry_year) : undefined,
        cvv: formData.cvv.trim() || undefined,
        credit_limit: Number(formData.credit_limit),
        current_balance: Number(formData.current_balance) || 0,
        due_date: formData.due_date ? Number(formData.due_date) : null,
        annual_fee: Number(formData.annual_fee) || 0,
        interest_rate: Number(formData.interest_rate) || 0,
        minimum_payment_rate: Number(formData.minimum_payment_rate) || 0,
        late_payment_fee: Number(formData.late_payment_fee) || 0,
        status: formData.status,
        description: formData.description.trim(),
      }

      await updateCreditCard(creditCard.id, updateData)
      toast.success("Kredi kartı başarıyla güncellendi!")
      router.push(`/uygulama/kredi-kartlari/${creditCard.id}`)
    } catch (error: any) {
      toast.error("Kredi kartı güncellenirken bir hata oluştu")
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
    // Eşleştirilmiş banka adını kullan
    const bankNameToUse = creditCardType.matched_bank_name || creditCardType.bank_name

    setFormData({
      ...formData,
      card_name: creditCardType.name, // Kart adını da güncelle
      card_type: creditCardType.segment || "Classic",
      bank_name: bankNameToUse, // Eşleştirilmiş banka adını kullan
    })
    setShowCreditCardTypeSelector(false)

    // Banka adı hatası varsa temizle
    if (errors.bank_name) {
      setErrors({ ...errors, bank_name: "" })
    }
    if (errors.card_name) {
      setErrors({ ...errors, card_name: "" })
    }

  }

  const handleInputChange = (field: string, value: string) => {
    // Format card number as user types
    if (field === "card_number") {
      const cleanValue = value.replace(/\D/g, "")
      const formattedValue = formatCardNumber(cleanValue)
      setFormData({ ...formData, [field]: formattedValue })
    } else {
      setFormData({ ...formData, [field]: value })
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }

    // Clear card number error specifically when typing
    if (field === "card_number" && errors.card_number) {
      setErrors({ ...errors, card_number: "" })
    }
  }

  const availableCredit = Number(formData.credit_limit) - Number(formData.current_balance || 0)
  const utilizationRate =
    Number(formData.credit_limit) > 0
      ? (Number(formData.current_balance || 0) / Number(formData.credit_limit)) * 100
      : 0

  // Generate year options (current year + 10 years)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear + i)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!creditCard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Kredi Kartı Bulunamadı</h2>
        <p className="text-gray-600 mb-4">Düzenlemek istediğiniz kredi kartı mevcut değil.</p>
        <Button onClick={() => router.push("/uygulama/kredi-kartlari")}>Kredi Kartlarına Dön</Button>
      </div>
    )
  }

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
              <Link href={`/uygulama/kredi-kartlari/${creditCard.id}`}>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Kredi Kartı Düzenle</h1>
                <p className="text-purple-100 text-lg">{creditCard.card_name} kartınızın bilgilerini güncelleyin</p>
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
                  <span>Hızlı Güncelleme</span>
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
                <CardDescription>Kredi kartınızın temel bilgilerini güncelleyin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Banka</Label>
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
                    <Label>Kart Türü</Label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreditCardTypeSelector(true)}
                      className="w-full justify-between h-10 bg-transparent"
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span>{selectedCreditCardType ? selectedCreditCardType.name : formData.card_type}</span>
                      </div>
                    </Button>
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

            {/* Kart Detayları */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-green-600" />
                  Kart Sahibi ve Detayları
                </CardTitle>
                <CardDescription>Kart sahibi bilgileri ve kart detayları (opsiyonel)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="cardholder_name">Kart Sahibi Adı</Label>
                    <Input
                      id="cardholder_name"
                      value={formData.cardholder_name}
                      onChange={(e) => handleInputChange("cardholder_name", e.target.value)}
                      placeholder="AHMET YILMAZ"
                      className="uppercase"
                    />
                    <p className="text-xs text-gray-500">Kart üzerinde yazıldığı gibi (büyük harflerle)</p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="card_number">Kart Numarası</Label>
                    <Input
                      id="card_number"
                      type="text"
                      value={formData.card_number}
                      onChange={(e) => handleInputChange("card_number", e.target.value)}
                      placeholder="1234 5678 9123 4567"
                      maxLength={19}
                      className={errors.card_number ? "border-red-500" : ""}
                    />
                    {errors.card_number && <p className="text-sm text-red-600">{errors.card_number}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiry_month">Son Kullanma Ayı</Label>
                    <Select
                      value={formData.expiry_month}
                      onValueChange={(value) => handleInputChange("expiry_month", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ay seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                          <SelectItem key={month} value={month.toString()}>
                            {month.toString().padStart(2, "0")} -{" "}
                            {new Date(0, month - 1).toLocaleDateString("tr-TR", { month: "long" })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiry_year">Son Kullanma Yılı</Label>
                    <Select
                      value={formData.expiry_year}
                      onValueChange={(value) => handleInputChange("expiry_year", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Yıl seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.expiry_date && <p className="text-sm text-red-600">{errors.expiry_date}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV Güvenlik Kodu</Label>
                    <Input
                      id="cvv"
                      type="text"
                      value={formData.cvv}
                      onChange={(e) => handleInputChange("cvv", e.target.value.replace(/\D/g, ""))}
                      placeholder="123"
                      maxLength={4}
                      className={errors.cvv ? "border-red-500" : ""}
                    />
                    {errors.cvv && <p className="text-sm text-red-600">{errors.cvv}</p>}
                    <p className="text-xs text-gray-500">Kartın arkasındaki 3 haneli kod</p>
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

                  <div className="space-y-2">
                    <Label htmlFor="minimum_payment_rate">Min. Ödeme Oranı (%)</Label>
                    <Input
                      id="minimum_payment_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.minimum_payment_rate}
                      onChange={(e) => handleInputChange("minimum_payment_rate", e.target.value)}
                      placeholder="3.00"
                      className={errors.minimum_payment_rate ? "border-red-500" : ""}
                    />
                    {errors.minimum_payment_rate && (
                      <p className="text-sm text-red-600">{errors.minimum_payment_rate}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="late_payment_fee">Gecikme Ücreti (₺)</Label>
                    <Input
                      id="late_payment_fee"
                      type="number"
                      step="0.01"
                      value={formData.late_payment_fee}
                      onChange={(e) => handleInputChange("late_payment_fee", e.target.value)}
                      placeholder="0.00"
                      className={errors.late_payment_fee ? "border-red-500" : ""}
                    />
                    {errors.late_payment_fee && <p className="text-sm text-red-600">{errors.late_payment_fee}</p>}
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
                <CardDescription>Güncellenecek bilgilerin özeti</CardDescription>
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
                  {formData.cardholder_name && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Kart Sahibi:</span>
                      <span className="font-medium">{formData.cardholder_name}</span>
                    </div>
                  )}
                  {formData.card_number && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Kart No:</span>
                      <span className="font-medium">
                        **** **** **** {formData.card_number.replace(/\s/g, "").slice(-4)}
                      </span>
                    </div>
                  )}
                  {formData.expiry_month && formData.expiry_year && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Son Kullanma:</span>
                      <span className="font-medium">
                        {formData.expiry_month.padStart(2, "0")}/{formData.expiry_year}
                      </span>
                    </div>
                  )}
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
                  {Number(formData.minimum_payment_rate) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Min. Ödeme Oranı:</span>
                      <span className="font-medium">%{formData.minimum_payment_rate}</span>
                    </div>
                  )}
                  {Number(formData.late_payment_fee) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Gecikme Ücreti:</span>
                      <span className="font-medium">{Number(formData.late_payment_fee)} ₺</span>
                    </div>
                  )}
                  {formData.due_date && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Son Ödeme Günü:</span>
                      <span className="font-medium">Her ayın {formData.due_date}. günü</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 space-y-3">
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
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

                  <Link href={`/uygulama/kredi-kartlari/${creditCard.id}`} className="block">
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
      {showBankSelector && <BankSelector onBankSelect={handleBankSelect as any} onSkip={() => setShowBankSelector(false)} />}

      {/* Credit Card Type Selector Modal */}
      {showCreditCardTypeSelector && (
        <CreditCardTypeSelector
          onCreditCardTypeSelect={handleCreditCardTypeSelect}
          onSkip={() => setShowCreditCardTypeSelector(false)}
          registeredBanks={registeredBanks}
        />
      )}
    </div>
  )
}
