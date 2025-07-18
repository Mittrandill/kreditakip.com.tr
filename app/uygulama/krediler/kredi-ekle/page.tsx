"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, CreditCard, Plus, ArrowLeft, Building2, Shield, Zap, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { createCredit } from "@/lib/api/credits"
import { BankSelector, type Bank } from "@/components/bank-selector"
import { CreditTypeSelector } from "@/components/credit-type-selector" // Changed to named import
import { CalendarModal } from "@/components/calendar-modal"
import { formatCurrency } from "@/lib/format"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import BankLogoTest from "@/components/bank-logo-test"
import { createPaymentPlansForCredit } from "@/lib/api/payment-plans"

interface CreditFormData {
  bank_id: string
  bank_name: string
  credit_type_id: string
  credit_type_name: string
  credit_code: string
  account_number: string
  initial_amount: number
  monthly_payment: number
  interest_rate: number
  start_date: Date | undefined
  total_installments: number
  branch_name: string
  customer_number: string
  collateral: string
  insurance_status: string
  credit_score: string
}

const initialFormData: CreditFormData = {
  bank_id: "",
  bank_name: "",
  credit_type_id: "",
  credit_type_name: "",
  credit_code: "",
  account_number: "",
  initial_amount: 0,
  monthly_payment: 0,
  interest_rate: 0,
  start_date: undefined,
  total_installments: 0,
  branch_name: "",
  customer_number: "",
  collateral: "",
  insurance_status: "Yok",
  credit_score: "",
}

// Türkçe ay isimleri
const turkishMonths = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
]

