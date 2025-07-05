"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ArrowLeft,
  Save,
  X,
  CreditCard,
  Building,
  FileText,
  Shield,
  Calendar,
  DollarSign,
  Percent,
  Hash,
  MapPin,
  User,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Edit,
  CalendarDays,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { getCreditById, updateCredit, getBanks, getCreditTypes } from "@/lib/api/credits"
import { getPaymentPlans, updatePaymentPlan } from "@/lib/api/payment-plans"
import type { Credit, Bank, CreditType, PaymentPlan } from "@/lib/types"
import { formatCurrency } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"
import BankLogo from "@/components/bank-logo"
import BankSelector from "@/components/bank-selector"
import { CreditTypeSelector } from "@/components/credit-type-selector"

interface PopulatedCredit extends Credit {
  banks: Pick<Bank, "id" | "name" | "logo_url" | "contact_phone" | "contact_email" | "website"> | null
  credit_types: Pick<CreditType, "id" | "name" | "description"> | null
}

interface FormData {
  credit_code: string
  account_number: string
  initial_amount: number
  remaining_debt: number
  monthly_payment: number
  interest_rate: number
  start_date: string
  end_date: string
  total_installments: number
  remaining_installments: number
  status: "active" | "closed" | "overdue"
  collateral: string
  insurance_status: string
  branch_name: string
  customer_number: string
  credit_score: string
  bank_id: string
  credit_type_id: string
  total_payback: number
}

