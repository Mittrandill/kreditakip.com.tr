"use client"

import { useMemo, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Save,
  Edit3,
  AlertCircle,
  Calendar,
  Building2,
  Loader2,
  Sparkles,
  TrendingUp,
  Clock,
  Target,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/format"
import { MetricCard } from "@/components/metric-card"
import BankLogo from "@/components/bank-logo"
import BankSelector from "@/components/bank-selector"
import { CreditTypeSelector } from "@/components/credit-type-selector"
import { createCredit, getBanks, getCreditTypes } from "@/lib/api/credits"
import { useAuth } from "@/hooks/use-auth"
import { mapBankName, findBestBankMatch } from "@/lib/utils/bank-mapper"
import { supabase } from "@/lib/supabase"

interface PaymentPlan {
  bankName: string | null
  planName: string
  loanAmount: number
  totalPayback: number
  currency: string
  installments: Array<{
    installmentNumber: number
    amount: number
    dueDate: string
    description?: string
    isPaid: boolean
  }>
  interestRate: number | null
  fees: number | null
  loanTerm: number
  monthlyPayment: number | null
  isVariableRate?: boolean
  variableRateInfo?: string | null
}

const ITEMS_PER_PAGE = 12

export default function PDFAnalysisPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user } = useAuth()

  const [paymentPlan, setPaymentPlan] = useState<PaymentPlan | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showBankSelector, setShowBankSelector] = useState(false)
  const [showCreditTypeSelector, setShowCreditTypeSelector] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [banks, setBanks] = useState<any[]>([])
  const [creditTypes, setCreditTypes] = useState<any[]>([])
  const [selectedCreditType, setSelectedCreditType] = useState<any>(null)

  // Memoize the data param so it's stable between renders
  const dataParam = useMemo(() => searchParams.get("data"), [searchParams.get("data")])

  // Load banks and credit types
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("Bankalar ve kredi türleri yükleniyor...")
        const [banksData, creditTypesData] = await Promise.all([getBanks(), getCreditTypes()])
        console.log("Yüklenen bankalar:", banksData)
        console.log("Yüklenen kredi türleri:", creditTypesData)
        setBanks(banksData || [])
        setCreditTypes(creditTypesData || [])
      } catch (err) {
        console.error("Error loading banks/credit types:", err)
        toast({
          title: "Veri Yükleme Hatası",
          description: "Banka ve kredi türü verileri yüklenemedi. Lütfen sayfayı yenileyin.",
          variant: "destructive",
        })
      }
    }
    loadData()
  }, [])

  // PDF verilerini yükle ve kredi türünü eşleştir
  useEffect(() => {
    if (!dataParam) {
      setError("Analiz verisi bulunamadı")
      return
    }

    try {
      const parsedData = JSON.parse(decodeURIComponent(dataParam))

      // Banka adını eşleştir
      if (parsedData.bankName) {
        parsedData.bankName = mapBankName(parsedData.bankName)
      }

      console.log("📋 PDF'den gelen kredi türü:", parsedData.planName)
      setPaymentPlan(parsedData)

      // Kredi türünü eşleştir - PDF'den gelen planName'i kullan
      if (parsedData.planName && creditTypes.length > 0) {
        console.log("🔍 Kredi türü eşleştiriliyor:", parsedData.planName)

        // Önce tam eşleşme ara
        let matchedCreditType = creditTypes.find((ct) => ct.name.toLowerCase() === parsedData.planName.toLowerCase())

        // Tam eşleşme yoksa kısmi eşleşme ara
        if (!matchedCreditType) {
          matchedCreditType = creditTypes.find((ct) => {
            const ctNameLower = ct.name.toLowerCase()
            const planNameLower = parsedData.planName.toLowerCase()

            return (
              ctNameLower.includes(planNameLower) ||
              planNameLower.includes(ctNameLower) ||
              // Özel eşleştirmeler
              (planNameLower.includes("ihtiyaç") && ctNameLower.includes("ihtiyaç")) ||
              (planNameLower.includes("konut") && ctNameLower.includes("konut")) ||
              (planNameLower.includes("taşıt") && ctNameLower.includes("taşıt")) ||
              (planNameLower.includes("ticari") && ctNameLower.includes("ticari")) ||
              (planNameLower.includes("tüketici") && ctNameLower.includes("tüketici"))
            )
          })
        }

        if (matchedCreditType) {
          console.log("✅ Kredi türü eşleştirildi:", matchedCreditType.name)
          setSelectedCreditType(matchedCreditType)
        } else {
          console.log("⚠️ Kredi türü eşleştirilemedi, varsayılan seçiliyor")
          // Varsayılan olarak İhtiyaç Kredisi'ni ara
          const defaultCreditType =
            creditTypes.find((ct) => ct.name.toLowerCase().includes("ihtiyaç")) || creditTypes[0]
          setSelectedCreditType(defaultCreditType)
        }
      }
    } catch (err) {
      setError("Veri yüklenirken hata oluştu")
      console.error("Data parse error:", err)
    }
  }, [dataParam, creditTypes])

  // Kredi türleri yüklendiğinde eşleştirmeyi tekrar yap
  useEffect(() => {
    if (paymentPlan && paymentPlan.planName && creditTypes.length > 0 && !selectedCreditType) {
      console.log("🔄 Kredi türleri yüklendi, eşleştirme yapılıyor...")

      // Önce tam eşleşme ara
      let matchedCreditType = creditTypes.find((ct) => ct.name.toLowerCase() === paymentPlan.planName.toLowerCase())

      // Tam eşleşme yoksa kısmi eşleşme ara
      if (!matchedCreditType) {
        matchedCreditType = creditTypes.find((ct) => {
          const ctNameLower = ct.name.toLowerCase()
          const planNameLower = paymentPlan.planName.toLowerCase()

          return (
            ctNameLower.includes(planNameLower) ||
            planNameLower.includes(ctNameLower) ||
            // Özel eşleştirmeler
            (planNameLower.includes("ihtiyaç") && ctNameLower.includes("ihtiyaç")) ||
            (planNameLower.includes("konut") && ctNameLower.includes("konut")) ||
            (planNameLower.includes("taşıt") && ctNameLower.includes("taşıt")) ||
            (planNameLower.includes("ticari") && ctNameLower.includes("ticari")) ||
            (planNameLower.includes("tüketici") && ctNameLower.includes("tüketici"))
          )
        })
      }

      if (matchedCreditType) {
        console.log("✅ Gecikmeli kredi türü eşleştirildi:", matchedCreditType.name)
        setSelectedCreditType(matchedCreditType)
      } else {
        console.log("⚠️ Kredi türü eşleştirilemedi, varsayılan seçiliyor")
        // Varsayılan olarak İhtiyaç Kredisi'ni ara
        const defaultCreditType = creditTypes.find((ct) => ct.name.toLowerCase().includes("ihtiyaç")) || creditTypes[0]
        setSelectedCreditType(defaultCreditType)
      }
    }
  }, [paymentPlan, creditTypes, selectedCreditType])

  const handleInstallmentToggle = (index: number) => {
    if (!paymentPlan) return

    const updatedPlan = { ...paymentPlan }
    updatedPlan.installments[index].isPaid = !updatedPlan.installments[index].isPaid
    setPaymentPlan(updatedPlan)
  }

  const handleInstallmentEdit = (index: number, field: string, value: any) => {
    if (!paymentPlan) return

    const updatedPlan = { ...paymentPlan }
    updatedPlan.installments[index] = {
      ...updatedPlan.installments[index],
      [field]: value,
    }
    setPaymentPlan(updatedPlan)
  }

  const handleGeneralEdit = (field: string, value: any) => {
    if (!paymentPlan) return

    setPaymentPlan({
      ...paymentPlan,
      [field]: value,
    })
  }

  const handleBankSelect = (bank: any) => {
    console.log("Manuel banka seçimi:", bank)
    if (typeof bank === "string") {
      // Legacy support for string parameter
      handleGeneralEdit("bankName", bank)
    } else if (bank && bank.name) {
      // Handle bank object
      handleGeneralEdit("bankName", bank.name)
    }
    setShowBankSelector(false)

    // Seçilen bankayı kaydetme işlemi için hazırla
    const selectedBankForSave = typeof bank === "string" ? banks.find((b) => b.name === bank) : bank
    if (selectedBankForSave) {
      console.log("Manuel seçilen banka ID:", selectedBankForSave.id)
    }
  }

  const handleCreditTypeSelect = (creditType: any) => {
    console.log("Manuel kredi türü seçimi:", creditType.name)
    setSelectedCreditType(creditType)
    setShowCreditTypeSelector(false)
  }

  const handleSave = async () => {
    if (!paymentPlan || !user) {
      toast({
        title: "Hata",
        description: "Gerekli veriler eksik",
        variant: "destructive",
      })
      return
    }

    // Bankalar ve kredi türleri yüklenmemişse bekle
    if (banks.length === 0 || creditTypes.length === 0) {
      toast({
        title: "Hata",
        description: "Banka ve kredi türü verileri henüz yüklenmedi. Lütfen bekleyin.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    // 15 saniye timeout
    const timeoutId = setTimeout(() => {
      setIsSaving(false)
      toast({
        title: "Zaman Aşımı",
        description: "Kaydetme işlemi çok uzun sürdü. Lütfen tekrar deneyin.",
        variant: "destructive",
      })
    }, 15000)

    try {
      console.log("Kaydetme işlemi başlıyor...")
      console.log("Seçilen banka:", paymentPlan.bankName)
      console.log("Seçilen kredi türü:", selectedCreditType)
      console.log("Taksit sayısı:", paymentPlan.installments.length)

      // 1. Doğru bankayı bul - YENİ AKILLI EŞLEŞTİRME
      let selectedBank = null
      if (paymentPlan.bankName) {
        console.log("=== KAYDETME İŞLEMİ DEBUG ===")
        console.log("PDF'den gelen banka adı:", paymentPlan.bankName)
        console.log(
          "Mevcut bankalar:",
          banks.map((b) => ({ id: b.id, name: b.name })),
        )

        // Akıllı banka eşleştirme kullan
        selectedBank = findBestBankMatch(paymentPlan.bankName, banks)

        console.log("Bulunan banka:", selectedBank)
      }

      // Eğer hala banka bulunamazsa kullanıcıya sor
      if (!selectedBank) {
        toast({
          title: "Banka Bulunamadı",
          description: `"${paymentPlan.bankName}" bankası bulunamadı. Lütfen manuel olarak seçin.`,
          variant: "destructive",
        })
        setShowBankSelector(true)
        setIsSaving(false)
        clearTimeout(timeoutId)
        return
      }

      console.log("Seçilen banka:", selectedBank)
      console.log("Seçilen kredi türü:", selectedCreditType)
      console.log("================================")

      if (!selectedCreditType) {
        throw new Error("Kredi türü seçilmedi")
      }

      // 3. Toplam tutarları hesapla
      const totalPayback = paymentPlan.installments.reduce((sum, inst) => sum + inst.amount, 0)
      const loanAmount = paymentPlan.loanAmount || totalPayback * 0.8
      const monthlyPayment = totalPayback / paymentPlan.installments.length

      // 4. Krediyi kaydet
      const creditData = {
        user_id: user.id,
        bank_id: selectedBank.id,
        credit_type_id: selectedCreditType.id,
        credit_code: `PDF-${Date.now()}`,
        account_number: null,
        initial_amount: loanAmount,
        remaining_debt: paymentPlan.installments
          .filter((inst) => !inst.isPaid)
          .reduce((sum, inst) => sum + inst.amount, 0),
        monthly_payment: monthlyPayment,
        interest_rate: paymentPlan.interestRate || 0,
        start_date: paymentPlan.installments[0]?.dueDate || new Date().toISOString().split("T")[0],
        end_date:
          paymentPlan.installments[paymentPlan.installments.length - 1]?.dueDate ||
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        last_payment_date: paymentPlan.installments.find((inst) => inst.isPaid)?.dueDate || null,
        status: "active" as const,
        payment_progress: Math.round(
          (paymentPlan.installments.filter((inst) => inst.isPaid).length / paymentPlan.installments.length) * 100,
        ),
        remaining_installments: paymentPlan.installments.filter((inst) => !inst.isPaid).length,
        total_installments: paymentPlan.installments.length,
        overdue_days: 0,
        collateral: null,
        insurance_status: "Aktif",
        branch_name: null,
        customer_number: null,
        credit_score: null,
        total_payback: totalPayback,
        calculated_interest_rate: paymentPlan.interestRate,
      }

      console.log("Kaydedilecek kredi verisi:", creditData)

      // Krediyi kaydet
      const savedCredit = await createCredit(creditData)
      console.log("Kredi kaydedildi:", savedCredit)

      // 5. Taksitleri kaydet
      console.log("Taksitler kaydediliyor...")

      const paymentHistoryRecords = []

      for (let i = 0; i < paymentPlan.installments.length; i++) {
        const installment = paymentPlan.installments[i]

        const paymentPlanData = {
          credit_id: savedCredit.id,
          installment_number: installment.installmentNumber,
          due_date: installment.dueDate,
          principal_amount: Math.round(installment.amount * 0.7),
          interest_amount: Math.round(installment.amount * 0.3),
          total_payment: installment.amount,
          remaining_debt: paymentPlan.installments.slice(i + 1).reduce((sum, inst) => sum + inst.amount, 0),
          status: installment.isPaid ? "paid" : "pending",
          payment_date: installment.isPaid ? installment.dueDate : null,
          payment_channel: "Banka",
        }

        console.log(`${i + 1}. taksit kaydediliyor:`, paymentPlanData)

        const { data: paymentPlanResult, error } = await supabase
          .from("payment_plans")
          .insert(paymentPlanData)
          .select()
          .single()

        if (error) {
          console.error(`${i + 1}. taksit kaydedilemedi:`, error)
          throw new Error(`Taksit kaydetme hatası: ${error.message}`)
        }

        console.log(`${i + 1}. taksit kaydedildi`)

        // Eğer taksit ödenmişse payment_history'ye de kaydet
        if (installment.isPaid) {
          const paymentHistoryData = {
            credit_id: savedCredit.id,
            payment_plan_id: paymentPlanResult.id,
            amount: installment.amount,
            payment_date: installment.dueDate,
            payment_channel: "Banka",
            status: "completed",
            transaction_id: `PDF-${savedCredit.id}-${installment.installmentNumber}`,
            notes: `PDF analizinden otomatik oluşturuldu - ${installment.installmentNumber}. taksit`,
          }

          paymentHistoryRecords.push(paymentHistoryData)
        }
      }

      // 6. Ödeme geçmişi kayıtlarını toplu olarak kaydet
      if (paymentHistoryRecords.length > 0) {
        console.log(`${paymentHistoryRecords.length} ödeme geçmişi kaydı ekleniyor...`)

        const { data: historyData, error: historyError } = await supabase
          .from("payment_history")
          .insert(paymentHistoryRecords)

        if (historyError) {
          console.error("Ödeme geçmişi kaydedilemedi:", historyError)
          // Bu hata kritik değil, sadece log'la
          console.warn("Ödeme geçmişi kaydetme hatası, ancak kredi başarıyla kaydedildi")
        } else {
          console.log(`${paymentHistoryRecords.length} ödeme geçmişi kaydı başarıyla eklendi`)
        }
      }

      // Timeout'u temizle
      clearTimeout(timeoutId)
      setIsSaving(false)

      toast({
        title: "Başarılı!",
        description: `Kredi ve ${paymentPlan.installments.length} taksit başarıyla kaydedildi`,
      })

      // Krediler sayfasına yönlendir
      router.push("/uygulama/krediler")
    } catch (err: any) {
      // Timeout'u temizle
      clearTimeout(timeoutId)
      setIsSaving(false)
      console.error("Kaydetme hatası:", err)

      toast({
        title: "Kaydetme Hatası",
        description: `Hata: ${err.message || "Bilinmeyen hata"}`,
        variant: "destructive",
      })
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg text-red-600">{error}</p>
        <Button onClick={() => router.back()} className="mt-4">
          Geri Dön
        </Button>
      </div>
    )
  }

  if (!paymentPlan) {
    return (
      <div className="flex flex-col gap-4 md:gap-6 items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
        <p className="text-lg text-gray-600">Analiz sonuçları yükleniyor...</p>
      </div>
    )
  }

  const paidInstallments = paymentPlan.installments.filter((inst) => inst.isPaid).length
  const totalInstallments = paymentPlan.installments.length
  const progressPercentage = (paidInstallments / totalInstallments) * 100
  const remainingAmount = paymentPlan.installments
    .filter((inst) => !inst.isPaid)
    .reduce((sum, inst) => sum + inst.amount, 0)

  // Pagination logic
  const totalPages = Math.ceil(paymentPlan.installments.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentInstallments = paymentPlan.installments.slice(startIndex, endIndex)

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
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
                <h1 className="text-3xl md:text-4xl font-bold mb-2">AI Ödeme Planı Analizi</h1>
                <p className="text-purple-100 text-lg">
                  Gelişmiş OCR teknolojisi ile %99.9 doğruluk oranında çıkarılan plan
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                disabled={isSaving}
              >
                <Edit3 className="mr-2 h-4 w-4" />
                {isEditing ? "Bitir" : "Düzenle"}
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-white/90 text-white-700 hover:bg-white hover:text-white-800 font-semibold shadow-lg border border-white/20 backdrop-blur-sm"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Krediyi Kaydet
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Ödeme İlerlemesi</span>
              <span className="text-sm font-bold">
                {paidInstallments}/{totalInstallments} Taksit
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3 bg-white/20" />
            <p className="text-xs text-purple-100 mt-1">%{progressPercentage.toFixed(1)} tamamlandı</p>
          </div>

          {/* Success Alert */}
          <Alert className="border-emerald-200 bg-emerald-50/90 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-800">
              <strong>Analiz Tamamlandı!</strong> {totalInstallments} taksit tespit edildi.
              {paymentPlan.interestRate
                ? ` Faiz oranı: %${paymentPlan.interestRate}`
                : " Faiz oranı otomatik hesaplandı."}
              {paymentPlan.isVariableRate && (
                <span className="ml-2 text-orange-700 font-medium">
                  (Değişken Faizli: {paymentPlan.variableRateInfo})
                </span>
              )}
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Kullanılan Kredi"
          value={formatCurrency(paymentPlan.loanAmount)}
          subtitle="Ana kredi tutarı"
          color="blue"
          icon={<CreditCard />}
        />
        <MetricCard
          title="Toplam Geri Ödeme"
          value={formatCurrency(paymentPlan.totalPayback)}
          subtitle="Faiz dahil toplam"
          color="green"
          icon={<Target />}
        />
        <MetricCard
          title="Kalan Borç"
          value={formatCurrency(remainingAmount)}
          subtitle={`${paymentPlan.installments.filter((inst) => !inst.isPaid).length} taksit`}
          color="orange"
          icon={<Clock />}
        />
        <MetricCard
          title="İlerleme"
          value={`%${progressPercentage.toFixed(1)}`}
          subtitle={`${paidInstallments}/${totalInstallments} taksit`}
          color="purple"
          icon={<TrendingUp />}
        />
      </div>

      {/* General Information */}
      <Card className="shadow-lg border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-600" />
            Kredi Bilgileri
          </CardTitle>
          <CardDescription>Kredi ve banka bilgilerini kontrol edin ve düzenleyin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label>Banka</Label>
              <div className="flex items-center gap-3">
                {paymentPlan.bankName ? (
                  <>
                    <BankLogo
                      bankName={paymentPlan.bankName}
                      logoUrl={banks.find((bank) => bank.name === paymentPlan.bankName)?.logo_url}
                      size="sm"
                    />
                    <span className="font-medium">{paymentPlan.bankName}</span>
                  </>
                ) : (
                  <span className="text-gray-500">Banka seçilmedi</span>
                )}
                {isEditing && (
                  <Button variant="outline" size="sm" onClick={() => setShowBankSelector(true)}>
                    Değiştir
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Kredi Türü</Label>
              <div className="flex items-center gap-3">
                {selectedCreditType ? (
                  <div className="flex flex-col">
                    <span className="font-medium">{selectedCreditType.name}</span>
                    <span className="text-xs text-gray-500">{selectedCreditType.category}</span>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <span className="text-gray-500">Kredi türü yükleniyor...</span>
                  </div>
                )}
                {isEditing && (
                  <Button variant="outline" size="sm" onClick={() => setShowCreditTypeSelector(true)}>
                    Değiştir
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loanAmount">Kullanılan Kredi Tutarı</Label>
              <Input
                id="loanAmount"
                type="number"
                step="0.01"
                value={paymentPlan.loanAmount || ""}
                onChange={(e) => handleGeneralEdit("loanAmount", Number.parseFloat(e.target.value) || 0)}
                disabled={!isEditing}
                className="custom-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interestRate">
                Faiz Oranı (%) {paymentPlan.isVariableRate && <span className="text-orange-600">(Değişken)</span>}
              </Label>
              <Input
                id="interestRate"
                type="number"
                step="0.01"
                value={paymentPlan.interestRate || ""}
                onChange={(e) => handleGeneralEdit("interestRate", Number.parseFloat(e.target.value) || null)}
                disabled={!isEditing}
                className="custom-input"
                placeholder="Otomatik hesaplanacak"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Plan Table */}
      <Card className="shadow-lg border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Ödeme Planı Detayları
          </CardTitle>
          <CardDescription>Taksit bilgilerini kontrol edin ve ödeme durumlarını güncelleyin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Taksit No</TableHead>
                  <TableHead>Vade Tarihi</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Ödendi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentInstallments.map((installment, index) => {
                  const actualIndex = startIndex + index
                  return (
                    <TableRow key={actualIndex}>
                      <TableCell className="font-medium">{installment.installmentNumber}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="date"
                            value={installment.dueDate || ""}
                            onChange={(e) => handleInstallmentEdit(actualIndex, "dueDate", e.target.value)}
                            className="custom-input w-40"
                          />
                        ) : (
                          new Date(installment.dueDate).toLocaleDateString("tr-TR")
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={installment.amount || ""}
                            onChange={(e) =>
                              handleInstallmentEdit(actualIndex, "amount", Number.parseFloat(e.target.value) || 0)
                            }
                            className="custom-input w-32"
                          />
                        ) : (
                          formatCurrency(installment.amount)
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={installment.isPaid ? "default" : "secondary"}
                          className={installment.isPaid ? "bg-green-500 hover:bg-green-600" : ""}
                        >
                          {installment.isPaid ? "Ödendi" : "Bekliyor"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={installment.isPaid}
                          onCheckedChange={() => handleInstallmentToggle(actualIndex)}
                          className="data-[state=checked]:bg-green-500"
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Sayfa {currentPage} / {totalPages} ({paymentPlan.installments.length} taksit)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Önceki
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Sonraki
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {showBankSelector && <BankSelector onBankSelect={handleBankSelect} onSkip={() => setShowBankSelector(false)} />}
      {showCreditTypeSelector && (
        <CreditTypeSelector
          onCreditTypeSelect={handleCreditTypeSelect}
          onSkip={() => setShowCreditTypeSelector(false)}
        />
      )}
    </div>
  )
}