export default function KrediEklePage() {
  const [formData, setFormData] = useState<CreditFormData>(initialFormData)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showBankModal, setShowBankModal] = useState(false)
  const [showCreditTypeModal, setShowCreditTypeModal] = useState(false)
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [banks, setBanks] = useState<any[]>([])
  const [creditTypes, setCreditTypes] = useState<any[]>([])

  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Load banks and credit types on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [banksResult, creditTypesResult] = await Promise.all([
          supabase.from("banks").select("id, name, category, logo_url").order("name"),
          supabase.from("credit_types").select("id, name, category").order("name"),
        ])

        if (banksResult.data) setBanks(banksResult.data)
        if (creditTypesResult.data) setCreditTypes(creditTypesResult.data)
      } catch (error) {
        console.error("Error loading data:", error)
      }
    }
    loadData()
  }, [])

  const handleInputChange = (field: keyof CreditFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.bank_id) newErrors.bank_id = "Banka seçimi zorunludur"
    if (!formData.credit_type_id) newErrors.credit_type_id = "Kredi türü seçimi zorunludur"
    if (!formData.credit_code.trim()) newErrors.credit_code = "Kredi kodu zorunludur"
    if (formData.initial_amount <= 0) newErrors.initial_amount = "Geçerli bir kredi tutarı giriniz"
    if (formData.monthly_payment <= 0) newErrors.monthly_payment = "Geçerli bir aylık ödeme tutarı giriniz"
    if (formData.interest_rate < 0 || formData.interest_rate > 100)
      newErrors.interest_rate = "Faiz oranı 0-100 arasında olmalıdır"
    if (!formData.start_date) newErrors.start_date = "Başlangıç tarihi zorunludur"
    if (formData.total_installments <= 0) newErrors.total_installments = "Geçerli bir toplam taksit sayısı giriniz"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Otomatik hesaplamalar
  const calculateTotalPayback = () => {
    return formData.monthly_payment * formData.total_installments
  }

  const calculateRemainingDebt = () => {
    return calculateTotalPayback()
  }

  const calculateRemainingInstallments = () => {
    return formData.total_installments
  }

  const calculateEndDate = () => {
    if (!formData.start_date || !formData.total_installments) return undefined
    const endDate = new Date(formData.start_date)
    endDate.setMonth(endDate.getMonth() + formData.total_installments)
    return endDate
  }

  const handleBankSelect = (bank: Bank) => {
    handleInputChange("bank_id", bank.id)
    handleInputChange("bank_name", bank.name)
    console.log("Selected bank:", bank)
    setShowBankModal(false)
  }

  const handleCreditTypeSelect = (creditType: any) => {
    if (creditType && creditType.id) {
      handleInputChange("credit_type_id", creditType.id)
      handleInputChange("credit_type_name", creditType.name)
      console.log("Selected credit type:", creditType)
    } else {
      // Fallback for credit type
      const tempTypeId =
        creditType.name
          ?.toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "") || "unknown"
      handleInputChange("credit_type_id", tempTypeId)
      handleInputChange("credit_type_name", creditType.name || creditType)
      console.log("Credit type fallback:", tempTypeId)
    }
    setShowCreditTypeModal(false)
  }

  const handleDateSelect = (date: Date) => {
    handleInputChange("start_date", date)
    setShowCalendarModal(false)
  }

  const formatSelectedDate = (date: Date | undefined) => {
    if (!date) return "Tarih seçiniz"
    return `${date.getDate()} ${turkishMonths[date.getMonth()]} ${date.getFullYear()}`
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
      const endDate = calculateEndDate()

      // Ensure we have valid UUIDs or create them
      let finalBankId = formData.bank_id
      let finalCreditTypeId = formData.credit_type_id

      // If bank_id is not a valid UUID, try to find it or create one
      if (!finalBankId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const bankResult = await supabase
          .from("banks")
          .select("id")
          .ilike("name", `%${formData.bank_name}%`)
          .limit(1)
          .single()

        if (bankResult.data) {
          finalBankId = bankResult.data.id
        } else {
          // Create new bank if not found
          const newBankResult = await supabase
            .from("banks")
            .insert({ name: formData.bank_name, category: "Diğer" })
            .select("id")
            .single()

          if (newBankResult.data) {
            finalBankId = newBankResult.data.id
          }
        }
      }

      // If credit_type_id is not a valid UUID, try to find it or create one
      if (!finalCreditTypeId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const creditTypeResult = await supabase
          .from("credit_types")
          .select("id")
          .ilike("name", `%${formData.credit_type_name}%`)
          .limit(1)
          .single()

        if (creditTypeResult.data) {
          finalCreditTypeId = creditTypeResult.data.id
        } else {
          // Create new credit type if not found
          const newCreditTypeResult = await supabase
            .from("credit_types")
            .insert({ name: formData.credit_type_name, category: "Diğer" })
            .select("id")
            .single()

          if (newCreditTypeResult.data) {
            finalCreditTypeId = newCreditTypeResult.data.id
          }
        }
      }

      const creditData = {
        user_id: user.id,
        bank_id: finalBankId,
        credit_type_id: finalCreditTypeId,
        credit_code: formData.credit_code,
        account_number: formData.account_number || null,
        initial_amount: formData.initial_amount,
        remaining_debt: calculateRemainingDebt(),
        monthly_payment: formData.monthly_payment,
        interest_rate: formData.interest_rate,
        start_date: formData.start_date!.toISOString().split("T")[0],
        end_date: endDate ? endDate.toISOString().split("T")[0] : formData.start_date!.toISOString().split("T")[0],
        total_installments: formData.total_installments,
        remaining_installments: calculateRemainingInstallments(),
        payment_progress: 0,
        overdue_days: 0,
        status: "active" as const,
        branch_name: formData.branch_name || null,
        customer_number: formData.customer_number || null,
        collateral: formData.collateral || null,
        insurance_status: formData.insurance_status,
        credit_score: formData.credit_score || null,
        total_payback: calculateTotalPayback(),
        last_payment_date: null,
        calculated_interest_rate: null,
      }

      console.log("Submitting credit data:", creditData)

      // Create the credit first
      const createdCredit = await createCredit(creditData)

      console.log("Credit created successfully:", createdCredit)

      // Create payment plans for the credit
      try {
        const paymentPlansData = {
          initial_amount: formData.initial_amount,
          monthly_payment: formData.monthly_payment,
          interest_rate: formData.interest_rate,
          start_date: formData.start_date!.toISOString().split("T")[0],
          total_installments: formData.total_installments,
        }

        const paymentPlans = await createPaymentPlansForCredit(createdCredit.id, paymentPlansData)
        console.log("Payment plans created successfully:", paymentPlans.length, "plans")

        toast({
          title: "Başarılı",
          description: `Kredi ve ${paymentPlans.length} taksitlik ödeme planı başarıyla oluşturuldu`,
        })
      } catch (paymentPlanError) {
        console.error("Error creating payment plans:", paymentPlanError)
        // Credit was created but payment plans failed
        toast({
          title: "Kısmi Başarı",
          description:
            "Kredi oluşturuldu ancak ödeme planı oluşturulurken hata oluştu. Lütfen kredi detayından manuel olarak ekleyiniz.",
          variant: "destructive",
        })
      }

      router.push("/uygulama/krediler")
    } catch (error) {
      console.error("Error creating credit:", error)
      toast({
        title: "Hata",
        description: `Kredi eklenirken bir hata oluştu: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Logo Test Component */}
      <BankLogoTest />

      {/* Hero Section */}
      <Card className="overflow-hidden border-0 shadow-xl rounded-2xl">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-8 text-white relative">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mt-32 -mr-32"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white opacity-5 rounded-full -mb-20 -ml-20"></div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <Link href="/uygulama/krediler">
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Yeni Kredi Ekle</h1>
                <p className="text-emerald-100 text-lg">
                  Kredi bilgilerinizi manuel olarak ekleyerek portföyünüzü genişletin
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-100">
                  <Shield className="h-5 w-5" />
                  <span>Güvenli Veri</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-100">
                  <Zap className="h-5 w-5" />
                  <span>Hızlı Ekleme</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-100">
                  <Clock className="h-5 w-5" />
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
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                  Temel Kredi Bilgileri
                </CardTitle>
                <CardDescription>Kredinizin temel bilgilerini giriniz</CardDescription>
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
                        <span>{formData.bank_name || "Banka seçiniz"}</span>
                      </div>
                    </Button>
                    {errors.bank_id && <p className="text-sm text-red-600">{errors.bank_id}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Kredi Türü *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between h-10 bg-transparent"
                      onClick={() => setShowCreditTypeModal(true)}
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span>{formData.credit_type_name || "Kredi türü seçiniz"}</span>
                      </div>
                    </Button>
                    {errors.credit_type_id && <p className="text-sm text-red-600">{errors.credit_type_id}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="credit_code">Kredi Kodu *</Label>
                    <Input
                      id="credit_code"
                      value={formData.credit_code}
                      onChange={(e) => handleInputChange("credit_code", e.target.value)}
                      placeholder="Kredi kodunu giriniz"
                    />
                    {errors.credit_code && <p className="text-sm text-red-600">{errors.credit_code}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_number">Hesap Numarası</Label>
                    <Input
                      id="account_number"
                      value={formData.account_number}
                      onChange={(e) => handleInputChange("account_number", e.target.value)}
                      placeholder="Hesap numarasını giriniz"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Finansal Bilgiler */}
            <Card>
              <CardHeader>
                <CardTitle>Finansal Bilgiler</CardTitle>
                <CardDescription>Kredi tutarı, faiz oranı ve ödeme bilgileri</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="initial_amount">Kredi Tutarı (₺) *</Label>
                    <Input
                      id="initial_amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.initial_amount || ""}
                      onChange={(e) => handleInputChange("initial_amount", Number.parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                    {errors.initial_amount && <p className="text-sm text-red-600">{errors.initial_amount}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interest_rate">Faiz Oranı (%) *</Label>
                    <Input
                      id="interest_rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.interest_rate || ""}
                      onChange={(e) => handleInputChange("interest_rate", Number.parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                    {errors.interest_rate && <p className="text-sm text-red-600">{errors.interest_rate}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthly_payment">Aylık Ödeme (₺) *</Label>
                    <Input
                      id="monthly_payment"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.monthly_payment || ""}
                      onChange={(e) => handleInputChange("monthly_payment", Number.parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                    {errors.monthly_payment && <p className="text-sm text-red-600">{errors.monthly_payment}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="total_installments">Toplam Taksit Sayısı *</Label>
                    <Input
                      id="total_installments"
                      type="number"
                      min="1"
                      value={formData.total_installments || ""}
                      onChange={(e) => handleInputChange("total_installments", Number.parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                    {errors.total_installments && <p className="text-sm text-red-600">{errors.total_installments}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tarih Bilgileri */}
            <Card>
              <CardHeader>
                <CardTitle>Tarih Bilgileri</CardTitle>
                <CardDescription>Kredi başlangıç tarihi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Başlangıç Tarihi *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between h-10 bg-transparent"
                      onClick={() => setShowCalendarModal(true)}
                    >
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{formatSelectedDate(formData.start_date)}</span>
                      </div>
                    </Button>
                    {errors.start_date && <p className="text-sm text-red-600">{errors.start_date}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ek Bilgiler */}
            <Card>
              <CardHeader>
                <CardTitle>Ek Bilgiler</CardTitle>
                <CardDescription>İsteğe bağlı ek kredi bilgileri</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="branch_name">Şube Adı</Label>
                    <Input
                      id="branch_name"
                      value={formData.branch_name}
                      onChange={(e) => handleInputChange("branch_name", e.target.value)}
                      placeholder="Şube adını giriniz"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customer_number">Müşteri Numarası</Label>
                    <Input
                      id="customer_number"
                      value={formData.customer_number}
                      onChange={(e) => handleInputChange("customer_number", e.target.value)}
                      placeholder="Müşteri numarasını giriniz"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="insurance_status">Sigorta Durumu</Label>
                    <Select
                      value={formData.insurance_status}
                      onValueChange={(value) => handleInputChange("insurance_status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sigorta durumunu seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Var">Var</SelectItem>
                        <SelectItem value="Yok">Yok</SelectItem>
                        <SelectItem value="Kısmi">Kısmi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="credit_score">Kredi Notu</Label>
                    <Input
                      id="credit_score"
                      value={formData.credit_score}
                      onChange={(e) => handleInputChange("credit_score", e.target.value)}
                      placeholder="Kredi notunuzu giriniz"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="collateral">Teminat</Label>
                    <Textarea
                      id="collateral"
                      value={formData.collateral}
                      onChange={(e) => handleInputChange("collateral", e.target.value)}
                      placeholder="Teminat bilgilerini giriniz"
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
                <CardTitle>Kredi Özeti</CardTitle>
                <CardDescription>Girilen bilgilerin özeti</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Kredi Tutarı:</span>
                    <span className="font-medium">{formatCurrency(formData.initial_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Aylık Ödeme:</span>
                    <span className="font-medium">{formatCurrency(formData.monthly_payment)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Faiz Oranı:</span>
                    <span className="font-medium">%{formData.interest_rate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Toplam Taksit:</span>
                    <span className="font-medium">{formData.total_installments}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Toplam Geri Ödeme:</span>
                      <span className="text-emerald-600">{formatCurrency(calculateTotalPayback())}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Kalan Borç:</span>
                    <span className="font-medium text-orange-600">{formatCurrency(calculateRemainingDebt())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Kalan Taksit:</span>
                    <span className="font-medium">{calculateRemainingInstallments()}</span>
                  </div>
                  {calculateEndDate() && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Bitiş Tarihi:</span>
                      <span className="font-medium">
                        {turkishMonths[calculateEndDate()!.getMonth()]} {calculateEndDate()!.getFullYear()}
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
                        Kredi Ekle
                      </>
                    )}
                  </Button>

                  <Link href="/uygulama/krediler" className="block">
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

      {showCreditTypeModal && (
        <CreditTypeSelector
          open={showCreditTypeModal}
          onOpenChange={setShowCreditTypeModal}
          onSelect={handleCreditTypeSelect}
          selectedCreditType={null}
          creditTypes={creditTypes}
        />
      )}

      {showCalendarModal && (
        <CalendarModal
          onDateSelect={handleDateSelect}
          onClose={() => setShowCalendarModal(false)}
          initialDate={formData.start_date}
          title="Kredi Başlangıç Tarihi"
        />
      )}
    </div>
  )
}
