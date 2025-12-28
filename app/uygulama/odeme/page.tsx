"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Lock, ArrowLeft, Shield, Zap, Clock, Building2, CheckCircle2, CreditCard, AlertCircle, ChevronRight, Check, CheckCircle, ExternalLink } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useSubscriptionV2 } from "@/hooks/use-subscription-v2"
import { useAuth } from "@/hooks/use-auth"
import { turkishCities, cityDistricts } from "@/lib/turkish-cities"
import { getPlanById } from "@/lib/subscription-plans"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LoadingSpinner } from "@/components/loading-screen"
import { cn } from "@/lib/utils"
import PayTRCardForm from "@/components/paytr-card-form"

export default function PaymentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { refresh: refreshSubscription } = useSubscriptionV2()
  const { user, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()

  // Step management
  const [currentStep, setCurrentStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedCityCode, setSelectedCityCode] = useState("")
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([])
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [kvkkAccepted, setKvkkAccepted] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showTermsDialog, setShowTermsDialog] = useState(false)
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false)
  const [showKvkkDialog, setShowKvkkDialog] = useState(false)
  const [billingInfo, setBillingInfo] = useState({
    fullName: "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    district: "",
    zipCode: "",
    identityNumber: "",
    taxOffice: "",
    taxNumber: "",
  })

  // Plan bilgisini al
  const planId = searchParams.get("plan")
  const selectedPlan = planId ? getPlanById(planId) : null

  // Plan seçilmeden ödeme sayfasına erişimi engelle
  useEffect(() => {
    if (!planId && !authLoading) {
      toast({
        title: "Plan Seçilmedi",
        description: "Lütfen önce bir plan seçin.",
        variant: "destructive",
      })
      router.push("/uygulama/premium")
    }
  }, [planId, authLoading, router, toast])

  // City districts effect
  useEffect(() => {
    if (selectedCityCode && cityDistricts[selectedCityCode]) {
      setAvailableDistricts(cityDistricts[selectedCityCode])
    } else {
      setAvailableDistricts([])
    }
  }, [selectedCityCode])

  // Pre-fill email from user
  useEffect(() => {
    if (user?.email && !billingInfo.email) {
      setBillingInfo((prev) => ({ ...prev, email: user.email! }))
    }
  }, [user, billingInfo.email])

  // Early return after all hooks
  if (!selectedPlan) {
    return null
  }

  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === "identityNumber" || name === "phone") {
      const formatted = value.replace(/\D/g, "").slice(0, 11)
      setBillingInfo((prev) => ({ ...prev, [name]: formatted }))
    } else {
      setBillingInfo((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleCityChange = (value: string) => {
    const city = turkishCities.find((c) => c.code === value)
    if (city) {
      setSelectedCityCode(value)
      setBillingInfo((prev) => ({ ...prev, city: city.name, district: "" }))
    }
  }

  const handleDistrictChange = (value: string) => {
    setBillingInfo((prev) => ({ ...prev, district: value }))
  }

  const validateBillingInfo = () => {
    if (billingInfo.identityNumber.length !== 11) {
      toast({
        title: "Geçersiz TC Kimlik No",
        description: "TC Kimlik No 11 haneli olmalıdır",
        variant: "destructive",
      })
      return false
    }

    if (billingInfo.phone.length < 10) {
      toast({
        title: "Geçersiz Telefon",
        description: "Geçerli bir telefon numarası giriniz",
        variant: "destructive",
      })
      return false
    }

    if (!billingInfo.city || !billingInfo.district) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen il ve ilçe seçiniz",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateBillingInfo()) {
      return
    }

    if (!user) {
      toast({
        title: "Oturum Hatası",
        description: "Kullanıcı oturumu bulunamadı. Lütfen tekrar giriş yapın.",
        variant: "destructive",
      })
      return
    }

    // Move to payment step (step 2)
    setCurrentStep(2)
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const steps = [
    { number: 1, title: "Fatura Bilgileri", icon: Building2 },
    { number: 2, title: "Ödeme", icon: CreditCard },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="overflow-hidden border-0 shadow-xl rounded-2xl">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-8 text-white relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mt-32 -mr-32"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white opacity-5 rounded-full -mb-20 -ml-20"></div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <Link href="/uygulama/premium">
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Premium Ödeme</h1>
                <p className="text-emerald-100 text-lg">PCI-DSS uyumlu güvenli ödeme</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-100">
                  <Shield className="h-5 w-5" />
                  <span>Güvenli Ödeme</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-100">
                  <Zap className="h-5 w-5" />
                  <span>Hızlı İşlem</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-100">
                  <Clock className="h-5 w-5" />
                  <span>Anında Aktivasyon</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Step Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.number
              const isCompleted = currentStep > step.number

              return (
                <React.Fragment key={step.number}>
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all",
                        isCompleted
                          ? "bg-gradient-to-br from-emerald-600 to-teal-600 border-emerald-600 text-white"
                          : isActive
                          ? "bg-gradient-to-br from-emerald-600 to-teal-600 border-emerald-600 text-white"
                          : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-400"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-6 w-6" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </div>
                    <div className="hidden md:block">
                      <p
                        className={cn(
                          "font-medium",
                          isActive || isCompleted
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-500 dark:text-gray-400"
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Adım {step.number}/2
                      </p>
                    </div>
                  </div>

                  {index < steps.length - 1 && (
                    <div className="flex-1 mx-4">
                      <div
                        className={cn(
                          "h-0.5 w-full transition-all",
                          isCompleted
                            ? "bg-emerald-600"
                            : "bg-gray-200 dark:bg-gray-700"
                        )}
                      />
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Billing Information */}
      {currentStep === 1 && (
        <form onSubmit={handleNextStep} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                    Fatura Bilgileri
                  </CardTitle>
                  <CardDescription>
                    Fatura bilgilerinizi girin. Bir sonraki adımda PayTR üzerinden güvenli ödeme yapacaksınız.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Ad Soyad *</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        placeholder="Akın Kaya"
                        value={billingInfo.fullName}
                        onChange={handleBillingChange}
                        required
                        disabled={isProcessing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">E-posta *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="akin@example.com"
                        value={billingInfo.email}
                        onChange={handleBillingChange}
                        required
                        disabled={isProcessing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        placeholder="05551234567"
                        value={billingInfo.phone}
                        onChange={handleBillingChange}
                        required
                        disabled={isProcessing}
                        maxLength={11}
                      />
                      <p className="text-xs text-gray-500 dark:text-white/60">
                        Başında 0 ile birlikte 11 hane
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="identityNumber">TC Kimlik No *</Label>
                      <Input
                        id="identityNumber"
                        name="identityNumber"
                        placeholder="12345678901"
                        value={billingInfo.identityNumber}
                        onChange={handleBillingChange}
                        maxLength={11}
                        required
                        disabled={isProcessing}
                      />
                      <p className="text-xs text-gray-500 dark:text-white/60">
                        Ödeme sağlayıcısı tarafından zorunludur
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">İl *</Label>
                      <Select value={selectedCityCode} onValueChange={handleCityChange} disabled={isProcessing} required>
                        <SelectTrigger>
                          <SelectValue placeholder="İl seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          {turkishCities.map((city) => (
                            <SelectItem key={city.code} value={city.code}>
                              {city.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="district">İlçe *</Label>
                      <Select
                        value={billingInfo.district}
                        onValueChange={handleDistrictChange}
                        disabled={isProcessing || !selectedCityCode || availableDistricts.length === 0}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={selectedCityCode ? "İlçe seçiniz" : "Önce il seçiniz"} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDistricts.map((district) => (
                            <SelectItem key={district} value={district}>
                              {district}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Adres *</Label>
                      <Input
                        id="address"
                        name="address"
                        placeholder="Mahalle, Sokak, No"
                        value={billingInfo.address}
                        onChange={handleBillingChange}
                        required
                        disabled={isProcessing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Posta Kodu *</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        placeholder="34000"
                        value={billingInfo.zipCode}
                        onChange={handleBillingChange}
                        required
                        disabled={isProcessing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="taxOffice">Vergi Dairesi (Opsiyonel)</Label>
                      <Input
                        id="taxOffice"
                        name="taxOffice"
                        placeholder="Kadıköy Vergi Dairesi"
                        value={billingInfo.taxOffice}
                        onChange={handleBillingChange}
                        disabled={isProcessing}
                      />
                      <p className="text-xs text-gray-500 dark:text-white/60">
                        Kurumsal fatura için gereklidir
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="taxNumber">Vergi Numarası (Opsiyonel)</Label>
                      <Input
                        id="taxNumber"
                        name="taxNumber"
                        placeholder="1234567890"
                        value={billingInfo.taxNumber}
                        onChange={handleBillingChange}
                        maxLength={10}
                        disabled={isProcessing}
                      />
                      <p className="text-xs text-gray-500 dark:text-white/60">
                        Kurumsal fatura için gereklidir
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="sticky top-6 dark:bg-black/20">
                <CardHeader>
                  <CardTitle>Ödeme Özeti</CardTitle>
                  <CardDescription>Seçtiğiniz plan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-white/60">{selectedPlan.name}:</span>
                      <span className="font-medium">{selectedPlan.price}₺</span>
                    </div>
                    <div className="flex justify-between text-sm">
                       <span className="text-gray-600 dark:text-white/60">Periyot:</span>
                      <span className="font-medium">
                        {selectedPlan.period === "monthly"
                          ? "Aylık"
                          : selectedPlan.period === "yearly"
                            ? "Yıllık"
                            : selectedPlan.periodLabel}
                      </span>
                    </div>
                    {selectedPlan.originalPrice && (
                      <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                        <span>Tasarruf:</span>
                        <span className="font-medium">
                          {selectedPlan.originalPrice - selectedPlan.price}₺
                        </span>
                      </div>
                    )}
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Toplam:</span>
                        <span className="text-emerald-600 dark:text-emerald-400">{selectedPlan.price}₺</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 space-y-3">
                    <Button type="submit" className="w-full" disabled={isProcessing}>
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Hazırlanıyor...
                        </>
                      ) : (
                        <>
                          Ödemeye Geç
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>

                    <Link href="/uygulama/premium" className="block">
                      <Button type="button" variant="outline" className="w-full bg-transparent" disabled={isProcessing}>
                        İptal
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-black/20">
                <CardHeader>
                  <CardTitle>Güvenlik Özellikleri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">PCI-DSS Uyumlu</p>
                      <p className="text-sm text-gray-600 dark:text-white/60">
                        Kart bilgileriniz sunucularımıza gelmez
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">PayTR Güvencesi</p>
                      <p className="text-sm text-gray-600 dark:text-white/60">
                        3D Secure ile güvenli ödeme
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">256-bit SSL</p>
                      <p className="text-sm text-gray-600 dark:text-white/60">
                        Tüm iletişim şifrelenir
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      )}

      {/* Step 2: Payment */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="dark:bg-black/20">
                <CardHeader>
                  <CardTitle>Güvenli Ödeme</CardTitle>
                  <CardDescription>
                    Ödemeleriniz PayTR'nin 3D Secure güvenli altyapısında işlenir.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* PayTR Logo and Info */}
                  <div className="flex flex-col items-center justify-center py-6 border-b">
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-4 rounded-lg mb-4">
                      <div className="text-white text-2xl font-bold">PayTR</div>
                    </div>
                    <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                      PayTR ile 3D Secure güvenli ödeme yapmak için aşağıdaki koşulları kabul edin ve kart bilgilerinizi girin.
                    </p>
                  </div>

                  {/* Terms and Conditions Checkboxes */}
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-3 rounded-lg border hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                      <Checkbox
                        id="terms-check"
                        checked={termsAccepted}
                        onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                        className="mt-0.5"
                      />
                      <label
                        htmlFor="terms-check"
                        className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed cursor-pointer flex-1"
                      >
                        <button
                          type="button"
                          onClick={() => setShowTermsDialog(true)}
                          className="text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center font-medium"
                        >
                          Kullanım Koşulları
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </button>
                        'nı okudum ve kabul ediyorum.
                      </label>
                    </div>

                    <div className="flex items-start space-x-3 p-3 rounded-lg border hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                      <Checkbox
                        id="privacy-check"
                        checked={privacyAccepted}
                        onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
                        className="mt-0.5"
                      />
                      <label
                        htmlFor="privacy-check"
                        className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed cursor-pointer flex-1"
                      >
                        <button
                          type="button"
                          onClick={() => setShowPrivacyDialog(true)}
                          className="text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center font-medium"
                        >
                          İptal-İade Politikası
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </button>
                        'nı okudum ve kabul ediyorum.
                      </label>
                    </div>

                    <div className="flex items-start space-x-3 p-3 rounded-lg border hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                      <Checkbox
                        id="kvkk-check"
                        checked={kvkkAccepted}
                        onCheckedChange={(checked) => setKvkkAccepted(checked as boolean)}
                        className="mt-0.5"
                      />
                      <label
                        htmlFor="kvkk-check"
                        className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed cursor-pointer flex-1"
                      >
                        <button
                          type="button"
                          onClick={() => setShowKvkkDialog(true)}
                          className="text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center font-medium"
                        >
                          KVKK Aydınlatma Metni
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </button>
                        'ni okudum ve kabul ediyorum.
                      </label>
                    </div>
                  </div>

                  {/* PayTR Card Form - Always visible */}
                  <PayTRCardForm
                    planId={selectedPlan.id}
                    planName={selectedPlan.name}
                    price={selectedPlan.price}
                    userId={user?.id || ''}
                    userEmail={billingInfo.email}
                    termsAccepted={termsAccepted && privacyAccepted && kvkkAccepted}
                    onSuccess={() => {
                      refreshSubscription()
                      router.push('/uygulama/odeme/basarili')
                    }}
                    onError={(error) => {
                      toast({
                        title: "Ödeme Hatası",
                        description: error,
                        variant: "destructive",
                      })
                    }}
                  />

                  {/* Warning when terms not accepted */}
                  {(!termsAccepted || !privacyAccepted || !kvkkAccepted) && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Ödeme yapmak için lütfen yukarıdaki tüm koşulları okuyup kabul edin.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 gap-2 pt-2">
                    <Shield className="h-4 w-4" />
                    <span>256-bit SSL</span>
                    <span>•</span>
                    <Lock className="h-4 w-4" />
                    <span>PCI-DSS Sertifikalı</span>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="w-full sm:w-auto"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Fatura Bilgilerine Dön
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              <Card className="sticky top-6 dark:bg-black/20">
                <CardHeader>
                  <CardTitle>Ödeme Özeti</CardTitle>
                  <CardDescription>Seçtiğiniz plan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-white/60">{selectedPlan.name}:</span>
                      <span className="font-medium">{selectedPlan.price}₺</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-white/60">Periyot:</span>
                      <span className="font-medium">
                        {selectedPlan.period === "monthly"
                          ? "Aylık"
                          : selectedPlan.period === "yearly"
                            ? "Yıllık"
                            : selectedPlan.periodLabel}
                      </span>
                    </div>
                    {selectedPlan.originalPrice && (
                      <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                        <span>Tasarruf:</span>
                        <span className="font-medium">
                          {selectedPlan.originalPrice - selectedPlan.price}₺
                        </span>
                      </div>
                    )}
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Toplam:</span>
                        <span className="text-emerald-600 dark:text-emerald-400">{selectedPlan.price}₺</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-black/20">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle>Güvenli Ödeme</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Ödemeleriniz PayTR'nin 3D Secure güvenli altyapısında işlenir.
                    Kart bilgileriniz şifrelenerek PayTR'ye gönderilir ve sunucularımızda saklanmaz.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Terms Dialog */}
      <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Kullanım Koşulları</DialogTitle>
            <DialogDescription>
              Lütfen kullanım koşullarını okuyun ve kabul edin
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4 text-sm">
              <p className="text-gray-700 dark:text-gray-300">
                Bu Şartlar, Kredi Takip uygulamasının kullanımına ilişkin kuralları düzenler.
                <strong> Uygulamaya erişen tüm kullanıcılar bu şartları kabul etmiş sayılır.</strong>
              </p>

              <h3 className="font-semibold text-base">1. Hizmet Tanımı</h3>
              <div className="text-gray-700 dark:text-gray-300 space-y-2">
                <p>
                  Kredi Takip, kullanıcıların yüklediği kredi dökümanlarını işleyerek dijital planlara dönüştürür ve
                  kullanıcıya takibi kolaylaştırır.
                </p>
                <p>
                  Ayrıca, kullanıcının tercihiyle, internet bankacılığı şifreleri şifrelenmiş şekilde saklanabilir.
                </p>
                <p><strong>Sunulan Hizmetler:</strong></p>
                <p>• OCR teknolojisi ile döküm analizi</p>
                <p>• Akıllı ödeme planı oluşturma</p>
                <p>• Finansal analiz ve raporlama</p>
                <p>• Güvenli veri saklama</p>
              </div>

              <h3 className="font-semibold text-base">2. Sorumluluk Reddi</h3>
              <div className="text-gray-700 dark:text-gray-300 space-y-2">
                <p>
                  <strong>
                    Uygulama, kullanıcıların yüklediği içeriklerin doğruluğundan veya güncelliğinden sorumlu değildir.
                  </strong>
                </p>
                <p>
                  <strong>
                    Uygulama, herhangi bir banka, finans kurumu veya kamu kuruluşu ile doğrudan bağlantılı değildir.
                  </strong>
                </p>
                <p>
                  <strong>
                    Otomasyon çıktıları yalnızca kullanıcı bilgilendirme amaçlıdır; resmi belge niteliği taşımaz.
                  </strong>
                </p>
                <p className="text-yellow-600 dark:text-yellow-400">
                  ⚠️ Önemli: Finansal kararlarınızı alırken mutlaka uzman görüşü alın ve resmi belgelerinizi kontrol
                  edin.
                </p>
              </div>

              <h3 className="font-semibold text-base">2.1. Finansal Danışmanlık Feragatnamesi</h3>
              <div className="text-gray-700 dark:text-gray-300 space-y-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-600 dark:text-red-300 font-bold">
                  ⚠️ ÖNEMLİ UYARI: BU BİR FİNANSAL DANIŞMANLIK HİZMETİ DEĞİLDİR
                </p>
                <p>
                  <strong>Kredi Takip,</strong> SPK (Sermaye Piyasası Kurulu) lisanslı bir yatırım danışmanlığı
                  firması DEĞİLDİR. Uygulamamızda sunulan:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>AI Finansal Sağlık Özeti</li>
                  <li>Risk Analizi Raporları</li>
                  <li>Ödeme Planı Optimizasyonları</li>
                </ul>
                <p>
                  <strong className="text-yellow-600 dark:text-yellow-400">
                    YALNIZCA BİLGİLENDİRME AMAÇLIDIR ve yatırım tavsiyesi niteliği taşımaz.
                  </strong>
                </p>
                <p>
                  Finansal kararlarınızı almadan önce <strong>lisanslı bir finansal danışmana</strong> veya
                  bankanıza danışmanız şiddetle tavsiye edilir.
                </p>
              </div>

              <h3 className="font-semibold text-base">3. Kullanıcının Yükümlülükleri</h3>
              <div className="text-gray-700 dark:text-gray-300 space-y-2">
                <p><strong>Veri Sorumluluğu:</strong></p>
                <p>• Sisteme yüklenen içerikler (PDF vb.) kullanıcının sorumluluğundadır</p>
                <p><strong>• Üçüncü kişilere ait verilerin izinsiz yüklenmesi hukuken yasaktır</strong></p>
                <p>• Yükleyen kişi tüm hukuki sonuçları üstlenir</p>

                <p><strong>Hesap Güvenliği:</strong></p>
                <p>• Kullanıcı hesabının güvenliği kullanıcıya aittir</p>
                <p>• Güçlü şifre kullanımı zorunludur</p>
                <p><strong>• Yetkisiz erişim riski oluşması durumunda derhal bildirim yapılmalıdır</strong></p>
              </div>

              <h3 className="font-semibold text-base">4. Hesabın Kapatılması</h3>
              <div className="text-gray-700 dark:text-gray-300 space-y-2">
                <p><strong>Kullanıcı Tarafından:</strong> Kullanıcı dilerse hesabını istediği zaman silebilir.</p>
                <p>
                  <strong>Platform Tarafından:</strong> Kullanım koşullarına aykırı hareket eden kullanıcıların hesabı
                  uyarı yapılmaksızın askıya alınabilir veya kapatılabilir.
                </p>

                <p><strong>Hesap Kapatma Sebepleri:</strong></p>
                <p>• Sahte bilgi kullanımı</p>
                <p>• Üçüncü kişi verilerinin izinsiz yüklenmesi</p>
                <p>• Sistem güvenliğini tehdit edici faaliyetler</p>
                <p>• Yasal olmayan kullanım</p>
              </div>

              <h3 className="font-semibold text-base">5. Abonelikler ve Ödemeler</h3>
              <div className="text-gray-700 dark:text-gray-300 space-y-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                <p>
                  <strong>Premium Abonelik:</strong> Kredi Takip Premium özelliklerine aylık veya yıllık abonelik satın alabilirsiniz.
                </p>

                <p><strong className="text-emerald-700 dark:text-emerald-300">Paddle ile Güvenli Ödeme:</strong></p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Tüm ödemeler Paddle.com güvencesi altında PCI-DSS Level 1 sertifikalı altyapı üzerinden işlenir</li>
                  <li>Kredi kartı bilgileriniz hiçbir zaman sunucularımızda saklanmaz</li>
                  <li>Paddle, 135+ ülkede otomatik vergi hesaplaması yapar</li>
                  <li>Ödemeleriniz SSL/TLS şifrelemesi ile korunur</li>
                </ul>

                <p><strong>Abonelik Yönetimi:</strong></p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Abonelikleriniz Paddle müşteri portalı üzerinden yönetilir</li>
                  <li>Ödeme bilgilerinizi güncellemek, plan değiştirmek veya iptal etmek için portalı kullanabilirsiniz</li>
                  <li>Abonelik durumunuz hakkında otomatik e-posta bildirimleri alırsınız</li>
                </ul>

                <p><strong>Abonelik İptali:</strong></p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Aboneliğinizi istediğiniz zaman, herhangi bir ceza ödemeden iptal edebilirsiniz</li>
                  <li>İptal ettiğinizde, mevcut abonelik döneminizin sonuna kadar Premium özelliklere erişiminiz devam eder</li>
                  <li>İptal Paddle müşteri portalı üzerinden veya destek talebi ile yapılabilir</li>
                </ul>
              </div>

              <h3 className="font-semibold text-base">6. Uyuşmazlık</h3>
              <div className="text-gray-700 dark:text-gray-300 space-y-1">
                <p>
                  Taraflar arasında çıkabilecek uyuşmazlıklarda{" "}
                  <strong>İstanbul Merkez Mahkemeleri ve İcra Daireleri</strong> yetkilidir.
                </p>
                <p>• Türk Hukuku uygulanır</p>
                <p>• Öncelikle dostane çözüm aranır</p>
                <p>• Arabuluculuk tercih edilir</p>
              </div>

              <h3 className="font-semibold text-base mt-4">İletişim Bilgileri</h3>
              <div className="text-gray-700 dark:text-gray-300 space-y-1">
                <p><strong>Şirket:</strong> Kredi Takip</p>
                <p><strong>Adres:</strong> Çeşme, İzmir, Turkey</p>
                <p>
                  <strong>E-posta:</strong>{" "}
                  <a href="mailto:info@kreditakip.com.tr" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                    info@kreditakip.com.tr
                  </a>
                </p>
                <p>
                  <strong>Telefon:</strong>{" "}
                  <a href="tel:+905432035309" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                    0 543 203 53 09
                  </a>
                </p>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              onClick={() => {
                setTermsAccepted(true)
                setShowTermsDialog(false)
                toast({
                  title: "Onaylandı",
                  description: "Kullanım koşullarını kabul ettiniz.",
                })
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Onaylıyorum
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Dialog */}
      <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>İptal ve İade Politikası</DialogTitle>
            <DialogDescription>
              Lütfen iptal ve iade koşullarını okuyun ve kabul edin
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4 text-sm">
              <p className="text-gray-700 dark:text-gray-300">
                Kredi Takip olarak kullanıcılarımıza adil, şeffaf ve güvenilir bir deneyim sunmayı amaçlıyoruz.
                Aşağıdaki iptal ve iade koşulları, ödeme sağlayıcımız Paddle tarafından belirlenen uluslararası standartlarla uyumludur.
              </p>

              <h3 className="font-semibold text-base">1. 14 Günlük İade Hakkı (Cayma Hakkı)</h3>
              <div className="text-gray-700 dark:text-gray-300 space-y-2">
                <p>
                  Kullanıcılarımız, satın alma tarihinden itibaren <strong>14 gün içinde</strong> herhangi bir gerekçe göstermeden iade talep etmeye hak kazanır.
                </p>

                <p className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                  Bu iade politikası, ödeme altyapımız Paddle'ın zorunlu 14 günlük refund policy gerekliliği doğrultusunda uygulanmaktadır.
                </p>

                <p>
                  14 günlük süre içinde yapılan tüm iade talepleri, koşulsuz olarak işleme alınır.
                </p>
              </div>

              <h3 className="font-semibold text-base">2. İade Süreci Nasıl İşler?</h3>
              <div className="text-gray-700 dark:text-gray-300 space-y-2">
                <p>
                  İade talepleri, ödemenin gerçekleştiği platform olan Paddle üzerinden işlenir ve ödemenin yapıldığı yöntemle kullanıcının hesabına iade edilir.
                </p>

                <p><strong>İade süreci şu adımlarla ilerler:</strong></p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Kullanıcı iade talebini iletir</li>
                  <li>Talep Paddle tarafından doğrulanır</li>
                  <li>İade, ödeme yöntemine bağlı olarak genellikle 3–10 iş günü içinde tamamlanır</li>
                </ul>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-2">
                  <p><strong>İade talepleri için:</strong></p>
                  <p className="mt-1">
                    📩 <a href="mailto:sellers@paddle.com" className="text-emerald-600 dark:text-emerald-400 hover:underline">sellers@paddle.com</a>
                  </p>
                  <p className="mt-1">veya</p>
                  <p className="mt-1">
                    📩 <a href="mailto:info@kreditakip.com.tr" className="text-emerald-600 dark:text-emerald-400 hover:underline">info@kreditakip.com.tr</a>
                  </p>
                </div>
              </div>

              <h3 className="font-semibold text-base">3. 14 Günlük Süre Sonrası İade Talepleri</h3>
              <div className="text-gray-700 dark:text-gray-300 space-y-2">
                <p>
                  14 günlük yasal/policy süresi dolduktan sonra yapılan iade talepleri Paddle tarafından kabul edilmemektedir.
                </p>

                <p>
                  Ancak ürünle ilgili bir teknik sorun yaşanması durumunda, destek ekibimiz çözüm üretmek için kullanıcılarımızla birebir çalışacaktır.
                </p>
              </div>

              <h3 className="font-semibold text-base">4. Abonelik İptalleri</h3>
              <div className="text-gray-700 dark:text-gray-300 space-y-2">
                <p>
                  Kredi Takip aboneliğinizi dilediğiniz zaman iptal edebilirsiniz.
                </p>

                <p><strong>İptal işlemi sonrasında:</strong></p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Mevcut fatura döneminin sonuna kadar hizmetlerden yararlanmaya devam edersiniz</li>
                  <li>İptal işlemi ileriye dönük geçerlidir; geçmiş dönemlere ilişkin iadeler Paddle politikaları gereği yapılamamaktadır</li>
                </ul>
              </div>

              <h3 className="font-semibold text-base">5. Dijital Hizmet Niteliği</h3>
              <div className="text-gray-700 dark:text-gray-300 space-y-2">
                <p>
                  Kredi Takip tamamen dijital bir ürün olduğundan, üyelik aktivasyonuyla birlikte hizmete anında erişim sağlanır.
                </p>

                <p className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                  Buna rağmen Paddle'ın global policy'si gereği, dijital ürünlerde dahi 14 günlük koşulsuz iade hakkı sunulmaktadır.
                </p>
              </div>

              <h3 className="font-semibold text-base">6. Haksız Kullanım / Kötüniyetli İade Talepleri</h3>
              <div className="text-gray-700 dark:text-gray-300 space-y-2">
                <p className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  Nadir durumlarda, sistemin kötüye kullanıldığı tespit edilirse Paddle ek doğrulamalar isteyebilir.
                </p>

                <p>
                  Bu tür durumlarda Kredi Takip, kullanıcı hesabını inceleme altına alma veya askıya alma hakkını saklı tutar.
                </p>
              </div>

              <h3 className="font-semibold text-base mt-4">7. İletişim</h3>
              <div className="text-gray-700 dark:text-gray-300 space-y-2">
                <p>
                  İptal ve iade süreçleriyle ilgili tüm sorular için bizimle iletişime geçebilirsiniz:
                </p>

                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 space-y-1">
                  <p>
                    📩 <a href="mailto:info@kreditakip.com.tr" className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">info@kreditakip.com.tr</a>
                  </p>
                  <p>
                    🌐 <a href="https://kreditakip.com.tr" className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">kreditakip.com.tr</a>
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              onClick={() => {
                setPrivacyAccepted(true)
                setShowPrivacyDialog(false)
                toast({
                  title: "Onaylandı",
                  description: "İptal-İade politikasını kabul ettiniz.",
                })
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Onaylıyorum
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* KVKK Dialog */}
      <Dialog open={showKvkkDialog} onOpenChange={setShowKvkkDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>KVKK Aydınlatma Metni</DialogTitle>
            <DialogDescription>
              Kişisel verilerinizin korunması hakkında bilgilendirme
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4 text-sm">
              <h3 className="font-semibold text-base text-gray-900 dark:text-white">KİŞİSEL VERİLERİN İŞLENMESİNE İLİŞKİN AYDINLATMA METNİ</h3>
              <p className="text-gray-700 dark:text-gray-300 text-xs">
                Bu Aydınlatma Metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kredi ve finans takibi hizmeti kapsamında kullanıcılarınızdan toplanan kişisel verilerin nasıl işlendiğini, saklandığını, korunduğunu, kimlerle paylaşıldığını ve kullanıcı haklarının neler olduğunu açıklamak amacıyla hazırlanmıştır.
              </p>

              <h3 className="font-semibold text-base mt-4">1. Veri Sorumlusu</h3>
              <div className="text-gray-700 dark:text-gray-300 space-y-1">
                <p><strong>Veri Sorumlusu:</strong> Kredi Takip (kreditakip.com.tr)</p>
                <p><strong>E-posta:</strong>{" "}
                  <a href="mailto:info@kreditakip.com.tr" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                    info@kreditakip.com.tr
                  </a>
                </p>
                <p><strong>Tel:</strong>{" "}
                  <a href="tel:+905432035309" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                    0 543 203 53 09
                  </a>
                </p>
                <p><strong>Adres:</strong> Çeşme / İzmir, Türkiye</p>
              </div>

              <h3 className="font-semibold text-base mt-4">2. İşlenen Kişisel Veriler & Toplama Yöntemleri</h3>
              <div className="text-gray-700 dark:text-gray-300 space-y-2">
                <p className="text-xs">
                  Aşağıda listelenen veri tipleri, elektronik ortamda (web sitesi, mobil uygulama, e-posta, form, dosya yükleme gibi) ya da fiziken/manuel olarak toplanabilir:
                </p>

                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2">
                  <p className="font-semibold text-xs">Kimlik ve iletişim bilgileri:</p>
                  <p className="text-xs">ad, soyad, e-posta adresi, telefon numarası</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2">
                  <p className="font-semibold text-xs">Finansal veriler:</p>
                  <p className="text-xs">Kredi/banka dökümanları (PDF), şifrelenmiş banka bilgileri, ödeme planları, kredi/borç durumu</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2">
                  <p className="font-semibold text-xs">Teknik ve kullanım verileri:</p>
                  <p className="text-xs">IP adresi, cihaz bilgileri, tarayıcı bilgileri, log kayıtları, kullanım geçmişi</p>
                </div>
              </div>

              <h3 className="font-semibold text-base mt-4">3. İşleme Amaçları ve Hukuki Sebepleri</h3>
              <div className="text-gray-700 dark:text-gray-300 space-y-2 text-xs">
                <p>Toplanan kişisel veriler, aşağıdaki amaçlarla ve hukuki sebeplere dayanarak işlenmektedir:</p>

                <div className="space-y-1">
                  <p>• <strong>Hizmet sunumu:</strong> KVKK m.5/2(c) - Sözleşmenin kurulması ve ifası</p>
                  <p>• <strong>Destek ve iletişim:</strong> KVKK m.5/2(e) - Hakkın tesis edilmesi/korunması</p>
                  <p>• <strong>Güvenlik:</strong> KVKK m.5/2(f) - Meşru menfaat</p>
                  <p>• <strong>Hukuki yükümlülük:</strong> KVKK m.5/2(ç) - Yasal düzenlemeler</p>
                </div>
              </div>

              <h3 className="font-semibold text-base mt-4">4. Verilerin Aktarımı ve Yurt Dışı Veri Transferi</h3>
              <div className="text-gray-700 dark:text-gray-300 space-y-1 text-xs">
                <p className="font-semibold">Kullanıcı verileri, yurt dışına aktarılmamaktadır.</p>
                <p>
                  Teknik altyapı sağlayıcılarımız Türkiye merkezli ya da KVKK uyumlu, güvenliği sağlanmış hizmet sağlayıcılardır. Verilerin aktarımı SSL/TLS gibi güvenli protokollerle şifrelenmiştir.
                </p>
              </div>

              <h3 className="font-semibold text-base mt-4">5. Veri Güvenliği ve Saklama Süresi</h3>
              <div className="text-gray-700 dark:text-gray-300 space-y-1 text-xs">
                <p>
                  Verilerin güvenliği için idari, teknik ve fiziksel tedbirler uygulanmaktadır. Finansal ve hassas veriler şifreli biçimde saklanmakta, erişim kontrolleri ile korunmaktadır.
                </p>
                <p>
                  Veriler, işleme amaçlarının sürdüğü süre boyunca ve mevzuatta öngörülen saklama süreleri çerçevesinde muhafaza edilir.
                </p>
              </div>

              <h3 className="font-semibold text-base mt-4">6. İlgili Kişinin Hakları</h3>
              <div className="text-gray-700 dark:text-gray-300 space-y-2">
                <p className="text-xs"><strong>KVKK'nın 11. maddesi uyarınca</strong> aşağıdaki haklara sahipsiniz:</p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                  <li>İşlenmişse bilgi talep etme</li>
                  <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
                  <li>Verilerin silinmesini veya anonim hâle getirilmesini isteme</li>
                  <li>İşlemenin kısıtlanmasını isteme</li>
                  <li>Otomatik sistemlerle analiz nedeniyle itiraz etme</li>
                  <li>Hak ihlali durumunda ilgili kuruma şikayette bulunma</li>
                </ul>

                <p className="text-xs mt-2">
                  Taleplerinizi kimliğinizi doğrulayarak e-posta veya telefon yoluyla iletebilirsiniz; başvurunuz <strong>30 gün içinde</strong> yazılı olarak yanıtlanacaktır.
                </p>
              </div>

              <h3 className="font-semibold text-base mt-4">7. Çerez (Cookie) ve Benzeri Teknolojiler</h3>
              <div className="text-gray-700 dark:text-gray-300 text-xs">
                <p>
                  Web sitemiz ve uygulamalarımız, ziyaretçi deneyimini iyileştirmek, güvenlik ve analiz amaçlı çerez veya benzeri izleme teknolojileri kullanabilir. Detaylı bilgi için Çerez Politikası sayfamızı inceleyebilirsiniz.
                </p>
              </div>

              <h3 className="font-semibold text-base mt-4">8. Değişiklik ve Güncellemeler</h3>
              <div className="text-gray-700 dark:text-gray-300 text-xs">
                <p>
                  Bu Aydınlatma Metni, kanun, mevzuat ya da hizmet süreçlerimizde meydana gelecek değişiklikler nedeniyle güncellenebilir. Güncellenen yeni metin, web sitesinde yayınlandığı anda yürürlüğe girer.
                </p>
              </div>

              <h3 className="font-semibold text-base mt-4">İletişim</h3>
              <div className="text-gray-700 dark:text-gray-300 space-y-1 text-xs">
                <p>Kişisel verilerinizle ilgili sorularınız ve talepleriniz için:</p>
                <p>
                  <strong>E-posta:</strong>{" "}
                  <a href="mailto:info@kreditakip.com.tr" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                    info@kreditakip.com.tr
                  </a>
                </p>
                <p>
                  <strong>Tel:</strong>{" "}
                  <a href="tel:+905432035309" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                    0 543 203 53 09
                  </a>
                </p>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              onClick={() => {
                setKvkkAccepted(true)
                setShowKvkkDialog(false)
                toast({
                  title: "Onaylandı",
                  description: "KVKK Aydınlatma metnini kabul ettiniz.",
                })
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Onaylıyorum
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