export default function KrediDuzenlePage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const creditId = params.id as string

  const [krediDetay, setKrediDetay] = useState<PopulatedCredit | null>(null)
  const [banks, setBanks] = useState<Bank[]>([])
  const [creditTypes, setCreditTypes] = useState<CreditType[]>([])
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [loadingPaymentPlans, setLoadingPaymentPlans] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("credit-info")
  const [editingPlan, setEditingPlan] = useState<string | null>(null)
  const [editingPlanData, setEditingPlanData] = useState<Partial<PaymentPlan>>({})

  const [formData, setFormData] = useState<FormData>({
    credit_code: "",
    account_number: "",
    initial_amount: 0,
    remaining_debt: 0,
    monthly_payment: 0,
    interest_rate: 0,
    start_date: "",
    end_date: "",
    total_installments: 0,
    remaining_installments: 0,
    status: "active",
    collateral: "",
    insurance_status: "",
    branch_name: "",
    customer_number: "",
    credit_score: "",
    bank_id: "",
    credit_type_id: "",
    total_payback: 0,
  })

  const [showBankSelector, setShowBankSelector] = useState(false)
  const [showCreditTypeSelector, setShowCreditTypeSelector] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function fetchData() {
      if (user && creditId && isMounted) {
        setLoadingData(true)
        setError(null)
        try {
          const [creditData, banksData, creditTypesData] = await Promise.all([
            getCreditById(creditId, user.id) as Promise<PopulatedCredit>,
            getBanks(),
            getCreditTypes(),
          ])

          if (isMounted) {
            setKrediDetay(creditData)
            setBanks(banksData)
            setCreditTypes(creditTypesData)

            // Form verilerini doldur
            setFormData({
              credit_code: creditData.credit_code || "",
              account_number: creditData.account_number || "",
              initial_amount: creditData.initial_amount || 0,
              remaining_debt: creditData.remaining_debt || 0,
              monthly_payment: creditData.monthly_payment || 0,
              interest_rate: creditData.interest_rate || 0,
              start_date: creditData.start_date ? creditData.start_date.split("T")[0] : "",
              end_date: creditData.end_date ? creditData.end_date.split("T")[0] : "",
              total_installments: creditData.total_installments || 0,
              remaining_installments: creditData.remaining_installments || 0,
              status: creditData.status || "active",
              collateral: creditData.collateral || "",
              insurance_status: creditData.insurance_status || "",
              branch_name: creditData.branch_name || "",
              customer_number: creditData.customer_number || "",
              credit_score: creditData.credit_score || "",
              bank_id: creditData.bank_id || "",
              credit_type_id: creditData.credit_type_id || "",
              total_payback: creditData.total_payback || 0,
            })
          }
        } catch (err) {
          console.error("Kredi düzenleme data fetch error:", err)
          if (isMounted) {
            setError("Kredi bilgileri yüklenirken bir hata oluştu.")
          }
        } finally {
          if (isMounted) {
            setLoadingData(false)
          }
        }
      } else if (!authLoading && !user && isMounted) {
        setLoadingData(false)
        setError("Lütfen giriş yapınız.")
      }
    }
    fetchData()

    return () => {
      isMounted = false
    }
  }, [user, creditId, authLoading])

  // Ödeme planlarını yükle
  const fetchPaymentPlans = async () => {
    if (!creditId) return

    setLoadingPaymentPlans(true)
    try {
      const plans = await getPaymentPlans(creditId)
      setPaymentPlans(plans)
    } catch (err) {
      console.error("Error fetching payment plans:", err)
      toast({
        title: "Hata",
        description: "Ödeme planları yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setLoadingPaymentPlans(false)
    }
  }

  // Tab değiştiğinde ödeme planlarını yükle
  useEffect(() => {
    if (activeTab === "payment-plan" && paymentPlans.length === 0) {
      fetchPaymentPlans()
    }
  }, [activeTab])

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleBankSelect = (bank: Bank) => {
    setFormData((prev) => ({
      ...prev,
      bank_id: bank.id,
    }))
    setShowBankSelector(false)
  }

  const handleCreditTypeSelect = (creditType: CreditType) => {
    setFormData((prev) => ({
      ...prev,
      credit_type_id: creditType.id,
    }))
    setShowCreditTypeSelector(false)
  }

  const handleSave = async () => {
    if (!user || !krediDetay) return

    setSaving(true)
    try {
      const updateData = {
        ...formData,
        updated_at: new Date().toISOString(),
      }

      await updateCredit(creditId, updateData)

      toast({
        title: "Başarılı",
        description: "Kredi bilgileri başarıyla güncellendi.",
      })

      router.push(`/uygulama/kredi-detay/${creditId}`)
    } catch (err) {
      console.error("Kredi güncelleme hatası:", err)
      toast({
        title: "Hata",
        description: "Kredi bilgileri güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEditPlan = (plan: PaymentPlan) => {
    setEditingPlan(plan.id)
    setEditingPlanData({
      due_date: plan.due_date,
      principal_amount: plan.principal_amount,
      interest_amount: plan.interest_amount,
      total_payment: plan.total_payment,
      status: plan.status,
    })
  }

  const handleSavePlan = async (planId: string) => {
    try {
      const updatedPlan = await updatePaymentPlan(planId, editingPlanData)
      setPaymentPlans((prev) => prev.map((p) => (p.id === planId ? updatedPlan : p)))
      setEditingPlan(null)
      setEditingPlanData({})
      toast({
        title: "Başarılı",
        description: "Ödeme planı güncellendi.",
      })
    } catch (err) {
      console.error("Error updating payment plan:", err)
      toast({
        title: "Hata",
        description: "Ödeme planı güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleCancelEdit = () => {
    setEditingPlan(null)
    setEditingPlanData({})
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Ödendi
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Bekliyor
          </Badge>
        )
      case "overdue":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Gecikmiş
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const selectedBank = banks.find((b) => b.id === formData.bank_id)
  const selectedCreditType = creditTypes.find((ct) => ct.id === formData.credit_type_id)

  if (authLoading || loadingData) {
    return (
      <div className="flex flex-col gap-4 md:gap-6 items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
        <p className="text-lg text-gray-600">Kredi bilgileri yükleniyor...</p>
      </div>
    )
  }

  if (error || !krediDetay) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg text-red-600">{error || "Kredi bulunamadı."}</p>
        <Button onClick={() => router.back()} className="mt-4">
          Geri Dön
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.back()}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-4">
                <BankLogo
                  bankName={selectedBank?.name || krediDetay.banks?.name || "Bilinmeyen Banka"}
                  size="lg"
                  className="bg-white/20 border-2 border-white"
                />
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">Kredi Düzenle</h1>
                  <p className="text-blue-100 text-lg">
                    {formData.credit_code} - {selectedBank?.name || krediDetay.banks?.name || "N/A"}
                  </p>
                  <p className="text-blue-200 text-sm">
                    {selectedCreditType?.name || krediDetay.credit_types?.name || "N/A"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg border border-blue-500/20"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <X className="mr-2 h-4 w-4" />
                İptal
              </Button>
            </div>
          </div>

          {/* Özet Bilgiler */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
            <div className="text-center">
              <p className="text-blue-100 text-sm mb-1">Başlangıç Tutarı</p>
              <p className="text-2xl md:text-3xl font-bold">{formatCurrency(formData.initial_amount)}</p>
            </div>
            <div className="text-center">
              <p className="text-blue-100 text-sm mb-1">Kalan Borç</p>
              <p className="text-2xl md:text-3xl font-bold">{formatCurrency(formData.remaining_debt)}</p>
            </div>
            <div className="text-center">
              <p className="text-blue-100 text-sm mb-1">Aylık Ödeme</p>
              <p className="text-2xl md:text-3xl font-bold">{formatCurrency(formData.monthly_payment)}</p>
            </div>
            <div className="text-center">
              <p className="text-blue-100 text-sm mb-1">Faiz Oranı</p>
              <p className="text-2xl md:text-3xl font-bold">%{formData.interest_rate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Tabs - Kredi Detay Sayfasıyla Aynı Tasarım */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-gray-100 bg-gray-100">
            <TabsList className="grid grid-cols-2 bg-transparent h-auto p-2 gap-2">
              <TabsTrigger
                value="credit-info"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Kredi Bilgileri</span>
                <span className="sm:hidden font-medium">Bilgiler</span>
              </TabsTrigger>
              <TabsTrigger
                value="payment-plan"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <CalendarDays className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Ödeme Planı</span>
                <span className="sm:hidden font-medium">Plan</span>
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="p-6">
            {/* Kredi Bilgileri Tab */}
            {activeTab === "credit-info" && (
              <div className="space-y-6">
                {/* Temel Kredi Bilgileri */}
                <Card className="shadow-sm border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      Temel Kredi Bilgileri
                    </CardTitle>
                    <CardDescription>Kredinin temel bilgilerini düzenleyin</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="credit_code" className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          Kredi Kodu
                        </Label>
                        <Input
                          id="credit_code"
                          value={formData.credit_code}
                          onChange={(e) => handleInputChange("credit_code", e.target.value)}
                          placeholder="Kredi kodunu girin"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="account_number" className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          Hesap Numarası
                        </Label>
                        <Input
                          id="account_number"
                          value={formData.account_number}
                          onChange={(e) => handleInputChange("account_number", e.target.value)}
                          placeholder="Hesap numarasını girin"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customer_number" className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Müşteri Numarası
                        </Label>
                        <Input
                          id="customer_number"
                          value={formData.customer_number}
                          onChange={(e) => handleInputChange("customer_number", e.target.value)}
                          placeholder="Müşteri numarasını girin"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="credit_score" className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Kredi Notu
                        </Label>
                        <Input
                          id="credit_score"
                          value={formData.credit_score}
                          onChange={(e) => handleInputChange("credit_score", e.target.value)}
                          placeholder="Kredi notunu girin"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Banka
                        </Label>
                        <Button
                          variant="outline"
                          onClick={() => setShowBankSelector(true)}
                          className="w-full justify-start h-auto p-4"
                        >
                          {selectedBank ? (
                            <div className="flex items-center gap-3">
                              <BankLogo bankName={selectedBank.name} size="sm" />
                              <div className="text-left">
                                <p className="font-medium">{selectedBank.name}</p>
                                <p className="text-sm text-gray-500">Banka seçildi</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <Building className="h-4 w-4 text-gray-400" />
                              </div>
                              <span className="text-gray-500">Banka seçin</span>
                            </div>
                          )}
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Kredi Türü
                        </Label>
                        <Button
                          variant="outline"
                          onClick={() => setShowCreditTypeSelector(true)}
                          className="w-full justify-start h-auto p-4"
                        >
                          {selectedCreditType ? (
                            <div className="text-left">
                              <p className="font-medium">{selectedCreditType.name}</p>
                              <p className="text-sm text-gray-500">{selectedCreditType.description}</p>
                            </div>
                          ) : (
                            <span className="text-gray-500">Kredi türü seçin</span>
                          )}
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="branch_name" className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Şube Adı
                        </Label>
                        <Input
                          id="branch_name"
                          value={formData.branch_name}
                          onChange={(e) => handleInputChange("branch_name", e.target.value)}
                          placeholder="Şube adını girin"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Finansal Bilgiler */}
                <Card className="shadow-sm border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      Finansal Bilgiler
                    </CardTitle>
                    <CardDescription>Kredinin finansal detaylarını düzenleyin</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="initial_amount">Başlangıç Tutarı (₺)</Label>
                        <Input
                          id="initial_amount"
                          type="number"
                          value={formData.initial_amount}
                          onChange={(e) => handleInputChange("initial_amount", Number.parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="remaining_debt">Kalan Borç (₺)</Label>
                        <Input
                          id="remaining_debt"
                          type="number"
                          value={formData.remaining_debt}
                          onChange={(e) => handleInputChange("remaining_debt", Number.parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="monthly_payment">Aylık Ödeme (₺)</Label>
                        <Input
                          id="monthly_payment"
                          type="number"
                          value={formData.monthly_payment}
                          onChange={(e) => handleInputChange("monthly_payment", Number.parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="total_payback">Toplam Geri Ödeme (₺)</Label>
                        <Input
                          id="total_payback"
                          type="number"
                          value={formData.total_payback}
                          onChange={(e) => handleInputChange("total_payback", Number.parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="interest_rate" className="flex items-center gap-2">
                          <Percent className="h-4 w-4" />
                          Faiz Oranı (%)
                        </Label>
                        <Input
                          id="interest_rate"
                          type="number"
                          step="0.01"
                          value={formData.interest_rate}
                          onChange={(e) => handleInputChange("interest_rate", Number.parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Kredi Durumu</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value: "active" | "closed" | "overdue") => handleInputChange("status", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Aktif</SelectItem>
                            <SelectItem value="closed">Kapalı</SelectItem>
                            <SelectItem value="overdue">Gecikmiş</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tarih ve Taksit Bilgileri */}
                <Card className="shadow-sm border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                     
                      Tarih ve Taksit Bilgileri
                    </CardTitle>
                    <CardDescription>Kredi tarihlerini ve taksit bilgilerini düzenleyin</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="start_date">Başlangıç Tarihi</Label>
                        <Input
                          id="start_date"
                          type="date"
                          value={formData.start_date}
                          onChange={(e) => handleInputChange("start_date", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end_date">Bitiş Tarihi</Label>
                        <Input
                          id="end_date"
                          type="date"
                          value={formData.end_date}
                          onChange={(e) => handleInputChange("end_date", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="total_installments">Toplam Taksit Sayısı</Label>
                        <Input
                          id="total_installments"
                          type="number"
                          value={formData.total_installments}
                          onChange={(e) =>
                            handleInputChange("total_installments", Number.parseInt(e.target.value) || 0)
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="remaining_installments">Kalan Taksit Sayısı</Label>
                        <Input
                          id="remaining_installments"
                          type="number"
                          value={formData.remaining_installments}
                          onChange={(e) =>
                            handleInputChange("remaining_installments", Number.parseInt(e.target.value) || 0)
                          }
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Teminat ve Sigorta */}
                <Card className="shadow-sm border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                    
                      Teminat ve Sigorta
                    </CardTitle>
                    <CardDescription>Teminat ve sigorta bilgilerini düzenleyin</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="collateral">Teminat</Label>
                      <Textarea
                        id="collateral"
                        value={formData.collateral}
                        onChange={(e) => handleInputChange("collateral", e.target.value)}
                        placeholder="Teminat bilgilerini girin"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="insurance_status">Sigorta Durumu</Label>
                      <Input
                        id="insurance_status"
                        value={formData.insurance_status}
                        onChange={(e) => handleInputChange("insurance_status", e.target.value)}
                        placeholder="Sigorta durumunu girin"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Ödeme Planı Tab */}
            {activeTab === "payment-plan" && (
              <div className="space-y-6">
                <Card className="shadow-sm border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <CalendarDays className="h-5 w-5 text-blue-600" />
                      Ödeme Planı
                    </CardTitle>
                    <CardDescription>Kredinin ödeme planını görüntüleyin ve düzenleyin</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingPaymentPlans ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        <span className="ml-2 text-gray-600">Ödeme planı yükleniyor...</span>
                      </div>
                    ) : paymentPlans.length === 0 ? (
                      <div className="text-center py-8">
                        <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Bu kredi için ödeme planı bulunamadı.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Taksit No</TableHead>
                              <TableHead>Vade Tarihi</TableHead>
                              <TableHead>Ana Para</TableHead>
                              <TableHead>Faiz</TableHead>
                              <TableHead>Toplam Ödeme</TableHead>
                              <TableHead>Kalan Borç</TableHead>
                              <TableHead>Durum</TableHead>
                              <TableHead>İşlemler</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paymentPlans.map((plan) => (
                              <TableRow key={plan.id}>
                                <TableCell className="font-medium">{plan.installment_number}</TableCell>
                                <TableCell>
                                  {editingPlan === plan.id ? (
                                    <Input
                                      type="date"
                                      value={editingPlanData.due_date || plan.due_date}
                                      onChange={(e) =>
                                        setEditingPlanData((prev) => ({ ...prev, due_date: e.target.value }))
                                      }
                                      className="w-32"
                                    />
                                  ) : (
                                    new Date(plan.due_date).toLocaleDateString("tr-TR")
                                  )}
                                </TableCell>
                                <TableCell>
                                  {editingPlan === plan.id ? (
                                    <Input
                                      type="number"
                                      value={editingPlanData.principal_amount || plan.principal_amount}
                                      onChange={(e) =>
                                        setEditingPlanData((prev) => ({
                                          ...prev,
                                          principal_amount: Number.parseFloat(e.target.value) || 0,
                                        }))
                                      }
                                      className="w-24"
                                    />
                                  ) : (
                                    formatCurrency(plan.principal_amount)
                                  )}
                                </TableCell>
                                <TableCell>
                                  {editingPlan === plan.id ? (
                                    <Input
                                      type="number"
                                      value={editingPlanData.interest_amount || plan.interest_amount}
                                      onChange={(e) =>
                                        setEditingPlanData((prev) => ({
                                          ...prev,
                                          interest_amount: Number.parseFloat(e.target.value) || 0,
                                        }))
                                      }
                                      className="w-24"
                                    />
                                  ) : (
                                    formatCurrency(plan.interest_amount)
                                  )}
                                </TableCell>
                                <TableCell>
                                  {editingPlan === plan.id ? (
                                    <Input
                                      type="number"
                                      value={editingPlanData.total_payment || plan.total_payment}
                                      onChange={(e) =>
                                        setEditingPlanData((prev) => ({
                                          ...prev,
                                          total_payment: Number.parseFloat(e.target.value) || 0,
                                        }))
                                      }
                                      className="w-24"
                                    />
                                  ) : (
                                    formatCurrency(plan.total_payment)
                                  )}
                                </TableCell>
                                <TableCell>{formatCurrency(plan.remaining_debt)}</TableCell>
                                <TableCell>
                                  {editingPlan === plan.id ? (
                                    <Select
                                      value={editingPlanData.status || plan.status}
                                      onValueChange={(value: "paid" | "pending" | "overdue") =>
                                        setEditingPlanData((prev) => ({ ...prev, status: value }))
                                      }
                                    >
                                      <SelectTrigger className="w-24">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Bekliyor</SelectItem>
                                        <SelectItem value="paid">Ödendi</SelectItem>
                                        <SelectItem value="overdue">Gecikmiş</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    getStatusBadge(plan.status)
                                  )}
                                </TableCell>
                                <TableCell>
                                  {editingPlan === plan.id ? (
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => handleSavePlan(plan.id)}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        <CheckCircle className="h-3 w-3" />
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button size="sm" variant="outline" onClick={() => handleEditPlan(plan)}>
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </Tabs>
      </div>

      {/* Kaydet/İptal Butonları */}
      <div className="flex justify-end gap-4 pt-6">
        <Button variant="outline" onClick={() => router.back()} disabled={saving}>
          <X className="mr-2 h-4 w-4" />
          İptal
        </Button>
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
        </Button>
      </div>

      {/* Bank Selector Modal */}
      {showBankSelector && (
        <BankSelector banks={banks} onBankSelect={handleBankSelect} onSkip={() => setShowBankSelector(false)} />
      )}

      {/* Credit Type Selector Modal */}
      {showCreditTypeSelector && (
        <CreditTypeSelector
          open={showCreditTypeSelector}
          onOpenChange={setShowCreditTypeSelector}
          onSelect={handleCreditTypeSelect}
          selectedCreditType={selectedCreditType}
          creditTypes={creditTypes}
        />
      )}
    </div>
  )
}
